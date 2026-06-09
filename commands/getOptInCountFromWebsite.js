const OptInStatusReport = require('./../models/OptInStatusReport')
const Website = require('../models/Website')
const rp = require('request-promise')
const moment = require('moment')
const _ = require('lodash')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
const { addCronStatusLog } = require('../utils/addCronStatus')
let updatedRecords = 0

/**
 * get opt in status report from website
 */
async function getOptInStatusReport() {

    let totalWebsites = 0
    let condition = { status: { $in: ['live', 'published'] } }
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
                await getOptInCountReportFromWebsite(websites[i].website_url)
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
async function getOptInCountReportFromWebsite(website_url) {
    return new Promise(async (resolve, reject) => {
        const websiteUrl = 'https://api.' + website_url + '/api/get-opt-in-email-reports'
        let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
        target_date = new Date(target_date)
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
                    bounced: body.data.bounced,
                    bounced_declined: body.data.bouncedDeclined,
                    declined: body.data.declined,
                    opt_in: body.data.optIn,
                    opt_in_link_sent: body.data.optInLinkSent,
                    opt_in_pending: body.data.optInPending,
                    total: body.data.totalRow
                }
                const condition = { website_url: website_url }
                let count = await OptInStatusReport.countDocuments(condition)
                if (count === 0) {
                    optInReport.website_url = website_url
                    optInReport.created_at = new Date()
                    let optInStatusReportLog = new OptInStatusReport(optInReport)
                    await optInStatusReportLog.save()
                } else {
                    await OptInStatusReport.updateOne(condition, { $set: optInReport })
                }

                count = await OptInStatusReport.countDocuments({ website_url: 'all' })
                if (count === 0) {
                    optInReport.website_url = 'all'
                    let optInStatusReportLogForAll = new OptInStatusReport(optInReport)
                    await optInStatusReportLogForAll.save()
                } else {
                    let data = await OptInStatusReport.findOne({ website_url: 'all' })
                    const eventCount = body.data
                    data.bounced = {
                        activeUserCount: data.bounced.activeUserCount + eventCount.bounced.activeUserCount,
                        activeCancelledUserCount: data.bounced.activeCancelledUserCount + eventCount.bounced.activeCancelledUserCount,
                        cancelledUserCount: data.bounced.cancelledUserCount + eventCount.bounced.cancelledUserCount,
                        registeredUserCount: data.bounced.registeredUserCount + eventCount.bounced.registeredUserCount,
                        popupDisplayCount: data.bounced.popupDisplayCount,
                        total: data.bounced.total + eventCount.bounced.total
                    }

                    data.bounced_declined = {
                        activeUserCount: data.bounced_declined.activeUserCount + eventCount.bouncedDeclined.activeUserCount,
                        activeCancelledUserCount: data.bounced_declined.activeCancelledUserCount + eventCount.bouncedDeclined.activeCancelledUserCount,
                        cancelledUserCount: data.bounced_declined.cancelledUserCount + eventCount.bouncedDeclined.cancelledUserCount,
                        registeredUserCount: data.bounced_declined.registeredUserCount + eventCount.bouncedDeclined.registeredUserCount,
                        popupDisplayCount: data.bounced_declined.popupDisplayCount,
                        total: data.bounced_declined.total + eventCount.bouncedDeclined.total
                    }

                    data.declined = {
                        activeUserCount: data.declined.activeUserCount + eventCount.declined.activeUserCount,
                        activeCancelledUserCount: data.declined.activeCancelledUserCount + eventCount.declined.activeCancelledUserCount,
                        cancelledUserCount: data.declined.cancelledUserCount + eventCount.declined.cancelledUserCount,
                        registeredUserCount: data.declined.registeredUserCount + eventCount.declined.registeredUserCount,
                        popupDisplayCount: data.declined.popupDisplayCount,
                        total: data.declined.total + eventCount.declined.total
                    }
                    data.opt_in = {
                        activeUserCount: data.opt_in.activeUserCount + eventCount.optIn.activeUserCount,
                        activeCancelledUserCount: data.opt_in.activeCancelledUserCount + eventCount.optIn.activeCancelledUserCount,
                        cancelledUserCount: data.opt_in.cancelledUserCount + eventCount.optIn.cancelledUserCount,
                        registeredUserCount: data.opt_in.registeredUserCount + eventCount.optIn.registeredUserCount,
                        popupDisplayCount: data.opt_in.popupDisplayCount,
                        total: data.opt_in.total + eventCount.optIn.total
                    }

                    data.opt_in_link_sent = {
                        activeUserCount: data.opt_in_link_sent.activeUserCount + eventCount.optInLinkSent.activeUserCount,
                        activeCancelledUserCount: data.opt_in_link_sent.activeCancelledUserCount + eventCount.optInLinkSent.activeCancelledUserCount,
                        cancelledUserCount: data.opt_in_link_sent.cancelledUserCount + eventCount.optInLinkSent.cancelledUserCount,
                        registeredUserCount: data.opt_in_link_sent.registeredUserCount + eventCount.optInLinkSent.registeredUserCount,
                        popupDisplayCount: data.opt_in_link_sent.popupDisplayCount,
                        total: data.opt_in_link_sent.total + eventCount.optInLinkSent.total
                    }

                    data.opt_in_pending = {
                        activeUserCount: data.opt_in_pending.activeUserCount + eventCount.optInPending.activeUserCount,
                        activeCancelledUserCount: data.opt_in_pending.activeCancelledUserCount + eventCount.optInPending.activeCancelledUserCount,
                        cancelledUserCount: data.opt_in_pending.cancelledUserCount + eventCount.optInPending.cancelledUserCount,
                        registeredUserCount: data.opt_in_pending.registeredUserCount + eventCount.optInPending.registeredUserCount,
                        popupDisplayCount: data.opt_in_pending.popupDisplayCount + eventCount.optInPending.popupDisplayCount,
                        total: data.opt_in_pending.total + eventCount.optInPending.total
                    }
                    data.total = {
                        activeUser: data.total.activeUser + eventCount.totalRow.activeUser,
                        activeCancelledUserCount: data.total.activeCancelledUserCount + eventCount.totalRow.activeCancelledUserCount,
                        cancelledUserCount: data.total.cancelledUserCount + eventCount.totalRow.cancelledUserCount,
                        registeredUserCount: data.total.registeredUserCount + eventCount.totalRow.registeredUserCount,
                        popupDisplayCount: data.total.popupDisplayCount + eventCount.totalRow.popupDisplayCount,
                        total: data.total.total + eventCount.totalRow.total
                    }
                    await data.save()
                }

                const cronStatusData = {
                    domain: website_url,
                    command_name: 'Get Opt in Status Report',
                    cron_status: 'success',
                    target_date: target_date,
                    message: ''
                }
                await addCronStatusLog(cronStatusData)
                resolve(true)
            } else {
                const cronStatusData = {
                    domain: website_url,
                    command_name: 'Get Opt in Status Report',
                    cron_status: 'error',
                    target_date: target_date,
                    message: 'Error from Website api'
                }
                await addCronStatusLog(cronStatusData)
                console.log('Error from Website api')
                resolve(false)
            }
        } catch (error) {
            const errorMessage = _.get(error, 'message', 'Error in Get OptIn Count Report From Website')
            const cronStatusData = {
                domain: website_url,
                command_name: 'Get Opt in Status Report',
                cron_status: 'error',
                target_date: target_date,
                message: errorMessage
            }
            await addCronStatusLog(cronStatusData)
            reject(error)
        }
    })
}

module.exports = getOptInStatusReport
