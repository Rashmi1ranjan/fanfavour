const websiteAnalytics = require('./../models/websiteAnalytics')
const Website = require('./../models/Website')
const User = require('./../models/User')
const request = require('request')
const authApiUrl = '/api/report/auth'
const userCountApiUrl = '/api/report/websiteAnalytics'
const bcrypt = require('bcryptjs')
const moment = require('moment-timezone')
const _ = require('lodash')
const REPORT_AUTH_TOKEN = 'AJEhhsEg0j9jSU6chK4VyYPf'
const timezone = 'America/Phoenix'
const { ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL } = require('./../middleware/auth.middleware')
const { addCronStatusLog } = require('../utils/addCronStatus')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description get user analytics for all website
 * @param {string} start_date start date
 * @param {string} end_date end date
 * @param {string} filters comma-separated filters (registration, subscription, cancellation)
 */
async function platformUserAnalytics(start_date = null, end_date = null, filters = '') {
    console.log('Command execution started')
    const websiteWhere = { status: { $in: ['live', 'published'] } }
    const allWebsite = await Website.find(websiteWhere, { website_url: 1 })
    let executedWebsiteCount = 0
    let successExecution = 0
    let errorInExecution = []
    const totalWebsite = allWebsite.length
    for (const website of allWebsite) {
        const execution = await getWebsiteAnalytics(website.website_url, start_date, end_date, filters)
        if (execution === true) {
            successExecution++
        } else {
            errorInExecution.push(website.website_url)
        }
        executedWebsiteCount++
        console.log(`Executed ${executedWebsiteCount}/${totalWebsite} Websites`)
        console.log('---------------------------')
    }
    console.log(`Successfully Executed ${successExecution}/${totalWebsite} Websites`)
    console.log(`Execution not completed in sites: ${errorInExecution}`)
    console.log('Command execution Completed')
}

/**
 * @description check nonzero data available in analytics or not
 * @param {object} analytics analytics data
 * @returns {boolean} true or false
 */
const checkNonZeroValue = function (analytics) {
    const objectKeys = Object.values(analytics)
    let sumOfValue = 0
    for (const [index, value] of objectKeys.entries()) {
        if (index > 0 && value !== 0) {
            sumOfValue = sumOfValue + parseFloat(value)
        }
    }
    return parseInt(sumOfValue) > 0 ? true : false
}

/**
 * @description call api and return data
 * @param {string} url request url
 * @param {object} headers http header
 * @returns {object} data
 */
const getData = function (url, headers) {
    return new Promise(function (resolve, reject) {
        request.post({
            url: url,
            formData: headers
        }, async function (error, httpResponse, body) {
            if (!error && httpResponse.statusCode == 200) {
                resolve(body)
            } else {
                reject(error)
            }
        })
    })
}

/**
 * @description get analytics by website name
 * @param {string} start_date start date
 * @param {string} end_date end date
 * @param {string} websites comma websites string without http:// or https://
 * @param {string} filters comma-separated filters (registration, subscription, cancellation)
 */
async function getPlatformUserAnalyticsByWebsite(start_date, end_date, websites, filters = '') {
    console.log('Command execution started')
    const websiteWhere = { status: { $in: ['live', 'published'] } }

    const allWebsite = websites.split(',')
    let executedWebsiteCount = 0
    let successExecution = 0
    let errorInExecution = []
    const totalWebsite = allWebsite.length
    for (const website of allWebsite) {
        websiteWhere.website_url = website
        const checkWebsite = await Website.countDocuments(websiteWhere)
        if (checkWebsite === 0) {
            console.log(`No website available ${website}`)
            errorInExecution.push(website.website_url)
        } else {
            const execution = await getWebsiteAnalytics(website, start_date, end_date, filters)
            if (execution === true) {
                successExecution++
            } else {
                errorInExecution.push(website.website_url)
            }
            executedWebsiteCount++
            console.log(`Executed ${executedWebsiteCount}/${totalWebsite} Websites`)
        }
        console.log('---------------------------')
    }
    console.log(`Successfully Executed ${successExecution}/${totalWebsite} Websites`)
    console.log(`Execution not completed in sites: ${errorInExecution}`)
    console.log('Command execution Completed')
}

/**
 * @description Yesterday platform analytics for all websites
 * @param {string} filters comma-separated filters (registration, subscription, cancellation)
 */
async function getYesterdayPlatformUserAnalytics(filters = '') {
    console.log('Command execution started')
    const websiteWhere = { status: { $in: ['live', 'published'] } }
    const start_date = moment().subtract(1, 'days').tz(timezone).format('YYYY-MM-DDT00:00:00Z')
    const end_date = moment().subtract(1, 'days').tz(timezone).format('YYYY-MM-DDT23:59:59Z')

    const allWebsite = await Website.find(websiteWhere, { website_url: 1 })
    let executedWebsiteCount = 0
    let successExecution = 0
    let errorInExecution = []
    const totalWebsite = allWebsite.length

    for (const website of allWebsite) {
        const execution = await getWebsiteAnalytics(website.website_url, start_date, end_date, filters)
        if (execution === true) {
            successExecution++
        } else {
            errorInExecution.push(website.website_url)
        }
        executedWebsiteCount++
        console.log(`Executed ${executedWebsiteCount}/${totalWebsite} Websites`)
        console.log('---------------------------')
    }
    console.log(`Successfully Executed ${successExecution}/${totalWebsite} Websites`)
    console.log(`Execution not completed in sites: ${errorInExecution}`)
    console.log('Command execution Completed')
}

/**
 * @description get website analytics on given date
 * @param {string} website_url website api url
 * @param {string} start_date analytics start date
 * @param {string} end_date analytics end date
 * @param {string} filters Comma separated string
 * @returns {*} console log
 */
const getWebsiteAnalytics = async function (website_url, start_date, end_date, filters = '') {
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    try {
        console.log(`Analytics started for website: ${website_url}`)
        const apiUrl = getWebsiteDomain(website_url)
        const headers = { token: REPORT_AUTH_TOKEN }
        let message = ''
        // get auth token for analytics api call
        const getAuthToken = await getData(`${apiUrl}${authApiUrl}`, headers)
        const authToken = JSON.parse(getAuthToken)
        if (authToken.success === 0 || authToken === null) {
            console.log(`Error! Execution stop at get auth token: ${apiUrl}`, authToken.errors)
            message = _.get(authToken, 'errors', 'Execution stop at get auth token')
            const cronStatusData = {
                domain: website_url,
                command_name: 'Get Website Analytics',
                cron_status: 'error',
                target_date: target_date,
                message: message
            }
            await addCronStatusLog(cronStatusData)
            return false
        }
        const token = authToken.data.token
        const authTokenHeader = {
            token: REPORT_AUTH_TOKEN,
            auth_token: token
        }

        // get user count for website by date
        let userCountUrl = `${apiUrl}${userCountApiUrl}?filters=${filters}`
        if (start_date != null || end_date != null) {
            userCountUrl = `${userCountUrl}&start_date=${start_date}&end_date=${end_date}`
        }

        const getUserCount = await getData(`${userCountUrl}`, authTokenHeader)
        const userCount = JSON.parse(getUserCount)
        if (userCount.success === 0 || userCount === null) {
            console.log(`Error! Execution stop get analytics count: ${website_url}`, userCount.errors)
            message = _.get(userCount, 'errors', 'Execution stop get analytics count')
            const cronStatusData = {
                domain: website_url,
                command_name: 'Get Website Analytics',
                cron_status: 'error',
                target_date: target_date,
                message: message
            }
            await addCronStatusLog(cronStatusData)
            return false
        }
        const analyticsData = userCount.data
        for (const analytics of analyticsData) {
            if (checkNonZeroValue(analytics) === true) {
                const query = { domain: website_url, date: new Date(analytics.date) }
                const dataToUpdate = { $set: analytics }
                const options = { upsert: true }
                await websiteAnalytics.updateOne(query, dataToUpdate, options)
            }
        }
        console.log(`Success! User analytics added for website: ${website_url}`)
        const cronStatusData = {
            domain: website_url,
            command_name: 'Get Website Analytics',
            cron_status: 'success',
            target_date: target_date,
            message: message
        }
        await addCronStatusLog(cronStatusData)
        return true
    } catch (error) {
        console.log(`Error! Execution stop Analytics for website: ${website_url}`, error)
        const message = _.get(error, 'message', 'Execution stop get analytics count')
        const cronStatusData = {
            domain: website_url,
            command_name: 'Get Website Analytics',
            cron_status: 'error',
            target_date: target_date,
            message: message
        }
        await addCronStatusLog(cronStatusData)
        return false
    }
}

/**
 * @description create analytics user
 * @param {string} email email address
 * @param {string} password password
 * @returns {void} console.log
 */
const createAnalyticsUser = async function (email, password) {
    if (_.isEmpty(email) || _.isEmpty(password)) {
        console.log('Please provide email and password')
        return
    }
    let USE_SECURE_JWT = process.env.USE_SECURE_JWT || false
    let userData = {
        name: 'Analytics',
        email: email,
        password: password,
        isAdmin: true,
        role: ROLE_ANALYTICS
    }

    if (USE_SECURE_JWT) {
        userData.jwtSecret = generateToken(32)
    }

    try {
        let user = await User.countDocuments({ email: userData.email })
        if (user === 0) {
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(userData.password, salt)
            userData.password = hash

            const newUser = new User(userData)
            await newUser.save()
            console.log(newUser)
        } else {
            console.log('Support user already exists.')
        }
        return new Promise((resolve) => {
            resolve()
        })
    } catch (error) {
        return new Promise((resolve, reject) => {
            console.log(error)
            reject()
        })
    }
}

/**
 * @description generate random token
 * @param {number} stringLength token length
 * @returns {string} random string
 */
function generateToken(stringLength = 15) {
    // list containing characters for the random string
    const stringArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '!']

    let rndString = ''

    // build a string with random characters
    for (let i = 1; i < stringLength; i++) {
        const rndNum = Math.ceil(Math.random() * stringArray.length) - 1
        rndString = rndString + stringArray[rndNum]
    }

    return rndString
}

/**
 * @description create Support user
 * @param {string} email email address
 * @param {string} password password
 * @returns {void} console.log
 */
const createSupportUser = async function (email, password) {
    if (_.isEmpty(email) || _.isEmpty(password)) {
        console.log('Please provide email and password')
        return
    }
    let USE_SECURE_JWT = process.env.USE_SECURE_JWT || false
    let userData = {
        name: 'Support',
        email: email,
        password: password,
        isAdmin: true,
        role: ROLE_SUPPORT
    }

    if (USE_SECURE_JWT) {
        userData.jwtSecret = generateToken(32)
    }

    try {
        let user = await User.countDocuments({ email: userData.email })
        if (user === 0) {
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(userData.password, salt)
            userData.password = hash

            const newUser = new User(userData)
            await newUser.save()
            console.log(newUser)
        } else {
            console.log('Support user already exists.')
        }
        return new Promise((resolve) => {
            resolve()
        })
    } catch (error) {
        return new Promise((resolve, reject) => {
            console.log(error)
            reject()
        })
    }
}

/**
 * @description create Referral user
 *
 * @param {string} email email address
 * @param {string} password password
 * @returns {void} console.log
 */
const createReferralUser = async function (email, password) {
    if (_.isEmpty(email) || _.isEmpty(password)) {
        console.log('Please provide email and password')
        return
    }
    let USE_SECURE_JWT = process.env.USE_SECURE_JWT || false
    let userData = {
        name: 'Referral',
        email: email,
        password: password,
        isAdmin: true,
        role: ROLE_REFERRAL
    }

    if (USE_SECURE_JWT) {
        userData.jwtSecret = generateToken(32)
    }

    try {
        let user = await User.countDocuments({ email: userData.email })
        if (user === 0) {
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(userData.password, salt)
            userData.password = hash

            const newUser = new User(userData)
            await newUser.save()
            console.log(newUser)
        } else {
            console.log('Referral user already exists.')
        }
        return new Promise((resolve) => {
            resolve()
        })
    } catch (error) {
        return new Promise((resolve, reject) => {
            console.log(error)
            reject()
        })
    }
}

module.exports = { platformUserAnalytics, getPlatformUserAnalyticsByWebsite, getYesterdayPlatformUserAnalytics, createAnalyticsUser, createSupportUser, createReferralUser, generateToken }
