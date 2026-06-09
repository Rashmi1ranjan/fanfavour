const express = require('express')
const router = express.Router()
const moment = require('moment')
const _ = require('lodash')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse, getDatesArray, getHoursArray, getDateDifferent } = require('../utils/index')
const { getHourlyTransaction } = require('./../utils/hourlyTransaction')

router.post('/', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        const filter = req.body
        const domain = _.get(filter, 'hourlyTransactionDomain', '')
        const startDate = filter.start_date
        const endDate = filter.end_date
        const daysDiff = getDateDifferent(startDate, endDate)

        let hourlyTransaction = []
        if (daysDiff > 0) {
            const dateStart = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DD')
            const dateEnd = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DD')
            const allDates = getDatesArray(dateStart, dateEnd)

            for (const date of allDates) {
                const start_date = moment(date, 'YYYY-MM-DD').startOf('day')
                const end_date = moment(date, 'YYYY-MM-DD').endOf('day')

                const getHourlyTransactionData = await getHourlyTransaction(start_date, end_date, domain, daysDiff)
                hourlyTransaction.push(getHourlyTransactionData)
            }
        } else {
            const date_start = moment(startDate, 'MM/DD/YYYY').startOf('day')
            const date_end = moment(startDate, 'MM/DD/YYYY').endOf('day')

            const allHours = getHoursArray(date_start, date_end)
            for (let date of allHours) {
                const startHour = moment(date).format('YYYY-MM-DDTHH:00:00')
                const endHour = moment(date).add(1, 'hours').format('YYYY-MM-DDTHH:00:00')

                const getHourlyTransactionData = await getHourlyTransaction(startHour, endHour, domain, 0)
                hourlyTransaction.push(getHourlyTransactionData)
            }
        }
        return successResponse(res, hourlyTransaction, 'Fetch Hourly Transaction Data.', 200)
    } catch (err) {
        return errorResponse(res, err, err.message, 500)
    }
})

module.exports = router
