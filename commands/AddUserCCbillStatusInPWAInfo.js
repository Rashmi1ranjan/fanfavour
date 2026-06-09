const PWAInfo = require('./../models/PWAInfo')
const axios = require('axios')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const _ = require('lodash')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description Store user ccbill_subscription_status
 */
async function AddUserCCbillStatusInPWAInfo() {
    try {
        const pwaInfoCount = await PWAInfo.countDocuments()
        if (pwaInfoCount > 0) {
            const token = API_STATIC_AUTH_TOKEN
            let limit = 100
            let totalPages = Math.ceil(pwaInfoCount / limit)
            console.log('total page', { totalPages })

            for (let index = 0; index < totalPages; index++) {
                let offset = index * limit
                console.log('Offset', { offset })
                const pwaInfo = await PWAInfo.find({}, 'domain user_id').skip(offset).limit(limit)

                for (const pwa of pwaInfo) {
                    const userId = pwa.user_id
                    const apiDomain = getWebsiteDomain(pwa.domain)
                    const data = {
                        user_id: userId,
                        token: token
                    }
                    const url = `${apiDomain}/api/get-user-ccbill-status`
                    let userInfo
                    try {
                        userInfo = await axios.post(url, data)
                    } catch (err) {
                        continue
                    }

                    const subscriptionStatus = _.get(userInfo, 'data.data.ccbill_subscription_status', '')
                    if (subscriptionStatus !== '') {
                        pwa.ccbill_subscription_status = userInfo.data.data.ccbill_subscription_status
                        await pwa.save()
                    }
                }
            }
        }
    } catch (err) {
        console.log('Error in command execution')
    }
}

/**
 * Update correct pwa install
 */
async function addCorrectPWAInstallStatus() {
    const query = {
        pwa_last_seen: { $exists: true }
    }
    const pwaInfoCount = await PWAInfo.countDocuments(query)
    if (pwaInfoCount > 0) {
        let limit = 100
        let totalPages = Math.ceil(pwaInfoCount / limit)
        console.log('total page', { totalPages })

        for (let index = 0; index < totalPages; index++) {
            let offset = index * limit
            console.log('Offset', { offset })
            const pwaInfo = await PWAInfo.find(query, 'pwa_last_seen').skip(offset).limit(limit)

            for (const pwa of pwaInfo) {
                pwa.is_running_from_pwa = true
                await pwa.save()
            }
        }
    }
}

module.exports = { AddUserCCbillStatusInPWAInfo, addCorrectPWAInstallStatus }
