import joi from 'joi'
import _ from 'lodash'
import { errorResponse, successResponse } from '../helper/common.js'
import { HTTP_INTERNAL_SERVER_ERROR_500, HTTP_UNAUTHORIZED_401 } from '../helper/http.status.js'
import { logoutUserSession } from '../helper/sso.js'
import { ssoGenerateTokenHash } from '../utils/sso.js'
import redis from '../redis/config/redis.js'
import Log from '../logger/log.js'
import { servicesApiRequest } from '../utils/axiosClient.js'

const ssoLoginSchema = joi.object({
    token: joi.string().required(),
    source_domain: joi.string().required()
})

export const SsoLogin = async (req, res) => {
    try {
        try {
            await ssoLoginSchema.validateAsync(req.body)
        } catch (error) {
            Log.error('Error in SsoLogin', error, 'VAL-SSO-001')
            return errorResponse(res, error, error.message, 400)
        }

        const token = req.body.token
        const sourceDomain = process.env.FF_CLIENT_DOMAIN
        const ff_domain = new URL(sourceDomain)
        const ff_hostName = ff_domain.hostname
        const generateAccessTokenData = {
            token: token,
            ip_address: req.clientIp,
            source_domain: ff_hostName,
        }

        const domainSecret = await redis.getClient().get(`sso:secret:${ff_hostName}`)
        const requestAccessTokenHash = ssoGenerateTokenHash(generateAccessTokenData, domainSecret)
        const requestAccessTokenData = { ...generateAccessTokenData, hash: requestAccessTokenHash }

        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/generate-access-token',
            data: requestAccessTokenData,
        })
        if (responseData.data.success === 0) {
            Log.error('Error in SsoLogin', {}, 'ERR-SSO-004')
            return errorResponse(res, {}, 'Unauthorized 111', HTTP_UNAUTHORIZED_401)
        }

        const FFAccessToken = _.get(responseData, 'data.data.access_token', '')
        if (_.isEmpty(FFAccessToken)) {
            Log.error('Error in SsoLogin', {}, 'ERR-SSO-004')
            return errorResponse(res, {}, 'Unauthorized 000', HTTP_UNAUTHORIZED_401)
        }
        return successResponse(res, { authToken: FFAccessToken }, 'Logged in successfully.')
    } catch (error) {
        Log.error('Error in SsoLogin', error, 'ERR-SSO-003')
        return errorResponse(res, error, 'Error occurred while login. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}


// Generate Temporary token for website/FF
export const SsoGenerateTempToken = async (req, res) => {
    try {
        const data = {
            email: req.body.email,
            source_domain: req.body.source_domain,
            ip_address: req.clientIp,
            access_token: _.get(req, 'body.access_token', undefined)
        }

        const domainSecret = await redis.getClient().get(`sso:secret:${req.body.source_domain}`)
        const requestTempTokenHash = ssoGenerateTokenHash(data, domainSecret)
        const requestTempTokenData = { ...data, hash: requestTempTokenHash }

        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/ff-sso/generate-temp-token',
            data: requestTempTokenData,
        })
        return successResponse(res, responseData.data, 'Token generated successfully.')
    } catch (error) {
        Log.error('Error in SsoGenerateTempToken', error, 'ERR-SSO-002')
        return errorResponse(res, error, 'Error occurred while generating token. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const SsoLogoutUserSession = async (req, res) => {
    try {
        const data = {
            access_token: req.body.access_token,
            ip_address: req.clientIp
        }
        const responseData = await logoutUserSession(data)
        return successResponse(res, responseData.data, 'Logged out successfully.')
    } catch (error) {
        Log.error('Error in SsoLogoutUserSession', error, 'ERR-SSO-001')
        return errorResponse(res, error, 'Error occurred while logging out. Please try again', HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
