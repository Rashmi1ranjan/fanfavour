const request = require('request')
const API_SUCCESS = 1
const API_ERROR = 0
const REPORT_AUTH_TOKEN = 'AJEhhsEg0j9jSU6chK4VyYPf'
const API_AUTH_TOKEN = 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl'
const moment = require('moment')

/**
 *  get success response with its flag 0 or 1
 *
 * @param {object} res Http Response
 * @param {object} data response data
 * @param {string} message success response message
 * @param {number} status response status
 */
const successResponse = (res, data, message = '', status) => {
    res.send({
        success: API_SUCCESS,
        status: status,
        message: message,
        data: data
    })
}

/**
 *  get error response with its flag 0 or 1
 *
 * @param {object} res Http Response
 * @param {object} error error
 * @param {string} message error response message
 * @param {number} status response status
 */
const errorResponse = (res, error, message = '', status) => {
    res.send({
        success: API_ERROR,
        status: status,
        message: message,
        error: error
    })
}

/**
 *  get error response with its flag 0 or 1
 *
 * @param {object} res Http Response
 * @param {object} error error
 * @param {string} responseError error response message
 * @param {string} message error response message
 * @param {number} status response status
 */
const catchResponse = (res, error, responseError, message, status) => {
    console.log(error)
    res.status(500).send(errorResponse(res, responseError, message, status))
}

/**
 * @description call api and return data
 * @param {string} url request url
 * @param {object} headers http header
 * @returns {object} data
 */
const getData = function (url, headers) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: url,
            formData: headers
        }, async function (error, httpResponse, body) {
            if (!error && httpResponse.statusCode == 200) {
                resolve(body)
            } else {
                reject(body)
            }
        })
    })
}

/**
 * @description call api and return data using post method
 * @param {string} url request url
 * @param {*} data Request data
 * @param {*} headers header data
 * @returns {*} data
 */
const postData = function (url, data, headers = null) {
    let requestData = {
        url: url,
        form: data
    }
    if (headers != null) {
        requestData.headers = headers
    }
    return new Promise(function (resolve, reject) {
        request.post(requestData, (error, httpResponse, body) => {
            if (!error && httpResponse.statusCode == 200) {
                resolve(body)
            } else {
                reject(error)
            }
        })
    })
}

const getApiAuthToken = async (website_url) => {
    const body = { token: REPORT_AUTH_TOKEN }
    // get auth token for analytics api call
    const getAuthToken = await postData(`${website_url}/api/report/auth`, body)
    const authToken = JSON.parse(getAuthToken)
    if (authToken.success === 0 || authToken === null) {
        console.log(`Error! Execution stop at get auth token: ${apiUrl}`, authToken.errors)
        return false
    }
    return { token: REPORT_AUTH_TOKEN, auth_token: authToken.data.token }
}

/**
 * @description Get Date array
 * @param {string} firstDate start date
 * @param {string} lastDate end date
 * @param {string} format return date format
 * @returns {*} dateArray
 */
function getDatesArray(firstDate, lastDate, format = 'YYYY-MM-DDT00:00:00.000Z') {
    let dateArray = []
    let startDate = moment(firstDate)
    let endDate = moment(lastDate)
    while (startDate <= endDate) {
        dateArray.push(moment(startDate).format(format))
        startDate = moment(startDate).add(1, 'days')
    }
    return dateArray
}

/**
 *
 * @param {string} firstDate start date
 * @param {string} endDate end date
 * @param {string} format date format
 * @returns {Array} hours array
 */
function getHoursArray(firstDate, endDate, format = 'YYYY-MM-DDTHH:mm:ss.000Z') {
    let hoursArray = []
    let startDate = moment(firstDate)
    const dateOneObj = new Date(startDate)
    const dateTwoObj = new Date(endDate)
    const milliseconds = Math.abs(dateTwoObj - dateOneObj)
    const hours = milliseconds / 36e5
    for (let index = 0; index < hours; index++) {
        hoursArray.push(moment(startDate).format(format))
        startDate = moment(startDate).add(1, 'hours')
    }
    return hoursArray
}

/**
 *
 * @param {string} start_date start date
 * @param {string} end_date end date
 * @returns {number} days different
 */
function getDateDifferent(start_date, end_date) {
    const startDate = moment(start_date, 'MM/DD/YYYY')
    const endDate = moment(end_date, 'MM/DD/YYYY')
    const daysDiff = endDate.diff(startDate, 'days')
    return daysDiff
}

/**
 *  Send error response with a correct HTTP error response code
 *
 * @param {object} res Http Response
 * @param {object} errors error
 * @param {string} message error response message
 * @param {number} status_code HTTP response status code
 */
const errorResponseWithHTTPStatus = function errorResponse(res, errors, message, status_code) {
    const response = {
        success: 0,
        data: {},
        errors: errors,
        message: message,
        status: status_code
    }
    res.status(status_code).json(response)
}

module.exports = {
    successResponse,
    errorResponse,
    catchResponse,
    getData,
    postData,
    getApiAuthToken,
    API_AUTH_TOKEN,
    getDatesArray,
    getHoursArray,
    getDateDifferent,
    errorResponseWithHTTPStatus
}
