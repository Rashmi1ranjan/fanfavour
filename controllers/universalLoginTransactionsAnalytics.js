const express = require('express')
const router = express.Router()
const moment = require('moment')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const HybridTransactionLogs = require('./../models/HybridTransactionLogs')
const { errorResponse, successResponse, getDatesArray } = require('../utils')

router.post('/', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const domain = req.body.domain !== undefined ? req.body.domain : ''

        const start_date = (req.body.start_date == '') ? moment().subtract(6, 'days').format('MM-DD-YYYY') : req.body.start_date
        const end_date = (req.body.end_date == '') ? moment().format('MM-DD-YYYY') : req.body.end_date

        const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DD')
        const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DD')

        const allDates = getDatesArray(dateStart, dateEnd)

        const earnings = []
        for (const date of allDates) {
            const start = moment.utc(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT00:00:00-07:00'))
            const end = moment.utc(moment(date, 'YYYY-MM-DD').format('YYYY-MM-DDT23:59:59-07:00'))

            const filter = {
                transaction_date: {
                    $gte: new Date(start),
                    $lte: new Date(end)
                },
                is_success: true
            }
            if (domain !== '') {
                filter.domain = domain
            }

            const earning = await HybridTransactionLogs.aggregate([
                { $match: filter },
                {
                    $project: {
                        'transaction_date': {
                            $dateToString: {
                                format: '%d-%m-%Y',
                                date: '$transaction_date'
                            }
                        },
                        'amount': 1,
                        'final_payment_gateway': 1,
                        'is_user_universal': 1
                    }
                },
                {
                    $group: {
                        '_id': {
                            'date': '$transaction_date',
                            'is_user_universal': '$is_user_universal'
                        },
                        'sum': {
                            $sum: '$amount'
                        }
                    }
                }
            ])

            if (earning.length > 0) {
                let universalUserEarningForDay = 0
                let nonUniversalUserEarningForDay = 0
                let totalUserEarningForDay = 0
                for (let index = 0; index < earning.length; index++) {
                    const dailyEarning = earning[index]
                    universalUserEarningForDay += dailyEarning._id.is_user_universal === true ? dailyEarning.sum : 0
                    nonUniversalUserEarningForDay += dailyEarning._id.is_user_universal !== true ? dailyEarning.sum : 0
                    totalUserEarningForDay += dailyEarning.sum
                }

                earnings.push({
                    date: moment(start).format('MM-DD-YYYY'),
                    non_universal_users_earnings: nonUniversalUserEarningForDay,
                    universal_users_earnings: universalUserEarningForDay,
                    total_earning_for_day: totalUserEarningForDay
                })
            } else {
                earnings.push({
                    date: moment(start).format('MM-DD-YYYY'),
                    non_universal_users_earnings: 0,
                    universal_users_earnings: 0,
                    total_earning_for_day: 0
                })
            }
        }

        return successResponse(res, earnings, 'Fetched earnings successfully.')
    } catch (error) {
        return errorResponse(res, error, 'Error while fetching earnings')
    }
})

module.exports = router
