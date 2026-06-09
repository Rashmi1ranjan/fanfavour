const axios = require('axios')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * @description Get the user referral key
 * @param {object} order_id sticky.io order id
 * @param {string} website_url website url
 * @param {string} payment_gateway payment_gateway
 * @returns {string} success response
 */
async function getReferralDataFromWebsite(order_id, website_url, payment_gateway) {
    try {
        const apiDomain = getWebsiteDomain(website_url)
        const apiUrl = `${apiDomain}/api/link-referral-data`
        const response = await axios.post(apiUrl, { order_id, website_url, payment_gateway }, { headers: { token: API_STATIC_AUTH_TOKEN } })
        return response.data
    } catch (error) {
        return {
            success: 0,
            message: error?.response?.data?.message || error.message
        }
    }
}

module.exports = { getReferralDataFromWebsite }
