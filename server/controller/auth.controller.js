import FormData from 'form-data'
import sgMail from '@sendgrid/mail'
import { successResponse, errorResponse, validateRequest } from '../helper/common.js'
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from '../helper/http.status.js'
import _ from 'lodash'
import { LoginSchema, RegisterSchema, universalUserDetailsSchema } from '../validation/auth.validation.js'
import {
    registerUserInServices,
    checkUserIsExist,
    checkUniversalUserIsExist,
    registerUniversalUser,
    updateUserInUniversal,
    getUserFromWebsite,
    checkUniversalUserInService,
    storeForgotPasswordToken,
} from '../utils/UniversalLogin.js'
import { REQ_FROM_REGISTER, REQ_FROM_LOGIN } from '../utils/constants.js'
import { getAppSettings } from '../utils/AppSettings.js'
import { checkEmailOrCardDataInServicesBlockList } from '../middleware/card-check.middleware.js'
import { generateToken } from '../utils/generateToken.js'
import { getCustomArgumentOfEmail } from '../utils/getCustomArgumentOfEmail.js'
import { sendEmail } from '../utils/sendEmail.js'
import createUser from '../utils/createUser.js'
import { generateSSOAccessToken } from '../utils/sso.js'
import { websiteApiRequest } from '../utils/axiosClient.js'

export const loginUser = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = LoginSchema.validate(req.body)
        if (error) {
            return errorResponse(res, {}, error.details[0].message, HTTP_BAD_REQUEST_400)
        }

        const { email, password, sourceDomain, action } = value
        const userEmail = email.trim().toLowerCase()

        const userDetails = { email: userEmail, password }

        // Check user in local DB
        const responseUser = await checkUserIsExist(userDetails, sourceDomain, action, REQ_FROM_LOGIN)
        let user = _.get(responseUser, 'data.data', {})
        let response = {}

        // If universal login allowed but user isn't universal yet
        const userHasUniversalLogin = _.get(user, 'universal_login', false)

        if (!userHasUniversalLogin) {
            response = await registerUserInServices(sourceDomain, userDetails, REQ_FROM_LOGIN, action)
            const {
                isUserMergeInUniversal = false,
                showMergePopup = false,
                showForgotPasswordPopup = false,
                showOldUserMergePopup = false
            } = response

            // Merge user into universal system
            if (isUserMergeInUniversal) {
                user = _.isEmpty(user)
                    ? await registerUniversalUser(response.userDetails, sourceDomain)
                    : await updateUserInUniversal(email, sourceDomain, { universal_login: true })
            }

            // Add universal flag in response
            response.isUniversalLoginEnabled = true

            // Need popup UI response (no token yet)
            if (showMergePopup || showForgotPasswordPopup || showOldUserMergePopup) {
                return successResponse(res, response, 'Login user Successfully')
            }
        }

        // If user not exist
        if (_.isEmpty(user)) {
            return errorResponse(res, 'Invalid email or password.', '', HTTP_BAD_REQUEST_400)
        }

        // Create FF Token From services
        const domain = new URL(req.headers.origin).hostname
        const ip = req.clientIp
        const FFAccessToken = await generateSSOAccessToken(sourceDomain, email, ip)
        if (FFAccessToken === false) {
            return errorResponse(res, {}, 'Something went wrong. Please try again.', HTTP_BAD_REQUEST_400)
        }

        // Prepare final response
        const data = {
            token: FFAccessToken,
            showDifferentPasswordPopup: _.get(response, 'showDifferentPasswordPopup', false),
            siteListOfDifferentPassword: _.get(response, 'siteListOfDifferentPassword', []),
            isUniversalLoginEnabled: true
        }
        return successResponse(res, data, 'User login successfully')
    } catch (error) {
        console.log(error)
        let errorMessage = _.get(error, 'response.data.errors.message', 'Error occurred while login. Please try again')
        if (error.response !== undefined) {
            errorMessage = error.response.data.message
        }
        if (error === 'ERR_10001') {
            return errorResponse(res, { errorCode: 'ERR_10001' }, 'There was a problem while login. Please report here', HTTP_INTERNAL_SERVER_ERROR_500)
        }
        if (_.isEmpty(error.message) === false) {
            errorMessage = error.message
        }
        return errorResponse(res, errorMessage, 'Error occurred while login. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const registerUser = async (req, res) => {
    try {
        const { error, value } = RegisterSchema.validate(req.body)
        if (error) {
            errorResponse(res, {}, error.details[0].message, HTTP_BAD_REQUEST_400)
            return
        }

        const { name, email, password, phone_number, sourceDomain, country_code } = value
        const action = _.get(req, 'body.action', '')

        const userEmail = email.trim().toLowerCase()
        // check user already exist in the website 
        const checkUniversalUserExist = await checkUniversalUserIsExist(userEmail, sourceDomain, action, REQ_FROM_REGISTER)
        if (checkUniversalUserExist !== null) {
            return errorResponse(res, { errors: 'This email is already in use. Please log in to access your account.' }, 'This email is already in use. Please log in to access your account.', HTTP_BAD_REQUEST_400)
        }

        // Register user in services for universal login
        const userDetails = {
            name,
            email: userEmail,
            password,
            phone_number,
            country_code
        }
        let response = await registerUserInServices(sourceDomain, userDetails, REQ_FROM_REGISTER, action, false, true)
        // if user exist in other website then show merge account popup
        const showMergePopup = _.get(response, 'showMergePopup', false)
        // if user register with different password then show forgot password popup when user is universal user in service
        const showForgotPasswordPopup = _.get(response, 'showForgotPasswordPopup', false)
        // show old user merge account popup if user exist
        const showOldUserMergePopup = _.get(response, 'showOldUserMergePopup', false)

        response.isUniversalLoginEnabled = true
        if (showMergePopup || showForgotPasswordPopup || showOldUserMergePopup) return successResponse(res, response, 'User account find in another websites')

        // If user not exist in any website then we merge user into universal directly
        const isUserMergeInUniversal = _.get(response, 'isUserMergeInUniversal', false)
        const newUser = response.userDetails
        if (isUserMergeInUniversal) {
            newUser.universal_login = true
            try {
                await universalUserDetailsSchema.validateAsync(response.userDetails)
            } catch (error) {
                return errorResponse(res, error, 'Something went wrong. Please try after some time', HTTP_BAD_REQUEST_400)
            }

            const updateFields = ['default_payment_method', 'payment_gateway', 'card_id', 'wallet_amount', 'last_used_crypto_currency']
            updateFields.map(keyName => {
                const value = _.get(response, `userDetails.${keyName}`, '')
                if (!_.isEmpty(value)) {
                    newUser[keyName] = value
                }
            })
        }
        // update user info
        delete newUser._id
        await updateUserInUniversal(email, sourceDomain, newUser)

        // Create FF Token From services
        const domain = new URL(req.headers.origin).hostname
        const ip = req.clientIp
        const FFAccessToken = await generateSSOAccessToken(domain, email, ip)
        if (FFAccessToken === false) {
            return errorResponse(res, {}, 'Something went wrong. Please try again. 2', HTTP_BAD_REQUEST_400)
        }

        // Prepare final response
        response.authToken = FFAccessToken
        return successResponse(res, response, 'User register successfully')
    } catch (error) {
        let errorMessage = _.get(error, 'response.data.errors.message', 'Error occurred while register. Please try again')
        if (_.isEmpty(error.message) === false) {
            errorMessage = error.message
        }
        if (error.response !== undefined) {
            errorMessage = error.response.data.message
        }
        if (error === 'ERR_10001') {
            return errorResponse(res, { errorCode: 'ERR_10001' }, 'There was a problem while registering. Please report here', HTTP_INTERNAL_SERVER_ERROR_500)
        }
        return errorResponse(res, errorMessage, 'Error occurred while register. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toString().trim().toLowerCase()
        if (_.isEmpty(email)) return errorResponse(res, {}, 'Email is required.', HTTP_BAD_REQUEST_400)

        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) return errorResponse(res, {}, 'domain is required', HTTP_BAD_REQUEST_400)

        const requestFrom = _.get(req, 'body.requestFrom', '')
        const isOldUser = _.get(req, 'body.oldUser', false)

        const enable_universal_block = await getAppSettings(domain, 'enable_universal_block')
        if (enable_universal_block === true) {
            let isEmailBlocked = await checkEmailOrCardDataInServicesBlockList(domain, email)
            if (isEmailBlocked === true) {
                // This case is not handle in test cases
                const logData = {
                    email,
                    ip: req.clientIp,
                    request_url: '/forgot_password'
                }
                if (requestFrom === 'forgot_password') {
                    logData.user_id = user._id
                }
                addUniversalBlockLog(logData)
                return successResponse(res, {}, 'Reset password link send successfully.')
            }
        }

        const project = {
            ccbill_subscription_status: 1,
            isAdmin: 1
        }
        const response = await getUserFromWebsite(email, domain, project)

        const userData = response

        // check request is empty for send forgot password link to add new universal user
        if (requestFrom === 'forgot_password') {
            if (_.isEmpty(userData)) return successResponse(res, {}, 'Reset password link send successfully.')
        } else {
            // check universal user in service while send reset password link request from register and login page
            const data = {
                email: email,
                requestFrom: 'forgot_password'
            }
            const universalUser = await checkUniversalUserInService(data, domain)
            if (universalUser === false) {
                return successResponse(res, {}, 'Reset password link send successfully.')
            }
        }

        let token = generateToken()
        const sendgridApiKey = process.env.SENDGRID_API_KEY

        let from_email = 'noreply@fanfavour.com'
        const FFClientDomain = new URL(process.env.FF_CLIENT_DOMAIN)
        const ffDomainHostname = FFClientDomain.hostname

        let passwordResetLink = `${FFClientDomain}change-password/${token}?domain=${domain}`
        const customArgs = await getCustomArgumentOfEmail(from_email, 'forgot_password', domain)
        const msg = {
            to: email,
            from: from_email,
            subject: `Request for changing Password for FanFavour`,
            custom_args: customArgs,
            text: `You can change your password by clicking on the link below. ${passwordResetLink}`,
            html: `
        <!DOCTYPE html>
        <html>
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            </head>
            <body>
                You can change your password by clicking on the link below.<br /><a href='${passwordResetLink}'>${passwordResetLink}</a>
            </body>
        </html>
                    `
        }

        const isSentEmail = await sendEmail(msg, sendgridApiKey)

        if (isSentEmail) {
            // UpdateEmailCounter(1)
            let tokenData = {
                token: token
            }

            // check requestFrom not from register and login
            if (requestFrom === 'forgot_password') {
                tokenData.userId = userData._id
            } else if ([REQ_FROM_REGISTER, REQ_FROM_LOGIN].includes(requestFrom)) {
                tokenData.email = email
                if (_.isEmpty(userData)) {
                    tokenData.isCreateNewAccount = true
                    tokenData.mergeOldUser = isOldUser
                } else {
                    tokenData.mergeOldUser = true
                }
            } else {
                tokenData.email = email
                tokenData.mergeOldUser = true
                tokenData.userId = user._id
            }
            await storeForgotPasswordToken(domain, tokenData)
        }
        return successResponse(res, {}, 'Reset password link send successfully.')
    } catch (error) {
        return errorResponse(res, error, 'Error while send reset password link', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getUserDetails = async (req, res) => {
    try {
        const is_request_from_login_or_signup_api = _.get(req, 'query.is_request_from_login_or_signup_api', false)
        const domain = _.get(req, 'query.domain', '')
        const email = _.get(req, 'query.email', '')
        let isNewUser = false
        if (is_request_from_login_or_signup_api === 'false' && email !== '') {
            const responseData = await checkUniversalUserIsExist(email, domain)
            if (responseData === null) {
                await createUser(email, domain)
                isNewUser = true
            }
        }

        const params = {
            is_request_from_login_or_signup_api: is_request_from_login_or_signup_api,
            requestFrom: 'FF'
        }

        const response = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/users/me',
            params,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })
        const userData = {
            ...response.data,
            isNewUser
        }
        return successResponse(res, userData, 'Get the user details successfully.')
    } catch (error) {
        const errorStatusCode = _.get(error, 'response.status', HTTP_INTERNAL_SERVER_ERROR_500)
        const errorMessage = _.get(error, 'response.data.message', 'Error while while get user detail')
        return errorResponse(res, error, errorMessage, errorStatusCode)
    }
}

export const updateProfile = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body', 'Data is required.')

        if (!validated) return
        const { domain, data } = validated

        const formData = new FormData()

        // Append text fields
        Object.keys(data).forEach(key => {
            formData.append(key, data[key])
        })

        // Append file
        if (req.files?.avatarUrl) {
            const file = req.files.avatarUrl

            formData.append(
                'avatarUrl',
                file.data,
                file.name
            )
        }
        formData.append('requestFrom', 'FF')

        const headers = {
            ...formData.getHeaders()
        }

        const response = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/change_profile_details',
            data: formData,
            headers,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })

        return successResponse(res, response.data, 'Update the user details successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while while update user detail')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const changeOldPassword = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body.data', 'Data is required.')

        if (!validated) return
        const { domain, data } = validated

        const response = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/change_old_password',
            data,
            auth: 'user',
            userAuth: {
                authorization: req.headers.authorization,
                token: req.headers.token
            }
        })

        return successResponse(res, response?.data?.data || {}, 'Change the old password successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while while change old password')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const resetUserPassword = async (req, res) => {
    try {
        const { domain, data } = req.body

        if(_.isEmpty(data)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        if (_.isEmpty(data.token)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        if (_.isEmpty(data.password)) {
            return errorResponse(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const response = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/reset_password',
            data,
        })

        return successResponse(res, response?.data?.data || {}, 'Password update successfully')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while reset password')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
