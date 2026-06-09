const express = require('express')
const router = express.Router()
const _ = require('lodash')
const asyncHandler = require('express-async-handler')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ANALYTICS, ROLE_REFERRAL } = require('./../middleware/auth.middleware')
const websiteAnalytics = require('./../models/websiteAnalytics')
const WebsiteDailyEarningReport = require('../models/WebsiteDailyEarningReport')
const moment = require('moment')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs').promises
const createCsvWriter = require('csv-writer').createArrayCsvWriter
const Website = require('../models/Website')
const { v4: uuidv4 } = require('uuid')

/**
 * @description get user counts
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get_user_count', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS]), asyncHandler(async (req, res) => {
    const domain = req.body.domain !== undefined ? req.body.domain : ''
    const start_date = (req.body.start_date == '') ? moment().subtract(1, 'days').format('MM/DD/YYYY') : req.body.start_date
    const end_date = (req.body.end_date == '') ? moment().subtract(1, 'days').format('MM/DD/YYYY') : req.body.end_date

    const limit = 10
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 1
    const skip = (page - 1) * limit

    const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
    const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
    const match = {
        date: {
            $gte: new Date(dateStart),
            $lte: new Date(dateEnd)
        }
    }

    if (!_.isEmpty(domain)) {
        match.domain = domain
    }

    const userCountsRecord = await websiteAnalytics.aggregate([
        { $match: match },
        { $skip: skip },
        { $limit: limit },
        {
            '$lookup': {
                'from': 'websites',
                'localField': 'domain',
                'foreignField': 'website_url',
                'as': 'website'
            }
        }, {
            $unwind: '$website'
        }, {
            $project: {
                'date': 1,
                'domain': 1,
                'registration': 1,
                'subscription': 1,
                'cancellation': 1,
                'subscription_revenue': 1,
                'website.website_id': 1
            }
        }
    ])
    const totalRecords = await websiteAnalytics.countDocuments(match)

    const totalPages = Math.ceil(totalRecords / limit)

    const data = {
        records: userCountsRecord,
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
    }

    return res.send(data)
}))

/**
 * @description export user count csv
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/export_user_count', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS]), asyncHandler(async (req, res) => {
    try {
        const reportType = req.body.report_type
        if (_.isEmpty(reportType)) {
            res.send({ error: 'report_type is required' })
            return
        }
        const domain = req.body.domain
        const project = { website_url: 1, first_subscription_date: 1, website_id: 1 }
        let domains
        if (_.isEmpty(req.body.domain)) {
            let websiteWhere = {
                $or: [
                    { status: 'live' },
                    { status: 'published' }
                ]
            }
            domains = await Website.find(websiteWhere, project).sort({ website_id: 1 })
        } else {
            domains = await Website.find({ website_url: domain }, project).sort({ website_id: 1 })
        }

        const csvHeader = ['Id', 'Domain']
        const dateFormat = 'YYYY-MM-DDT00:00:00.000'
        const userCountArray = []

        const websitesLunchDate = moment('2019-12-16', 'YYYY-MM-DD').format(dateFormat)
        const todayDate = moment().format(dateFormat)
        const allMonths = getMonthsArray(websitesLunchDate, todayDate)

        for (const domain of domains) {
            const row = [domain.website_id, domain.website_url]
            for (const month of allMonths) {
                const monthKey = moment(month.start).format('MMMM YYYY')
                let monthKeyIndexInCSVHeader = csvHeader.indexOf(monthKey)
                if (monthKeyIndexInCSVHeader === -1) {
                    csvHeader.push(monthKey)
                    monthKeyIndexInCSVHeader = csvHeader.length - 1
                }

                const match = {
                    domain: domain.website_url,
                    date: {
                        $gte: new Date(month.start),
                        $lte: new Date(month.end)
                    }
                }

                const userCountsRecord = await websiteAnalytics.aggregate([
                    {
                        $match: match
                    }, {
                        $group: {
                            _id: null,
                            count: { $sum: `$${reportType}` }
                        }
                    }
                ])
                const counts = userCountsRecord[0]
                row.splice(monthKeyIndexInCSVHeader, 0, counts === undefined ? 0 : counts.count)
            }
            userCountArray.push(row)
        }
        const fileName = `user_${reportType}_${uuidv4()}.csv`
        generateCSV(csvHeader, userCountArray, fileName)
        res.send({ csvUrl: fileName })
    } catch (error) {
        console.log(error)
    }
}))

/**
 * @description export user count csv
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/export_monthly_revenue', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS]), asyncHandler(async (req, res) => {
    try {
        const reportType = req.body.report_type
        if (_.isEmpty(reportType)) {
            res.send({ error: 'report_type is required' })
            return
        }
        const domain = req.body.domain

        const project = { website_url: 1, first_subscription_date: 1, website_id: 1 }
        let domains
        if (_.isEmpty(req.body.domain)) {
            let websiteWhere = {
                $or: [
                    { status: 'live' },
                    { status: 'published' }
                ]
            }
            domains = await Website.find(websiteWhere, project).sort({ website_id: 1 })
        } else {
            domains = await Website.find({ website_url: domain }, project).sort({ website_id: 1 })
        }

        const filters = {
            'subscription_revenue': { $sum: '$subscription_amount' },
            'gross_revenue': { $sum: '$gross_revenue' },
            'platform_revenue': { $sum: '$platform_earning' },
            'model_revenue': { $sum: '$model_earning' },
            'referral_revenue': { $sum: { $add: ['$referral_amount', '$referral_amount1', '$referral_amount2'] } }
        }

        const csvHeader = ['Id', 'Domain']
        const dateFormat = 'YYYY-MM-DDT00:00:00.000'
        const userCountArray = []

        const websitesLunchDate = moment('2019-12-16', 'YYYY-MM-DD').format(dateFormat)
        const todayDate = moment().format(dateFormat)
        const allMonths = getMonthsArray(websitesLunchDate, todayDate)

        for (const domain of domains) {
            const row = [domain.website_id, domain.website_url]
            for (const month of allMonths) {
                const monthKey = moment(month.start).format('MMMM YYYY')
                let monthKeyIndexInCSVHeader = csvHeader.indexOf(monthKey)
                if (monthKeyIndexInCSVHeader === -1) {
                    csvHeader.push(monthKey)
                    monthKeyIndexInCSVHeader = csvHeader.length - 1
                }

                const match = {
                    domain: domain.website_url,
                    target_date: {
                        $gte: new Date(month.start),
                        $lte: new Date(month.end)
                    }
                }

                const userCountsRecord = await WebsiteDailyEarningReport.aggregate([
                    {
                        $match: match
                    }, {
                        $group: {
                            _id: null,
                            count: filters[reportType]
                        }
                    }
                ])

                const counts = userCountsRecord[0]
                row.splice(monthKeyIndexInCSVHeader, 0, counts === undefined ? 0 : counts.count.toFixed(2))
            }
            userCountArray.push(row)
        }
        const fileName = `monthly_${reportType}_${uuidv4()}.csv`
        generateCSV(csvHeader, userCountArray, fileName)
        res.send({ csvUrl: fileName })
    } catch (error) {
        console.log(error)
    }
}))

/**
 * @description Get Date array
 * @param {string} firstDate start date
 * @param {string} lastDate end date
 * @returns {*} monthArray
 */
function getMonthsArray(firstDate, lastDate) {
    const monthArray = []
    let startDate = moment(firstDate)
    const endDate = moment(lastDate)
    while (startDate <= endDate) {
        const month = {
            start: moment(startDate).startOf('month').format('YYYY-MM-DDT00:00:00'),
            end: moment(startDate).endOf('month').format('YYYY-MM-DDT23:59:59')
        }
        monthArray.push(month)
        startDate = moment(startDate).add(1, 'months').startOf('month')
    }
    return monthArray
}

/**
 * @description export csv and return link for file path
 * @param {Array} headerArray csv Headers
 * @param {Array} dataArray csv Data
 * @param {string} fileName csv file name
 * @returns {string} csv path
 */
async function generateCSV(headerArray, dataArray, fileName) {
    try {
        const paths = path.resolve(`${__dirname}`, './../temp/')
        removeOldCSVFiles(paths)

        const tempPath = path.resolve(`${__dirname}`, `./../temp/${fileName}`)
        const header = headerArray

        const csvWriter = createCsvWriter({
            header: header,
            path: tempPath
        })
        csvWriter.writeRecords(dataArray)
            .then(() => {
            })
        return '/report/' + fileName
    } catch (error) {
        console.log(error)
    }
}

/**
 * @description Download CSV file
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/download_csv', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_REFERRAL]), asyncHandler(async (req, res) => {
    try {
        const fileName = req.body.file
        if (_.isEmpty(fileName)) {
            res.send({ error: 'file is required' })
            return
        }
        const options = {
            root: path.resolve(__dirname, '../temp'),
            headers: {
                'Content-disposition': `attachment; filename=${fileName}`,
                'x-timestamp': Date.now(),
                'x-sent': true
            }
        }

        res.sendFile(fileName, options, function (error) {
            if (error) {
                console.log(error)
            }
        })
    } catch (error) {
        console.log(error)
    }
}))

/**
 * @description Remove old csv from folder
 * @param {string} paths Dir path
 */
function removeOldCSVFiles(paths) {
    fs.readdirSync(paths).forEach(file => {
        if (file !== '.gitignore') {
            fs.stat(paths + '/' + file, function (err, stat) {
                const now = new Date().getTime()
                const endTime = new Date(stat.mtime).getTime() + (60 * 60 * 1000) // 1 hour in milliseconds
                if (err) { return console.error(err) }
                if (now > endTime) {
                    fs.unlinkSync(paths + '/' + file)
                }
            })
        }
    })
}

module.exports = router
