const express = require('express')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')
const WebsiteCronStatus = require('../models/WebsiteCronStatus')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { errorResponse, successResponse } = require('../utils')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const { getDatesArray } = require('../utils/index')

router.get('/cron-details', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', [])
        let start_date = _.get(req, 'query.start_date', moment().format('YYYY-MM-DDT00:00:00.000Z'))
        let end_date = _.get(req, 'query.end_date', moment().format('YYYY-MM-DDT00:00:00.000Z'))

        start_date = moment(new Date(start_date)).format('YYYY-MM-DDT00:00:00.000+00:00')
        end_date = moment(new Date(end_date)).format('YYYY-MM-DDT00:00:00.000+00:00')

        let query = {}
        if (_.isEmpty(domain) === false) {
            query.domain = { $in: domain }
        }
        const allDates = getDatesArray(start_date, end_date, 'YYYY-MM-DDT00:00:00.000+00:00')
        const data = []
        for (const date of allDates) {
            const counts = await getCronDataOfaDay(date, query)
            data.push(counts)
        }
        return successResponse(res, data, 'Get cron details successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'Something went wrong', 500)
    }
})

router.post('/add-cron-status', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, {}, 'You are not authorized', 401)
        }

        const domain = _.get(req.body, 'domain', '')
        const command_name = _.get(req.body, 'command_name', '')
        const cron_status = _.get(req.body, 'cron_status', 'running')
        const updated_user_count = _.get(req.body, 'updated_user_count', '')
        const updateCronStatus = _.get(req.body, 'updateCronStatus', false)
        const message = _.get(req.body, 'message', '')
        let target_date = _.get(req.body, 'target_date', moment().format('YYYY-MM-DDT00:00:00.000'))
        target_date = new Date(target_date)

        let websiteCronStatus = {}
        if (updateCronStatus) {
            websiteCronStatus = await WebsiteCronStatus.findOne({ domain: domain, command_name: command_name, cron_status: 'running', target_date: target_date })
            if (_.isEmpty(websiteCronStatus)) {
                console.log('Cron Data Not Found', { domain, command_name, target_date })
                return errorResponse(res, {}, 'Cron Data Not Found', 400)
            } else {
                websiteCronStatus.updated_user_count = updated_user_count.toString()
                websiteCronStatus.message = message
            }
            websiteCronStatus.cron_status = cron_status
        } else {
            websiteCronStatus = new WebsiteCronStatus({ domain, command_name, cron_status, target_date })
        }
        await websiteCronStatus.save()
        return successResponse(res, {}, 'Success', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Internal Server Error')
        return errorResponse(res, error, errorMessage, 500)
    }
})

/**
 * ads
 *
 * @param {*} date date
 * @param {*} query date
 * @returns {*} sa
 */
async function getCronDataOfaDay(date, query) {
    let dateStart = moment(new Date(date)).format('YYYY-MM-DDT00:00:00.000+00:00')
    let dateEnd = moment(new Date(date)).format('YYYY-MM-DDT23:59:59.999+00:00')
    query.target_date = {
        $gte: new Date(dateStart),
        $lte: new Date(dateEnd)
    }
    const data = await WebsiteCronStatus.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$cron_status',
                counts: {
                    $sum: 1
                }
            }
        }
    ])
    if (_.isEmpty(data)) {
        return { date: dateStart, success: 0, error: 0 }
    }
    const successData = data.find(item => item._id === 'success')
    const errorData = data.find(item => item._id === 'error')
    return {
        date: dateStart,
        success: successData ? successData.counts : 0,
        error: errorData ? errorData.counts : 0
    }
}

module.exports = router
