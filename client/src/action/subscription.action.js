import _ from 'lodash'
import { api } from './base-url'

export const getCountries = async () => {
    try {
        const url = `/v1/users/get_all_country_list`
        const response = await api.get(url)
        return response.data.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', error.response.data.message)
        alert(errorMessage)
    }
}

export const getCountryFromIP = async () => {
    try {
        const url = '/v1/users/get-country-from-ip'
        const res = await api.get(url)
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', error.response.data.message)
        alert(errorMessage)
    }
}

export const getStates = async (data) => {
    try {
        const url = '/v1/users/get_states_of_country'
        const res = await api.post(url, data)
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', error.response.data.message)
        alert(errorMessage)
    }
}

export const getCities = async (data) => {
    try {
        const url = '/v1/users/get_cities_of_state'
        const res = await api.post(url, data)
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', error.response.data.message)
        alert(errorMessage)
    }
}



