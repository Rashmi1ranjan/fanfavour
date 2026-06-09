const _ = require('lodash')
const moment = require('moment')
const axios = require('axios')
const OneSignalAnalytics = require('../models/OneSignalAnalytics')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * Get 3 days ago sended notification history
 */
async function getOneSignalAnalyticData() {
    try {
        const startDate = moment().subtract(3, 'days').startOf('day')
        const endDate = moment().endOf('day')

        const data = await OneSignalAnalytics.find({ createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } })
        if (_.isEmpty(data) === false) {
            for (let i = 0; i < data.length; i++) {
                const notification_id = _.get(data[i], 'notification_id', false)
                if (notification_id !== false) {
                    await getNotificationHistory(data[i].domain, notification_id)
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * Get Notification History from website
 *
 * @param {string} domain domain
 * @param {string} notification_id id
 */
async function getNotificationHistory(domain, notification_id) {
    try {
        const apiDomain = getWebsiteDomain(domain)
        const res = await axios.get(`${apiDomain}/api/notifications/get-notification-history?notification_id=${notification_id}`)
        if (res.data.success === 1) {
            console.log('Add response for notification_id:', notification_id, ' Domain: ', domain)
            await OneSignalAnalytics.findOneAndUpdate({ domain: domain, notification_id: notification_id }, { $set: { onesignal_res: res.data.data } })
        }
    } catch (error) {
        console.log(error.response.data)
    }
}

module.exports = { getOneSignalAnalyticData }
