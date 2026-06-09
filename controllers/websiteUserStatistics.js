const express = require('express')
const fs = require('fs')
const path = require('path')
const createCsvWriter = require('csv-writer').createArrayCsvWriter
const moment = require('moment')
const WebsiteUserDetails = require('../models/WebsiteUserDetails')
const { errorResponse, successResponse } = require('./../utils/index')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const asyncHandler = require('express-async-handler')
const _ = require('lodash')

const router = express.Router()

router.post('/get-website-user-statistics', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const query = {}
        if (req.body.domain !== '') {
            query.domain = req.body.domain
        }
        let totalWebsitesUsersStatisticsData = await WebsiteUserDetails.aggregate([
            {
                $group: {
                    _id: null,
                    totalDomain: { $sum: 1 },
                    totalRegistered: { $sum: '$registered' },
                    totalSubscription: { $sum: '$subscribed_ever' },
                    totalActiveCanceled: { $sum: '$active_cancelled_subscription' },
                    totalActiveSubscription: { $sum: '$active_subscription' },
                    totalRecentlyVisitedAll: { $sum: '$recently_visited_all' },
                    totalRecentlyVisitedSubscribers7: { $sum: '$recently_visited_subscribers_7' },
                    totalRecentlyVisitedSubscribers45: { $sum: '$recently_visited_subscribers_45' },
                    totalRecentlyVisitedActiveCanceled7: { $sum: '$recently_visited_active_cancelled_7' },
                    totalRecentlyVisitedActiveCanceled45: { $sum: '$recently_visited_active_cancelled_45' },
                    totalAverageMonthlyRevenue: { $sum: '$average_monthly_revenue' },
                    totalBlockUsers: { $sum: '$block_users' }
                }
            }
        ])

        let currentPage = parseInt(req.body.page_num, 10)
        const totalRows = await WebsiteUserDetails.countDocuments(query)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit
        let rows = []
        let sortBy = { 'recently_visited_subscribers_45': 'desc' }
        if (req.body.sortBy) {
            sortBy = { [`${req.body.sortBy.key}`]: req.body.sortBy.direction }
        }

        if (totalRows > 0) {
            rows = await WebsiteUserDetails.find(query).skip(offset).limit(limit).sort(sortBy)
        }

        const data = {
            rows,
            totalPages,
            currentPage,
            totalRows,
            limit,
            totalWebsitesUsersStatisticsData
        }
        return successResponse(res, data, 'Suspicious User saved.', 200)
    } catch (error) {
        return errorResponse(res, error, 'Error in get website user statistics')
    }
})

router.post('/export-website-user-statistics', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        let csvDownloadPath = ''
        const websiteUserDetails = await WebsiteUserDetails.find({})
        csvDownloadPath = await generateCSVFile(websiteUserDetails)
        const data = {
            csvUrl: csvDownloadPath
        }
        return successResponse(res, data, 'CSV Generated Successfully', 200)
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
}))

router.post('/download-website-user-statistics-csv', async (req, res) => {
    try {
        const fileName = req.body.file
        const options = {
            root: path.resolve(__dirname, './../temp'),
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
        return errorResponse(res, error, 'Error in csv download', 500)
    }
})

/**
 * generate csv file of website user statistics
 *
 * @param {object} websiteUserDetails website users Statistics
 * @returns {string} filename of csv file
 */
async function generateCSVFile(websiteUserDetails) {
    try {
        let paths = path.resolve(`${__dirname}`, './../temp/')
        removeOldCSVFiles(paths)

        let fileName = `${moment().format('YY-MM-DD')}webSiteUserStatistics.csv`
        let tempPath = path.resolve(`${__dirname}`, `./../temp/${fileName}`)
        let header = ['Domain', 'Registered users', 'Subscribed Users', 'Active Subscribers', 'Active Cancelled Subscribers', 'Users (7 days)', 'Active Subscribers (7 days)', 'Active Subscribers (45 days)', 'Active Canceled Subscribers (7 days)', 'Active Canceled Subscribers (45 days)', 'Avg. Monthly Revenue (3 month)', 'Block Users']
        const csvWriter = createCsvWriter({
            header: header,
            path: tempPath
        })
        const formateWebsiteUserDetails = await generateWebsiteUserDetails(websiteUserDetails)
        csvWriter.writeRecords(formateWebsiteUserDetails).then(() => {
        })
        return fileName
    } catch (error) {
        console.log(error)
    }
}

/**
 * remove old csv files from temp folder
 *
 * @param {string} paths temp folder path
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

/**
 * change data format
 *
 * @param {object} userDetails website user details
 * @returns {object} format data
 */
function generateWebsiteUserDetails(userDetails) {
    let websiteUserDetails = []
    for (let detail of userDetails) {
        const average_monthly_revenue = parseFloat(_.get(detail, 'average_monthly_revenue', 0))
        websiteUserDetails.push([
            detail.domain,
            detail.registered,
            detail.subscribed_ever,
            detail.active_subscription,
            detail.active_cancelled_subscription,
            detail.recently_visited_all,
            detail.recently_visited_subscribers_7,
            detail.recently_visited_subscribers_45,
            detail.recently_visited_active_cancelled_7,
            detail.recently_visited_active_cancelled_45,
            average_monthly_revenue.toFixed(2),
            detail.block_users
        ])
    }
    return websiteUserDetails
}

module.exports = router
