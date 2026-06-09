const express = require('express')
const router = express.Router()
const Validator = require('validator')
const bcrypt = require('bcryptjs')
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const { protectWebsiteRoute } = require('../middleware/auth.middleware')
const { errorResponseWithHTTPStatus, successResponse } = require('../utils')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } = require('../utils/http.status')
const UniversalUsers = require('../models/UniversalUsers')
const { checkBlockUser } = require('../utils/checkFanFavourUser')
const AllWebsiteUsers = require('../models/AllWebsiteUsers')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

router.post('/user-login', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '')
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, { errors: 'Invalid domain' }, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const password = _.get(req, 'body.password', '')
        if (_.isEmpty(password)) return errorResponseWithHTTPStatus(res, { errors: 'Invalid password' }, 'Invalid password', HTTP_BAD_REQUEST_400)

        let universalUser = await UniversalUsers.findOne({ email: email })

        if (_.isEmpty(universalUser)) {
            return errorResponseWithHTTPStatus(res, { errors: 'Invalid email or password.' }, 'Invalid email or password.', HTTP_BAD_REQUEST_400)
        }

        const isBlock = _.get(universalUser, 'is_blocked', false)
        if (isBlock) return errorResponseWithHTTPStatus(res, { errors: 'Something went wrong. Please try again.' }, 'Something went wrong. Please try again.', HTTP_BAD_REQUEST_400)


        if (!_.isEmpty(universalUser)) {
            const isPasswordMatch = await bcrypt.compare(password, universalUser.password)
            if (isPasswordMatch === false) return errorResponseWithHTTPStatus(res, { errors: 'Invalid email or password.' }, 'Invalid email or password.', HTTP_BAD_REQUEST_400)
        }

        const isBlockUser = await checkBlockUser(sourceDomain, email)
        if (isBlockUser) {
            let errorMessage = 'Email not found'
            if (!_.isEmpty(universalUser)) {
                errorMessage = 'Something went wrong. Please try again.'
            }
            return errorResponseWithHTTPStatus(res, { message: errorMessage }, errorMessage, HTTP_BAD_REQUEST_400)
        }
        let jwtSecret = process.env.JWT_SECRET
        const payload = {
            email: email
        }
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d' })
        const responseData = {
            token: `Bearer ${token}`
        }
        return successResponse(res, responseData, 'Login user successfully.', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in login user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/user-register', protectWebsiteRoute, async (req, res) => {
    try {
        const name = _.get(req, 'body.name', '')
        if (_.isEmpty(name)) return errorResponseWithHTTPStatus(res, { errors: 'Name is required' }, 'Name is required', HTTP_BAD_REQUEST_400)

        const email = _.get(req, 'body.email', '')
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, { errors: 'Invalid email' }, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.domain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, { errors: 'Invalid domain' }, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const password = _.get(req, 'body.password', '')
        if (_.isEmpty(password)) return errorResponseWithHTTPStatus(res, { errors: 'Invalid password' }, 'Invalid password', HTTP_BAD_REQUEST_400)

        const phone_number = _.get(req, 'body.phone_number', '')
        if (_.isEmpty(phone_number)) return errorResponseWithHTTPStatus(res, { errors: 'Phone number is required' }, 'Phone number is required', HTTP_BAD_REQUEST_400)

        const userEmail = email.toLowerCase().trim()
        let universalUser = await UniversalUsers.findOne({ email: userEmail, universal_login_merged_domains: { $in: sourceDomain } })


        if (universalUser === null) {
            universalUser = await AllWebsiteUsers.findOne({ email: userEmail, domain: sourceDomain })
        }
        if (universalUser !== null) {
            return errorResponseWithHTTPStatus(res, { errors: 'This email is already registered. Please log in or use a different email' }, 'This email is already registered. Please log in or use a different email', HTTP_BAD_REQUEST_400)
        }

        const isBlockUser = await checkBlockUser(sourceDomain, email)
        if (isBlockUser) {
            let errorMessage = 'Email not found'
            if (!_.isEmpty(universalUser)) {
                errorMessage = 'Something went wrong. Please try again.'
            }
            return errorResponseWithHTTPStatus(res, { message: errorMessage }, errorMessage, HTTP_BAD_REQUEST_400)
        }
        const baseUrl = getWebsiteDomain(sourceDomain)

        const apiUrl = `${baseUrl}/api/users/register-user`

        const data = {
            name,
            email: userEmail,
            phone_number,
            password
        }
        const response = await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
        const userData = {
            name,
            email: userEmail,
            password: response.data.data.password,
            universal_login_merged_domains: [sourceDomain],
            source_domain: sourceDomain,
            default_payment_method: 'credit_card',
            wallet_amount: 0
        }
        const userUniversal = new UniversalUsers(userData)
        await userUniversal.save()
        return successResponse(res, response.data.data, 'Register user successfully.', 200)
    } catch (error) {
        const errors = _.get(error, 'response.data', 'Error while register user')
        return errorResponseWithHTTPStatus(res, errors, 'Error in register user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/check-universal-user-exist', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.domain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        let isUniversalUserExist = await UniversalUsers.findOne({ email: email, universal_login_merged_domains: { $in: [sourceDomain] } }, '_id')
        if (isUniversalUserExist === null) {
            isUniversalUserExist = await AllWebsiteUsers.findOne({ email, domain: sourceDomain }, '_id')
        }
        return successResponse(res, isUniversalUserExist, 'Check universal user successfully.', 200)
    } catch (error) {
        const errors = _.get(error, 'response.data', 'Error while check universal user is exist')
        return errorResponseWithHTTPStatus(res, errors, 'Error while check universal user is exist', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/generate-auth-token', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '')
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, { errors: 'Invalid email' }, 'Invalid email', HTTP_BAD_REQUEST_400)
        const domain = _.get(req, 'body.domain', '')

        const payload = {
            email,
            domain
        }

        const baseUrl = getWebsiteDomain(domain)
        const apiUrl = `${baseUrl}/api/users/get-jwtSecret`

        const response = await axios.post(apiUrl, { email }, { headers: { token: API_STATIC_AUTH_TOKEN } })
        let jwtSecret = process.env.JWT_SECRET
        if (response.data.success && !_.isEmpty(response.data.data.jwtSecret)) {
            jwtSecret = response.data.data.jwtSecret
        }
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '365d' })
        return successResponse(res, token, 'Generate auth token successfully.', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, error, 'Error in generate auth token', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
