import axios from 'axios'
import { API_STATIC_AUTH_TOKEN } from '../constant.js'
import { getBaseUrl } from '../helper/common.js'

const servicesApiUrl = process.env.SERVICES_API_URL || 'http://localhost:8080'

/**
 * @typedef {Object} RequestOptions
 * @property {string} endpoint API endpoint path
 * @property {string} [method='get'] HTTP method
 * @property {Object} [data] Request payload
 * @property {Object} [params] Query parameters
 * @property {Object} [headers] Request headers
 */

/**
 * @typedef {RequestOptions & {
 *   domain: string,
 *   auth?: 'service-header' | 'service-param' | 'user' | 'none',
 *   userAuth?: { authorization?: string, token?: string }
 * }} BaseApiRequestOptions
 *
 * Authentication modes:
 * - `'service-header'`: Static token in headers
 * - `'service-param'`: Static token in query params
 * - `'user'`: Forward user auth from request (requires userAuth)
 * - `'none'`: No authentication (default)
 */

export const api = axios.create({
    headers: {
        'Content-Type': 'application/json'
    }
})

const isPlainObjectWithKeys = (value) => {
    return value != null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

const request = async ({ baseURL, endpoint, method = 'get', data, params, headers = {} }) => {
    if (!endpoint) {
        throw new Error('Invalid request configuration: missing required parameter')
    }

    const normalizedMethod = String(method || 'get').toLowerCase()
    const config = {
        baseURL,
        url: endpoint,
        method: normalizedMethod
    }

    if (isPlainObjectWithKeys(params)) {
        config.params = params
    }

    if (isPlainObjectWithKeys(headers)) {
        config.headers = headers
    }

    if (data !== undefined) {
        config.data = data
    }

    return api(config)
}

export const servicesApiRequest = async ({ method = 'get', endpoint, data, params = {}, headers = {} }) => {
    const requestParams = {
        ...(params || {})
    }

    const hasTokenOverride = Object.prototype.hasOwnProperty.call(requestParams, 'token')

    if (!hasTokenOverride) {
        requestParams.token = API_STATIC_AUTH_TOKEN
    } else if (requestParams.token == null) {
        delete requestParams.token
    }

    return request({
        baseURL: servicesApiUrl,
        endpoint,
        method,
        data,
        params: requestParams,
        headers
    })
}

/**
 * @param {BaseApiRequestOptions} options
 * @returns {Promise<import('axios').AxiosResponse>} Raw Axios response
 * @throws {Error} When request configuration is invalid
 */
export const websiteApiRequest = async ({
    domain,
    method = 'get',
    endpoint,
    data,
    params,
    headers = {},
    auth = 'none',
    userAuth = null
}) => {
    if (!domain) {
        throw new Error('Invalid request configuration: missing required parameter')
    }
    if (auth === 'user' && !userAuth) {
        throw new Error('Invalid request configuration: authentication credentials required')
    }

    let finalParams = params
    let finalHeaders = { ...headers }

    switch (auth) {
        case 'service-header':
            finalHeaders = { ...finalHeaders, token: API_STATIC_AUTH_TOKEN }
            break

        case 'service-param':
            finalParams = { ...(params || {}), token: API_STATIC_AUTH_TOKEN }
            break

        case 'user': {
            if (userAuth.authorization || userAuth.token) {
                const { authorization, token } = userAuth
                // Priority: token > Authorization header
                if (token) {
                    finalHeaders = { ...finalHeaders, common: { token } }
                }
                else if (authorization) {
                    finalHeaders = { ...finalHeaders, Authorization: authorization }
                }
            }
            break
        }

        case 'none':
            // No automatic authentication - use provided headers/params only
            break

        default:
            throw new Error('Invalid request configuration: unsupported parameter value')
    }

    return request({
        baseURL: getBaseUrl(domain),
        endpoint,
        method,
        data,
        params: finalParams,
        headers: finalHeaders
    })
}
