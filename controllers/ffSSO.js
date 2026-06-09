const TEMP_TOKEN_TTL_SECOND = 60 * 60
const ACCESS_TOKEN_TTL_SECOND = 60 * 60 * 24 * 30

const UserSession = require('../models/UserSession')
const SSOTempToken = require('../models/SSOTempToken')
const { errorResponse, successResponse } = require('../utils')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { HTTP_BAD_REQUEST_400, HTTP_BAD_REQUEST_401 } = require('../utils/http.status')
const UniversalUsersSchema = require('../models/UniversalUsers')
const router = require('express').Router()
const Joi = require('joi')
const { v4: uuidv4 } = require('uuid')
const { safeExists, safeDel, safeAdd, safeDelMembers, safeHset, safeHGet, safeGet } = require('../utils/redis.util')
const { generateSSOHash, verifySSOHash, setWebsiteSSOSecretToRedis, ssoGenerateTokenHash } = require('../utils/manageSSOToken')
const _ = require('lodash')
const { verifySSOTokenHash } = require('../middleware/auth.middleware')
const Log = require('../logger/log')

const logoutUserSessionSchema = Joi.object({
    access_token: Joi.string().required(),
    ip_address: Joi.string().optional()
})

const generateTempTokenSchema = Joi.object({
    email: Joi.string().required(),
    ip_address: Joi.string().optional(),
    source_domain: Joi.string().required(),
    access_token: Joi.string().optional(),
    hash: Joi.string().required()
})

const generateAccessTokenSchema = Joi.object({
    email: Joi.string().optional(),
    ip_address: Joi.string().optional(),
    source_domain: Joi.string().required(),
    token: Joi.string().required(),
    create_temp_token: Joi.boolean().optional(),
    hash: Joi.string().required()
})

const verifyAccessTokenSchema = Joi.object({
    access_token: Joi.string().required(),
    ip_address: Joi.string().optional()
})

/**
 * @description Generate Temp Token
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/generate-temp-token', verifySSOTokenHash, async (req, res) => {
    try {
        await generateTempTokenSchema.validateAsync(req.body)
    } catch (error) {
        Log.error('Validation Failed /generate-temp-token', error, 'VAL-SSO-001')
        return errorResponse(res, error, error.message, 400)
    }

    const { email, source_domain, access_token } = req.body

    try {
        let tokenUUID = `ff_${uuidv4()}`
        // Check Redis cache first (fails silently if Redis down)
        if (access_token) {
            const userSession = await safeHGet(`sso:user_session:${access_token}`)
            if (userSession) {
                tokenUUID = _.get(userSession, 'uuid', uuidv4())
            }
        }

        const userData = await UniversalUsersSchema.findOne({ email })
        if (!userData) {
            return errorResponse(res, 'error', 'There was a problem in logging in. ssds', HTTP_BAD_REQUEST_400)
        }

        const tempToken = `ff_${uuidv4()}`
        const tempTokenHash = await generateSSOHash(source_domain, tempToken)

        // SSOTempToken
        const ssoTempTokenData = {
            email,
            source_domain,
            uuid: tokenUUID,
            token_hash: tempTokenHash,
            token: tempToken
        }
        const ssoTempToken = new SSOTempToken(ssoTempTokenData)
        await ssoTempToken.save()

        // Add user temp token to Redis cache (fails silently if Redis down)
        // await safeHset(`sso:temp_token:${tempToken}`, ssoTempTokenData)
        await safeHset(`sso:temp_token:${tempToken}`, ssoTempTokenData, TEMP_TOKEN_TTL_SECOND)


        return successResponse(res, { status: true, temp_token: tempToken }, 'User session created successfully', 200)
    } catch (error) {
        console.log(error)
        Log.error('Error in /generate-temp-token', error, 'ERR-SSO-001')
        return errorResponse(res, error, error.message, 500)
    }
})

/**
 * @description Generate Access Token using temp token
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/generate-access-token', verifySSOTokenHash, async (req, res) => {
    try {
        await generateAccessTokenSchema.validateAsync(req.body)
    } catch (error) {
        Log.error('Validation Failed /generate-access-token', error, 'VAL-SSO-002')
        return errorResponse(res, error, error.message, 400)
    }

    const { email, token, source_domain, create_temp_token } = req.body

    try {
        // Check Redis cache first
        let tempToken = await safeHGet(`sso:temp_token:${token}`)
        if (_.isEmpty(tempToken)) {
            tempToken = await SSOTempToken.findOne({ token }, { uuid: 1 })
        }

        if (_.isEmpty(tempToken)) {
            Log.error('Error in /generate-access-token', { token, source_domain, email, message: 'Temp token not found' }, 'ERR-SSO-002')
            return errorResponse(res, 'error', 'There was a problem in logging in.', HTTP_BAD_REQUEST_400)
        }

        const verifyToken = await verifySSOHash(source_domain, token, tempToken.token_hash)
        if (verifyToken === false) {
            Log.error('Error in /generate-access-token', { token, source_domain, email, message: 'Temp token verification failed' }, 'ERR-SSO-003')
            return errorResponse(res, 'error', 'There was a problem in logging in.', HTTP_BAD_REQUEST_401)
        }

        if (tempToken.source_domain !== source_domain) {
            Log.error('Error in /generate-access-token', { token, tempToken, source_domain, email, message: 'Source domain mismatch' }, 'ERR-SSO-004')
            return errorResponse(res, 'error', 'There was a problem in logging in.', HTTP_BAD_REQUEST_400)
        }

        const userData = await UniversalUsersSchema.findOne({ email: tempToken.email })
        if (!userData) {
            Log.error('Error in /generate-access-token', { token, source_domain, email, message: 'User not found' }, 'ERR-SSO-005')
            return errorResponse(res, 'error', 'There was a problem in logging in.', HTTP_BAD_REQUEST_400)
        }

        const accessToken = `ff_${uuidv4()}`
        const userSessionData = {
            user_id: userData._id,
            email: tempToken.email,
            access_token: accessToken,
            source_domain: tempToken.source_domain,
            uuid: tempToken.uuid
        }

        const userSession = new UserSession(userSessionData)
        await userSession.save()

        // Add user session to Redis cache
        const accessTokenKey = `sso:user_session:${accessToken}`
        const uuidKey = `sso:uuid:${tempToken.uuid}`
        await safeHset(accessTokenKey, userSessionData, ACCESS_TOKEN_TTL_SECOND)
        await safeAdd(uuidKey, accessTokenKey)


        // Delete all temp Token from DB
        await SSOTempToken.deleteOne({ token })

        // Invalidate Redis cache For temp token
        const redisKey = `sso:temp_token:${token}`
        const cacheExists = await safeExists(redisKey)
        if (cacheExists) {
            await safeDel(redisKey)
        }

        // create_temp_token
        let ffTempToken = ''
        if (create_temp_token === true) {
            let tokenUUID = tempToken.uuid

            ffTempToken = `ff_${uuidv4()}`

            // FF Hostname
            const sourceDomain = process.env.FF_DOMAIN
            const ff_domain = new URL(sourceDomain)
            const ff_hostName = ff_domain.hostname
            const tempTokenHash = await generateSSOHash(ff_hostName, ffTempToken)

            // SSOTempToken
            const ssoTempTokenData = {
                email,
                source_domain: ff_hostName,
                uuid: tokenUUID,
                token_hash: tempTokenHash,
                token: ffTempToken
            }

            const ssoTempToken = new SSOTempToken(ssoTempTokenData)
            await ssoTempToken.save()

            // Add user temp token to Redis cache (fails silently if Redis down)
            await safeHset(`sso:temp_token:${ffTempToken}`, ssoTempTokenData, TEMP_TOKEN_TTL_SECOND)
        }

        return successResponse(res, { status: true, access_token: accessToken, temp_token: ffTempToken }, 'User session created successfully', 200)
    } catch (error) {
        console.log(error)
        Log.error('Error in /generate-access-token', error, 'ERR-SSO-002')
        return errorResponse(res, error, error.message, 500)
    }
})

/**
 * @description Generate Access Token using temp token
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/verify-access-token', async (req, res) => {
    try {
        await verifyAccessTokenSchema.validateAsync(req.body)
    } catch (error) {
        Log.error('Validation failed', error, 'VAL-SSO-003')
        return errorResponse(res, error, error.message, 400)
    }

    const { access_token } = req.body

    try {
        // Check Redis cache first
        let tempToken = await safeHGet(`sso:user_session:${access_token}`)
        if (_.isEmpty(tempToken)) {
            tempToken = await UserSession.findOne({ access_token }, { uuid: 1, email: 1 })
            if (_.isEmpty(tempToken)) {
                Log.error('Error in /verify-access-token', { access_token, message: 'User session not found' }, 'ERR-SSO-006')
                return errorResponse(res, 'error', 'Invalid session.', HTTP_BAD_REQUEST_400)
            }
            // Add user session to Redis cache
            const accessTokenKey = `sso:user_session:${access_token}`
            const uuidKey = `sso:uuid:${tempToken.uuid}`
            await safeHset(accessTokenKey, tempToken, ACCESS_TOKEN_TTL_SECOND)
            await safeAdd(uuidKey, accessTokenKey)
        }

        return successResponse(res, { status: true, email: tempToken.email }, 'User session verified successfully', 200)
    } catch (error) {
        Log.error(error.message, error, 'ERR-SSO-003')
        return errorResponse(res, error, error.message, 500)
    }
})

/**
 * @description Logout User Session
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/logout-user-session', async (req, res) => {
    try {
        await logoutUserSessionSchema.validateAsync(req.body)
    } catch (error) {
        Log.error('Validation Failed /logout-user-session', error, 'VAL-SSO-004')
        return errorResponse(res, error, error.message, 400)
    }

    const { access_token } = req.body

    try {
        const getSessionData = await UserSession.findOne({ access_token }, { _id: 0, uuid: 1 })
        if (!getSessionData) {
            Log.error('Error in /logout-user-session', { access_token, message: 'User session not found' }, 'ERR-SSO-007')
            return errorResponse(res, 'error', 'There was a problem in logout.', HTTP_BAD_REQUEST_400)
        }
        // Delete all uuid records
        await UserSession.deleteMany({ uuid: getSessionData.uuid })

        // Invalidate Redis cache (fails silently if Redis down)
        const redisKey = `sso:uuid:${getSessionData.uuid}`
        await safeDelMembers(redisKey)


        return successResponse(res, { status: true }, 'Logout successfully', 200)
    } catch (error) {
        Log.error('Error in /logout-user-session', error, 'ERR-SSO-004')
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/get-website-sso-secret', async (req, res) => {
    try {
        const { domain, hash } = req.body

        const data = { ...req.body, hash: undefined }
        const generateRequestBodyHash = ssoGenerateTokenHash(data, API_STATIC_AUTH_TOKEN)
        if (generateRequestBodyHash !== hash) {
            Log.error('Error in /get-website-sso-secret', { domain, hash, message: 'Request body hash verification failed' }, 'ERR-SSO-008')
            return errorResponse(res, 'error', 'There was a problem in getting website sso secret.', HTTP_BAD_REQUEST_400)
        }

        const redisKeyForWebsiteSecret = `sso:secret:${domain}`
        const cacheExists = await safeExists(redisKeyForWebsiteSecret)
        if (!cacheExists) {
            await setWebsiteSSOSecretToRedis()
        }
        const getWebsiteSecret = await safeGet(redisKeyForWebsiteSecret)
        if (!getWebsiteSecret) {
            Log.error('Error in /get-website-sso-secret', { domain, hash, message: 'Website sso secret not found' }, 'ERR-SSO-009')
            return errorResponse(res, 'error', 'There was a problem in getting website sso secret.', HTTP_BAD_REQUEST_400)
        }
        return successResponse(res, { status: true, sso_secret: getWebsiteSecret }, 'Website sso secret fetched successfully', 200)
    } catch (error) {
        console.log(error)
        Log.error('Error in /get-website-sso-secret', error, 'ERR-SSO-005')
        return errorResponse(res, error, error.message, 500)
    }
})


module.exports = router
