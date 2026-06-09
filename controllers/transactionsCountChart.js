const express = require('express')
const router = express.Router()
const moment = require('moment')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils/index')
const TransactionCountLogs = require('../models/TransactionCountLogs')
const CCBillRestApiAddCardLog = require('../models/CCBillRestApiAddCardLog')
const { isDateFormatInvalid } = require('../utils/transactionsCountChart')

/** returns datewise transactions' count which willl be used for line-chart */
router.post('/', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const { start_date, end_date, transactionsCountDomain } = req.body
        const dateFormat = 'MM/DD/YYYY'
        if (isDateFormatInvalid(start_date, dateFormat) && isDateFormatInvalid(end_date, dateFormat)) {
            return errorResponse(res, 'Invalid input', `Please provide date of ${dateFormat} format`, 400)
        }

        const endDate = moment(new Date(end_date))
        let startDate = moment(new Date(start_date))
        let matchQuery = {
            date: {
                $gte: startDate.toDate(),
                $lt: endDate.add(1, 'day').toDate()
            }
        }
        let addCardLogMatchQuery = {
            createdAt: {
                $gte: startDate.toDate(),
                $lt: endDate.add(1, 'day').toDate()
            }
        }
        const commonQuery = [{
            $project: {
                date: '$_id',
                total: { $add: ['$success', '$failed'] },
                success: '$success',
                failed: '$failed',
                _id: 0
            }
        }, {
            $sort: {
                date: 1
            }
        }]

        if (transactionsCountDomain !== '') {
            matchQuery.domain = transactionsCountDomain
            addCardLogMatchQuery.domain = transactionsCountDomain
        }

        let transactionsLog = await TransactionCountLogs.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    success: { $sum: { $cond: { if: '$success', then: '$success', else: 0 } } },
                    failed: { $sum: { $cond: { if: '$failed', then: '$failed', else: 0 } } }
                }
            },
            ...commonQuery
        ])

        let addCardLogs = await CCBillRestApiAddCardLog.aggregate([
            {
                $match: addCardLogMatchQuery
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    success: { $sum: { $cond: { if: '$is_error', then: 0, else: 1 } } },
                    failed: { $sum: { $cond: { if: '$is_error', then: 1, else: 0 } } }
                }
            },
            ...commonQuery
        ])

        const chartData = []
        const chartLegend = ['Date', 'Total', 'Success', 'Failed']
        let index = 0
        let transactionLogIndex = 0
        let addCardLogIndex = 0
        let dateRangeDifference = endDate.diff(startDate, 'days')

        while (dateRangeDifference !== 1) {
            const chartDate = moment(startDate, dateFormat)
            chartData.push([startDate.format(dateFormat), 0, 0, 0])

            transactionLogIndex += fillChartData(chartData, index, transactionsLog, transactionLogIndex, chartDate)
            addCardLogIndex += fillChartData(chartData, index, addCardLogs, addCardLogIndex, chartDate)

            startDate = startDate.add(1, 'day')
            dateRangeDifference--
            index++
        }

        chartData.unshift(chartLegend)
        return successResponse(res, chartData, 'Fetch Transactions Count Data.', 200)
    } catch (err) {
        console.log(err)
        return errorResponse(res, err, err.message, 500)
    }
})

// populate chartData with logs if log exists for matching date of chartDataInstance
const fillChartData = (chartData, chartDataInstanceIndex, logs, logIndex, date) => {
    if (logs.length > 0) {
        const trasactionDate = moment(logs[logIndex].date, 'YYYY-MM-DD')
        const dateDifference = trasactionDate.diff(date, 'days')
        if (!dateDifference) {
            fillChartDataInstance(chartData[chartDataInstanceIndex], logs[logIndex])
            if (logIndex < logs.length - 1) {
                return 1
            }
        }
    }
    return 0
}

// populate chartDataInstance with total,success & failed logs
const fillChartDataInstance = (chartDataInstance, log) => {
    chartDataInstance[1] += log.total
    chartDataInstance[2] += log.success
    chartDataInstance[3] += log.failed
}

module.exports = router
