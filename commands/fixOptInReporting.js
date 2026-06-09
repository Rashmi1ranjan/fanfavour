const OptInStatusReport = require('./../models/OptInStatusReport')
const Website = require('../models/Website')
const rp = require('request-promise')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
let updatedRecords = 0

/**
 * fix opt in reporting for website
 */
async function fixOptInReporting() {

    let totalWebsites = 0
    let condition = {
        status: { $in: ['live', 'published'] },
        website_url: { $nin: ['beccafresh.com', 'phoebethompson.com'] }
    }
    try {
        totalWebsites = await Website.countDocuments(condition)
    } catch (error) {
        console.log('error in countDocuments', error)
        return
    }

    if (totalWebsites === 0) {
        return
    }
    const limit = 100
    let totalPages = Math.ceil(totalWebsites / limit)
    for (let index = 0; index < totalPages; index++) {
        let offset = index * limit
        let websites = []
        try {
            websites = await Website.find(condition, 'website_url').skip(offset).limit(limit)
        } catch (error) {
            console.log('error in find', error)
            return
        }
        for (let i = 0; i < websites.length; i++) {
            try {
                await updateOptInCountReportInWebsite(websites[i].website_url)
                updatedRecords++
            } catch (error) {
                console.log(error.message)
            }
        }
        console.log(`Total records ${totalWebsites} updated records ${updatedRecords}`)
    }
}

/**
 *
 * @param {string} website_url website_url
 * @returns {boolean} true false
 */
async function updateOptInCountReportInWebsite(website_url) {
    return new Promise(async (resolve, reject) => {
        const websiteUrl = 'https://api.' + website_url + '/api/update-opt-in-email-reports'
        try {
            const requestBody = {
                token: API_STATIC_AUTH_TOKEN
            }
            let body = await rp.post({
                url: websiteUrl,
                json: requestBody
            })

            if (body.status === 200) {
                const optInReport = {
                    bounced: 0,
                    bounced_declined: 0,
                    declined: 0,
                    opt_in: 0,
                    opt_in_link_sent: 0,
                    opt_in_pending: 0,
                    total: 0
                }
                const condition = { website_url: website_url }
                await OptInStatusReport.updateOne(condition, { $set: optInReport })
                resolve(true)
            } else {
                console.log('Error from Website api')
                resolve(false)
            }
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = fixOptInReporting
