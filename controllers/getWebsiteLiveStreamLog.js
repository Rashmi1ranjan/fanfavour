const express = require('express')
const router = express.Router()
const _ = require('lodash')
const asyncHandler = require('express-async-handler')
const Website = require('../models/Website')
const WebsiteLiveStreamLog = require('../models/WebsiteLiveStreamLog')
const { API_AUTH_TOKEN } = require('./../utils/index')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ANALYTICS } = require('./../middleware/auth.middleware')
const { postData, successResponse, errorResponse } = require('../utils/index')
const moment = require('moment')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

/**
 * @description API to get live Stream information from websites
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/save-live-stream-Info', asyncHandler(async (req, res) => {
    const { error, isValid } = validateSaveLiveStreamInfo(req.body)
    if (!isValid) {
        return res.send({ error: error })
    }
    try {
        const getWebSiteId = await Website.findOne({ website_url: req.body.domain }, { website_id: 1 })
        if (getWebSiteId === null) {
            return res.send({ error: 'Invalid domain' })
        }
        const duration = calculateTimeDifference(req.body.start_time, req.body.end_time)
        const streamData = {
            domain: req.body.domain,
            domain_id: getWebSiteId.website_id,
            stream_start_time: req.body.start_time,
            stream_end_time: req.body.end_time,
            stream_id: req.body.stream_id,
            duration: duration
        }
        if (req.body.username !== undefined) {
            streamData.username = req.body.username
        }
        if (req.body.user_id !== undefined) {
            streamData.user_id = req.body.user_id
        }
        if (req.body.tips !== undefined) {
            streamData.tips = req.body.tips
        }
        if (req.body.pre_tip !== undefined) {
            streamData.pre_tip = req.body.pre_tip
        }
        if (req.body.max_users !== undefined) {
            streamData.max_users = req.body.max_users
        }
        if (req.body.stream_type !== undefined) {
            streamData.stream_type = req.body.stream_type
        }
        const websiteLiveStreamLog = new WebsiteLiveStreamLog(streamData)
        const saveStreamData = await websiteLiveStreamLog.save()
        if (saveStreamData === null) {
            res.send({ error: 'Error! Data not saved' })
        }
        res.send({ success: 'Live Stream Data successfully saved' })
    } catch (error) {
        console.log(error)
        res.send({ error: 'Something want wrong try again' })
    }
}))

/**
 * @description calculate time duration from start and end time
 * @param {string} start_time start time
 * @param {string} end_time end time
 * @returns {string} duration
 */
function calculateTimeDifference(start_time, end_time) {
    const startTime = moment(start_time)
    const endTime = moment(end_time)
    let durationInSeconds = endTime.diff(startTime, 'seconds')
    let duration
    if (durationInSeconds < 60) {
        duration = `0min ${durationInSeconds}sec`
    } else {
        const durationInMins = Math.floor(durationInSeconds / 60)
        durationInSeconds = durationInSeconds % 60
        duration = `${durationInMins}min ${durationInSeconds}sec`
    }

    return duration
}

/**
 * @description validate saveLiveStreamInfo
 * @param {object} param request param object
 * @returns {object} error and isValid
 */
function validateSaveLiveStreamInfo(param) {
    // token validation
    if (_.isEmpty(param.token) || param.token !== API_AUTH_TOKEN) {
        return { isValid: false, error: 'You are not authorized' }
    }

    let error = ''
    // request param validation
    if (_.isEmpty(param.domain)) {
        error += _.isEmpty(error) ? 'Domain' : ', Domain'
    }
    if (_.isEmpty(param.start_time)) {
        error += _.isEmpty(error) ? 'Start Time' : ', Start Time'
    }
    if (_.isEmpty(param.end_time)) {
        error += _.isEmpty(error) ? 'End Time' : ', End Time'
    }
    if (_.isEmpty(param.stream_id)) {
        error += _.isEmpty(error) ? 'Stream id' : ', Stream id'
    }

    error += _.isEmpty(error) ? '' : ' Field(s) should not be empty'
    return { error, isValid: _.isEmpty(error) }
}

/**
 * @description listing all website stream on services
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-website-stream', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS]), asyncHandler(async (req, res) => {
    const domain = req.body.domain !== undefined ? req.body.domain : ''
    const limit = 10
    const page = req.query.page !== undefined ? parseInt(req.query.page) : 1
    const skip = (page - 1) * limit

    let match = {}
    if (!_.isEmpty(domain)) {
        match.domain = domain
    }

    const totalRecords = await WebsiteLiveStreamLog.countDocuments(match)
    const totalPages = Math.ceil(totalRecords / limit)
    const records = await WebsiteLiveStreamLog.find(match).sort({ _id: -1 }).limit(limit).skip(skip)
    const data = {
        records: records,
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
    }
    return res.send(data)
}))

/**
 * @description listing all website stream on services
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-website-stream-url', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS]), asyncHandler(async (req, res) => {
    const stream_id = req.body.stream_id

    const findStreamById = await WebsiteLiveStreamLog.findOne({ stream_id })
    const domain = getWebsiteDomain(findStreamById.domain)
    const api_url = `${domain}/api/stream/get_live_stream_filename`
    const data = {
        token: API_AUTH_TOKEN,
        stream_id: stream_id
    }

    const streamUrl = await postData(api_url, data)
    const stream = JSON.parse(streamUrl)
    if (stream.success === 1) {
        return successResponse(res, stream.data, stream.message, stream.status)
    } else {
        return errorResponse(res, stream.data, stream.message, stream.status)
    }
}))

module.exports = router
