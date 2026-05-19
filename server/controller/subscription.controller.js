import { successResponse, errorResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400 } from "../helper/http.status.js"
import _ from 'lodash'
import { servicesApiRequest } from "../utils/axiosClient.js"

export const getCountryList = async (req, res) => {
    try {
        const responseData = await servicesApiRequest({
            method: 'get',
            endpoint: '/users/get_country_state_city/get_all_countries',
            params: { token: null }, // No need to send token for this API as it's public API
        })
        const countryList = _.get(responseData, 'data.countries', [])
        return successResponse(res, countryList, 'Fetch country list successfully')
    } catch (err) {
        return errorResponse(res, err, 'Error in get country list', HTTP_BAD_REQUEST_400)
    }
}

export const getCountryBasedOnIp = async function (req, res) {
    try {
        const ip = req.clientIp
        const response = await servicesApiRequest({
            method: 'get',
            endpoint: '/users/get_ip_details',
            params: { ip, token: null }, // No need to send token for this API as it's public API
        })
        const responseData = response.data
        if (responseData.result === false) {
            return successResponse(res, { country: '' }, 'Country Not fond from IP')
        }
        const geoCountry = responseData.geo.country.trim().toLowerCase()

        return successResponse(res, { country: geoCountry }, 'Country from IP')
    } catch (error) {
        return errorResponse(res, error, 'There was a problem get country name', HTTP_BAD_REQUEST_400)
    }
}

export const getStateOfCountry = async (req, res) => {
    try {
        if (_.isEmpty(req.body.countryId)) {
            return errorResponse(res, {}, 'Country Id can not be empty', HTTP_BAD_REQUEST_400)
        }

        const response = await servicesApiRequest({
            method: 'get',
            endpoint: '/users/get_country_state_city/get_states_of_country',
            params: { country_id: req.body.countryId, token: null }, // No need to send token for this API as it's public API
        })
        const responseData = response.data
        return successResponse(res, responseData, 'city from IP')
    } catch (error) {
        return errorResponse(res, error, 'There was a problem get state name', HTTP_BAD_REQUEST_400)
    }
}

export const getCityOfState = async(req, res) => {
    try {
        if (_.isEmpty(req.body.countryId)) {
            return errorResponse(res, {}, 'Country Id can not be empty', HTTP_BAD_REQUEST_400)
        }
        if (_.isEmpty(req.body.stateId)) {
            return errorResponse(res, {}, 'State Id can not be empty', HTTP_BAD_REQUEST_400)
        }

        const response = await servicesApiRequest({
            method: 'get',
            endpoint: '/users/get_country_state_city/get_cities_of_state',
            params: {
                country_id: req.body.countryId,
                state_id: req.body.stateId,
                token: null, // No need to send token for this API as it's public API
            },
        })
        const responseData = response.data
        return successResponse(res, responseData, 'city from IP')
    } catch (error) {
        return errorResponse(res, error, 'There was a problem get city name', HTTP_BAD_REQUEST_400)
    }
}