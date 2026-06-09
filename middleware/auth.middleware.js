const jwt = require('jsonwebtoken')
const User = require('./../models/User')
const _ = require('lodash')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { errorResponseWithHTTPStatus } = require('../utils')
const { HTTP_UNAUTHORIZED_401 } = require('../utils/http.status')
const { ssoGenerateTokenHash } = require('../utils/manageSSOToken')
const { safeGet } = require('../utils/redis.util')
const { contextStore } = require('../utils/request-context')
const Log = require('../logger/log')
const SUPER_ADMIN = 'SUPER_ADMIN'
const ROLE_ANALYTICS = 'ANALYTICS'
const ROLE_SUPPORT = 'SUPPORT'
const ROLE_REFERRAL = 'REFERRAL'
const ROLE_ACCOUNT_MANAGER = 'ACCOUNT_MANAGER'
const LINK_REFERRAL = 'LINK_REFERRAL'
let USE_SECURE_JWT = process.env.JWT_SECRET || false

/**
 * @description Get JWT secret key
 * @param {string} token The token
 * @returns {Promise<string>} The JWT secret key
 */
async function getJWT(token) {
    let secretOrKey = process.env.JWT_SECRET || ''

    if (USE_SECURE_JWT) {
        const decodedToken = jwt.decode(token)
        const roleToken = _.get(decodedToken, 'role', -1)

        if (roleToken === SUPER_ADMIN) {
            let user = await User.findOne({ _id: decodedToken.id, is_deleted: { $ne: true } }, 'jwtSecret')
            if (!user || user._id === undefined)
                secretOrKey = ''

            if (user._id) {
                const context = contextStore.getStore()
                if (context) {
                    context.userId = user._id
                }
            }
        }
    }
    return secretOrKey
}

/**
 * @description Protect route for admin
 * @param {object} req The request object
 * @param {object} res The response object
 * @param {Function} next allow to access route
 * @returns {object} return error if Unauthorized
 */
async function protectAdminRoute(req, res, next) {
    let token = _.get(req, 'headers.authorization', '')
    if (!_.isEmpty(token)) {
        let actualToken = token.split(' ')
        actualToken = actualToken[actualToken.length - 1]
        const secretOrKey = await getJWT(actualToken)

        jwt.verify(actualToken, secretOrKey, async function (err, decoded) {
            if (err) {
                return res.status(401).send({ error: 'You are not authorized' })
            }
            if (decoded.role !== SUPER_ADMIN) {
                return res.status(401).send({ error: 'You are not authorized' })
            }
            req.decoded = decoded
            next()
        })
    } else {
        return res.status(401).send({ error: 'You are not authorized to access this route' })
    }
}

/**
 * @description check protected route with user role
 * @param {Array} allowedRoles possible values are SUPER_ADMIN | ROLE_ANALYTICS
 * @returns {Function} next or error
 */
const protectRouteWithRole = (allowedRoles) => {
    return async (req, res, next) => {
        let authorizationToken = _.get(req, 'headers.authorization', '')
        if (_.isEmpty(authorizationToken)) {
            return res.status(401).send({ error: 'You are not authorized to access this route' })
        }
        let actualToken = authorizationToken.split(' ')
        const token = actualToken[actualToken.length - 1]
        const secretOrKey = await getJWT(token)

        jwt.verify(token, secretOrKey, async function (err, decoded) {
            const user = await User.findOne({ _id: decoded.id, is_deleted: { $ne: true } }, '_id')

            if (!user) {
                return res.status(401).send({ error: 'You are not authorized' })
            }
            if (err) {
                return res.status(401).send({ error: 'You are not authorized' })
            }
            const role = _.get(decoded, 'role', -1)
            if (allowedRoles.indexOf(role) == -1) {
                return res.status(401).send({ error: 'You are not authorized' })
            }
            req.decoded = decoded
            next()
        })
    }
}

/**
 * @description Protect route for website
 *
 * @param {object} req The request object
 * @param {object} res The response object
 * @param {Function} next allow to access route
 * @returns {object} return error if Unauthorized
 */
async function protectWebsiteRoute(req, res, next) {
    const token = _.get(req, 'headers.token', _.get(req, 'query.token', ''))
    if (token !== API_STATIC_AUTH_TOKEN) return errorResponseWithHTTPStatus(res, {}, 'Unauthorized', HTTP_UNAUTHORIZED_401)
    next()
}

/**
 * @description Verify SSO hash
 *
 * @param {object} req The request object
 * @param {object} res The response object
 * @param {Function} next allow to access route
 * @returns {object} return error if Unauthorized
 */
async function verifySSOTokenHash(req, res, next) {
    const hash = _.get(req, 'body.hash', '')
    if (hash === '') {
        Log.error('Missing SSO Token Hash', { data: req.body }, 'FF-SSO-001')
        return errorResponseWithHTTPStatus(res, {}, 'Unauthorized', HTTP_UNAUTHORIZED_401)
    }

    const data = { ...req.body, hash: undefined }
    const getWebsiteSecret = await safeGet(`sso:secret:${req.body.source_domain}`)
    const generateHash = ssoGenerateTokenHash(data, getWebsiteSecret)
    if (generateHash !== hash) {
        Log.error('Invalid SSO Token Hash', { data }, 'FF-SSO-002')
        return errorResponseWithHTTPStatus(res, {}, 'Unauthorized', HTTP_UNAUTHORIZED_401)
    }

    next()
}

module.exports = {
    protectAdminRoute,
    protectRouteWithRole,
    protectWebsiteRoute,
    verifySSOTokenHash,
    SUPER_ADMIN,
    ROLE_ANALYTICS,
    ROLE_SUPPORT,
    ROLE_REFERRAL,
    ROLE_ACCOUNT_MANAGER,
    LINK_REFERRAL
}
