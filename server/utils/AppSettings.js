import _ from 'lodash'
import { websiteApiRequest } from './axiosClient.js'
import redis from '../redis/config/redis.js'
let appSettings = null

export const getAppSettings = async (domain, key) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/users/get-app-settings',
            data: { key },
            auth: 'service-header'
        })
        updateAppSettingsCache(responseData.data.data)
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while get the app setting')
        throw new Error(errorMessage)
    }
}

export const updateAppSettingsCache = async (data = {}) => {
    const { appSettings: incomingSettings } = data

    if (!incomingSettings) return

    // const activeModelIdArray = await addActiveModelIdArray()

    const updatedAppSettings = {
        ...incomingSettings,
        // active_model_id_array: activeModelIdArray
    }

    appSettings = updatedAppSettings
    redis.setAppSettings(updatedAppSettings)
}

/**
 * Get app setting value from cache
 *
 * @param {string} key key of settings object
 * @returns {*} settings value
 */
export const getAppSettingsData = (key) => {
    if (appSettings == null) {
        return ''
    }
    return appSettings[key]
}
