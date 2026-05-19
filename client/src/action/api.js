import _ from 'lodash'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { api } from './base-url'

export const getModelList = async (page) => {
    const params = {
        page: page
    }

    const url = '/v1/get-model-list'
    const response = await api.get(url, { params })
    return response.data
}

export const getFeaturedModel = async () => {
    const url = `/v1/get-featured-model`
    const response = await api.get(url)
    return response.data
}

export const getCurrentUserSession = async (authToken, dispatch) => {
    try {
        const url = `/v1/get-current-user-session`
        const response = await api.post(url, { access_token: authToken })
        return response.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get user details')
        dispatch(setSweetAlert({ description: errorMessage }))
        return
    }
}

export const getAuthImages = async (domain) => {
    try {
        const url = '/v1/get-auth-images'
        const params = {
            domain: domain
        }
        const response = await api.get(url, { params })
        return response.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get website app settings')
        console.log(errorMessage)
    }
}

export const getSelectedModel = async (id, dispatch) => {
    try {
        const params = {
            website_url: id
        }
        const res = await api.get(`/v1/get-selected-model`, { params })
        return res.data.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get selected model')
        const payload = {
            description: errorMessage
        }
        dispatch(setSweetAlert(payload))
    }
}

export const submitContactUs = async (data, dispatch) => {
    try {
        const url = `/v1/contact-us`
        await api.post(url, data)
        dispatch(setSweetAlert({ description: 'Your message was sent successfully.' }))
        return { status: true }
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error sending message')
        dispatch(setSweetAlert({ description: errorMessage }))
        return { status: false, message: errorMessage }
    }
}
