import _ from 'lodash'
import { API_STATIC_AUTH_TOKEN } from "../constant.js"
import { addUniversalEventLog } from './universalLoginLogger.js'
import {
    ADD_ACCOUNT,
    LOGIN_MERGE,
    MERGE_ACCOUNT,
    REGISTER, REGISTER_ERROR,
    REQ_FROM_CHANGE_PASSWORD,
    RESET_PASSWORD,
    restrictedDomainsForUniversalLogin
} from './constants.js'
import { getAppSettings } from './AppSettings.js'
import { servicesApiRequest, websiteApiRequest } from './axiosClient.js'

export const getUniversalLoginSetting = async (domain) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/universal-login/get-universal-login',
            auth: 'service-param'
        })
        return responseData
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while get universal login setting')
        throw new Error(errorMessage)
    }
}

/**
 * @description Send user details to services for universal login
 *
 * @param {object} userDetails User Details
 * @param {string} userDetails.email user email required
 * @param {string} userDetails.password user password required
 * @param {string} reqFrom Request from login or register
 * @param {string} action Action like merge
 * @param {string} oldUser check merge current is old user
 * @returns {object} Return response data
 */
export const registerUserInServices = async (domain, userDetails, reqFrom, action = '', oldUser = false, isFFUser) => {
    try {
        if (restrictedDomainsForUniversalLogin.includes(domain)) return {}

        const details = { userDetails, domain, reqFrom, action, oldUser, isFFUser }
        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/universal-login/register',
            data: details,
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        const mergeAccount = _.get(responseData, 'data.data.siteListOfMergeOldAccount', [])

        const isUserMergeInUniversal = _.get(responseData, 'data.data.isUserMergeInUniversal', false)
        const mergeOldUser = _.get(responseData, 'data.data.mergeOldUser', false)

        if (isUserMergeInUniversal) {
            delete userDetails.password
            if (mergeOldUser === true) {
                addUniversalEventLog(domain, userDetails.email, LOGIN_MERGE, { ...userDetails, reqFrom })
            } else if (reqFrom === REQ_FROM_CHANGE_PASSWORD) {
                addUniversalEventLog(domain, userDetails.email, RESET_PASSWORD, {})
            } else if (action === ADD_ACCOUNT) {
                addUniversalEventLog(domain, userDetails.email, ADD_ACCOUNT, { ...userDetails, reqFrom })
            } else if (action === MERGE_ACCOUNT) {
                addUniversalEventLog(domain, userDetails.email, MERGE_ACCOUNT, { ...userDetails, reqFrom, mergeAccount })
            } else {
                addUniversalEventLog(domain, userDetails.email, REGISTER, { ...userDetails, reqFrom })
            }
        }
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const ULAction = _.get(error, 'response.data.errors.ULAction', '')
        const isAxiosError = _.get(errorData, 'isAxiosError', false)
        const errorMessageResponse = _.get(errorData, 'errors.message', errorData.message)
        const errorName = _.get(errorData, 'errors.name', errorData.name)

        delete userDetails.password
        const loggerMetaData = { reqData: { ...userDetails, reqFrom, action }, message: errorMessageResponse, name: errorName, stack: _.get(error, 'response.data', error.stack) }
        if (isAxiosError) { loggerMetaData.errorCode = 'ERR_10001' }
        if (!_.isEmpty(ULAction)) { loggerMetaData.ULAction = ULAction }
        addUniversalEventLog(domain, userDetails.email, REGISTER_ERROR, loggerMetaData)
        const errorMessage = isAxiosError ? 'ERR_10001' : _.get(errorData, 'message', 'Error in register user')
        throw new Error(errorMessage)
    }
}

export const checkUserIsExist = async (userDetails, domain) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/check-user-exist',
            data: userDetails,
            auth: 'service-header'
        })
        return responseData
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error in check user in website')
        throw new Error(errorMessage)
    }
}

export const checkUniversalUserIsExist = async (email, domain) => {
    try {
        const data = {
            email: email,
            domain: domain
        }
        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/check-universal-user-exist',
            data,
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error in check universal user')
        throw new Error(errorMessage)
    }
}

export const registerUniversalUser = async (userDetails, domain) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/add-universal-user',
            data: { userDetails },
            auth: 'service-header'
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Create new universal user')
        throw new Error(errorMessage)
    }
}

export const updateUserInUniversal = async (email, domain, data) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/update-user-in-universal',
            data: { email, data },
            auth: 'service-header'
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'update user to universal user')
        throw new Error(errorMessage)
    }
}

/**
 * 
 * @param {string} email user email 
 * @param {string} domain current requested domain 
 * @param {object} project project return data from model
 * @returns {object} user information
 */
export const getUserFromWebsite = async (email, domain, project) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/get-user-details',
            data: { email, project },
            auth: 'service-header'
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while get the user details')
        throw new Error(errorMessage)
    }
}

/**
 * @description check universal user available in service
 *
 * @param {string} data user email and request from
 * @returns {boolean} return true if user found in service else false
 */
export const checkUniversalUserInService = async (data, domain) => {
    try {
        const isUniversalLoginEnabled = getAppSettings(domain, 'is_universal_login_enabled')
        if (!isUniversalLoginEnabled || restrictedDomainsForUniversalLogin.includes(domain)) return false
        const response = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/universal-login/get-universal-user',
            data,
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        return response.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while check universal user in service')
        throw new Error(errorMessage)
    }
}

/**
 * 
 * @param {string} domain domain
 * @param {object} data data to store in the model 
 * @param {string} modelName db collection name 
 */
export const storeForgotPasswordToken = async (domain, data, modelName) => {
    try {
        const isUniversalLoginEnabled = getAppSettings(domain, 'is_universal_login_enabled')
        if (!isUniversalLoginEnabled || restrictedDomainsForUniversalLogin.includes(domain)) return false
        const response = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/store-forgot-password-token',
            data: { data, modelName },
            auth: 'service-header'
        })
        return response.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while add data')
        throw new Error(errorMessage)
    }
}


/**
 * 
 * @param {string} email user email 
 * @param {string} domain current requested domain 
 * @returns {object} get the user auth token
 */
export const generateAuthToken = async (email, domain) => {
    try {
        const responseData = await servicesApiRequest({
            method: 'post',
            endpoint: '/api/generate-auth-token',
            data: { email, domain },
            headers: { token: API_STATIC_AUTH_TOKEN },
            params: { token: null }, // No need to send token for this API as it's public API
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while generate auth token')
        throw new Error(errorMessage)
    }
}