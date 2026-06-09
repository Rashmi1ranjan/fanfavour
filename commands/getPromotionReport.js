const PromotionReport = require('./../models/PromotionReport')
const Website = require('../models/Website')
const rp = require('request-promise')
const _ = require('lodash')
const moment = require('moment')
const { addCronStatusLog } = require('../utils/addCronStatus')

/**
 * website loop get promotion report
 *
 * @param {string} type type
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @returns {boolean} true false
 */
async function getPromotionReport(type, startDate, endDate) {
    if (!['all', 'range', 'daily'].includes(type)) {
        console.log('Missing Type!! Type should be all or range')
        return
    }
    if (type === 'range') {
        if (_.isEmpty(startDate)) {
            console.log('Missing Start Date')
            return
        }
    }
    let targetStartDate = startDate
    let targetEndDate = endDate

    if (type === 'daily') {
        targetStartDate = moment().startOf('day').subtract(1, 'days').format('YYYY-MM-DD 00:00:00')
        targetEndDate = moment().startOf('day').subtract(1, 'days').format('YYYY-MM-DD 23:59:59')
    }

    let totalWebsites = 0
    let condition = { status: { $in: ['live', 'published'] } }
    try {
        totalWebsites = await Website.countDocuments(condition)
        console.log('totalWebsites', totalWebsites)
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
                await getPromotionReportFromWebsite(websites[i].website_url, type, targetStartDate, targetEndDate)
            } catch (error) {
                console.log(error.message)
            }
        }
    }
    return
}

/**
 * get promotion report from website
 *
 * @param {string} website_url website_url
 * @param {string} content_type content_type
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @returns {boolean} true false
 */
async function getPromotionReportFromWebsite(website_url, content_type, startDate, endDate) {
    const deletedRecord = await deletePromotionRecords(website_url, content_type, startDate, endDate)
    console.log(website_url, ' No of Record deleted', deletedRecord.deletedCount)
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    return new Promise(async (resolve, reject) => {
        const websiteUrl = 'https://api.' + website_url + '/api/promotion-setting/get-promotion-reports-for-services'
        const token = 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl'
        const requestBody = {
            type: (content_type === 'daily') ? 'range' : content_type,
            token: token,
            startDate: startDate
        }
        if (endDate !== null) {
            requestBody.endDate = endDate
        }
        try {
            let body = await rp.post({
                url: websiteUrl,
                json: requestBody
            })

            if (body.status === 200) {
                let insertRows = []
                const createdAt = new Date()
                for (let i = 0; i < body.data.total_record; i++) {
                    const element = body.data.report[i]
                    const promotionId = _.get(element, 'id', '')
                    const promotionInfo = _.get(element, 'promotion_info', '')
                    const startDate = _.get(element, 'start_date', '')
                    const duration = _.get(element, 'duration', '')
                    const discount = _.get(element, 'discount', '')
                    const promoMessage = _.get(element, 'promo_message', '')
                    const numberOfTransaction = _.get(element, 'number_of_transaction', '')
                    const revenue = _.get(element, 'revenue', '')
                    const registration = _.get(element, 'registration', '')
                    const promotionType = _.get(element, 'type', '')
                    const applicableTo = _.get(element, 'applicable_to', '')

                    const promotionReport = {
                        promotion_id: promotionId,
                        promotion_info: promotionInfo,
                        start_date: startDate,
                        duration: duration,
                        discount: discount,
                        promo_message: promoMessage,
                        number_of_transaction: numberOfTransaction,
                        revenue: revenue,
                        registration: registration,
                        promotion_type: promotionType,
                        website_url: website_url,
                        applicable_to: applicableTo,
                        created_at: createdAt
                    }
                    insertRows.push(promotionReport)
                }
                console.log(website_url, ' No of Record inserted', insertRows.length)
                await PromotionReport.insertMany(insertRows)

                const cronStatusData = {
                    domain: website_url,
                    command_name: 'Get Promotion Report From Website',
                    cron_status: 'success',
                    target_date: target_date,
                    message: ''
                }
                await addCronStatusLog(cronStatusData)
                resolve(true)
            } else {
                const cronStatusData = {
                    domain: website_url,
                    command_name: 'Get Promotion Report From Website',
                    cron_status: 'error',
                    target_date: target_date,
                    message: 'Error from Website api'
                }
                await addCronStatusLog(cronStatusData)
                console.log('Error from Website api')
                resolve(false)
            }
        } catch (error) {
            const errorMessage = _.get(error, 'message', 'Error in Get Promotion Report From Website')
            const cronStatusData = {
                domain: website_url,
                command_name: 'Get Promotion Report From Website',
                cron_status: 'error',
                target_date: target_date,
                message: errorMessage
            }
            await addCronStatusLog(cronStatusData)
            reject(error)
        }
    })
}

/**
 * delete old record
 *
 * @param {string} domain domain
 * @param {string} type type
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @returns {object} delete query response
 */
async function deletePromotionRecords(domain, type, startDate, endDate) {
    let condition = {
        website_url: domain
    }
    if (type !== 'all') {
        condition.start_date = {
            $gte: startDate
        }
        if (endDate !== null) {
            condition.start_date['$lte'] = endDate
        }
    }

    return await PromotionReport.deleteMany(condition)
}

module.exports = { getPromotionReport }
