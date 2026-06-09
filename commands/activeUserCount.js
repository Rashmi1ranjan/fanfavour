const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')
const Website = require('../models/Website')
const ActiveUserCount = require('../models/ActiveUserCount')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * Get active user count from website.
 */
async function getAllWebsiteUserCount() {
    try {
        const query = {
            status: { $in: ['live', 'published'] }
        }
        const totalWebsite = await Website.countDocuments(query)
        const limit = 100
        const maxPage = Math.ceil(totalWebsite / limit)
        if (totalWebsite > 0) {
            for (let page = 1; page <= maxPage; page++) {
                const offset = (page - 1) * limit
                console.log('offset', offset)
                let websitesData = await Website.find(query, { website_url: 1 }).sort({ _id: -1 }).skip(offset).limit(limit)
                for (const website of websitesData) {
                    await getAllWebsiteActiveUserCount(website.website_url)
                }
            }
        }
    } catch (error) {
        console.log(error)
        console.log('Error in command execution')
        return false
    }
}

/**
 * get all website active user count
 *
 * @param {string} website_url website_url
 */
async function getAllWebsiteActiveUserCount(website_url) {
    const token = API_STATIC_AUTH_TOKEN
    const apiDomain = getWebsiteDomain(website_url)

    try {
        const apiUrl = `${apiDomain}/api/get-user-count`
        const activeUserCount = await axios.post(apiUrl, { token })

        const {
            activeSubscribers,
            cancelledSubscribers,
            rebillFailedSubscribers
        } = activeUserCount.data.data

        const activeUser = _.defaultTo(activeSubscribers, 0)
        const cancelledUser = _.defaultTo(cancelledSubscribers, 0)
        const rebillFailedUser = _.defaultTo(rebillFailedSubscribers, 0)

        const targetDate = moment().format('YYYY-MM-DDT00:00:00')
        const activeUserData = await ActiveUserCount.findOne({ domain: website_url, target_date: targetDate })
        const data = {
            active: activeUser,
            active_cancelled: cancelledUser,
            rebill_failed: rebillFailedUser
        }

        if (activeUserData === null) {
            data.target_date = targetDate
            data.domain = website_url
            const newInfo = new ActiveUserCount(data)
            await newInfo.save()
        } else {
            await ActiveUserCount.updateOne({ domain: website_url, target_date: targetDate }, data)
        }

    } catch (err) {
        console.log(err)
        return false
    }
}

module.exports = { getAllWebsiteUserCount }
