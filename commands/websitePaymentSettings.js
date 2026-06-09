const { getWebsiteDomain } = require('../utils/getWebsiteDomain')
const Website = require('./../models/Website')
const axios = require('axios')

async function checkPaymentSetting() {
    try {
        const websiteData = await Website.find({ status: { $in: ['live', 'published'] } })
        let totalVerifiedWebsites = 0
        let totalNonVerifiedWebsite = 0
        let nonVerifiedWebsites = []
        let offlineWebsites = []
        for (const website of websiteData) {
            const apiDomain = getWebsiteDomain(website.website_url)
            const url = `${apiDomain}/api/app_settings/get-payment-settings`
            let paymentSettings
            try {
                paymentSettings = await axios.post(url)
            } catch (err) {
                offlineWebsites.push(website.website_url)
            }
            if (paymentSettings !== undefined) {
                const paymentSettingData = paymentSettings.data.data
                const { enable_forumpay_payment_live_mode, active_payment_gateway } = paymentSettingData

                if (website.is_crypto_payment_enabled === enable_forumpay_payment_live_mode && website.payment_gateway === active_payment_gateway) {
                    totalVerifiedWebsites += 1
                } else {
                    nonVerifiedWebsites.push(website.website_url)
                    totalNonVerifiedWebsite += 1
                }
            }
        }
        let data = []
        if (data !== undefined) {
            data = {
                totalVerifiedWebsitesCount: totalVerifiedWebsites,
                totalNonVerifiedWebsiteCount: totalNonVerifiedWebsite
            }
        }
        console.table(data)
        console.log('Websites with wrong Payment setting')
        console.table(nonVerifiedWebsites)
        console.log('Offline Websites List')
        console.table(offlineWebsites)
    } catch (err) {
        console.log('error in check payment gateway settings', err)
    }
}

module.exports = { checkPaymentSetting }
