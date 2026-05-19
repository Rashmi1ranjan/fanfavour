import _ from 'lodash'
import { api } from './base-url'

export const getAppSetting = async (key, domain) => {
    try {
        const url = `/v1/get-app-setting`
        const data = {
            key,
            domain
        }
        const response = await api.post(url, data)
        return response.data.data
    } catch (error) {
        console.log(error)
        // dispatch(handleUserUpdateError(error))
    }
}

export const getAppSettings = async (domain) => {
    try {
        const url = '/v1/get-all-app-setting'
        const params = {
            domain: domain
        }

        const res = await api.get(url, { params })

        // if (!_.isEmpty(res.data.appSettings.feed_tags)) {
        //     dispatch({ type: UPDATE_FEED_TAG_LIST, payload: res.data.appSettings.feed_tags })
        // }

        // if (localStorage.getItem('AuthToken')) {
        //     dispatch(updateUserLastSeen())
        // }
        return { success: true, data: res.data.data }
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get website app settings')
        return { success: false, message: errorMessage }
    }
}