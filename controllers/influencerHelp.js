const express = require('express')
const router = express.Router()
const InfluencerHelp = require('../models/InfluencerHelp')
const AwsSettings = require('../models/AwsSettings')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const mongoose = require('mongoose')
const _ = require('lodash')
const { API_STATIC_AUTH_TOKEN } = require('./../constants')
const moment = require('moment')
const UserHelpReadCount = require('./../models/UserHelpReadCount')
const HelpTags = require('./../models/HelpTags')
const Website = require('./../models/Website')

router.post('/get/details', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    try {
        let currentPage = parseInt(req.query.page_num, 10)
        const query = {}
        const filter = _.get(req, 'body.key', '')
        const helpTag = _.get(req, 'body.helpTag', '')
        const websiteTag = _.get(req, 'body.websiteTag', '')
        const for_admin = _.get(req, 'body.for_admin', '')
        if (filter !== '') {
            if (filter === 'only_help') {
                query.exclude_from_help = false
            } else {
                query[filter] = true
            }
        }
        if (helpTag !== '') {
            query.tags = { $in: helpTag }
        }

        if (for_admin !== '') {
            query.for_admin = { $ne: false }
            if (for_admin === 'user') {
                query.for_admin = false
            }
        }

        if (websiteTag !== '') {
            query.visible_to_tags = { $in: websiteTag }
        }
        const totalRows = await InfluencerHelp.countDocuments(query)
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (currentPage - 1) * limit
        let rows = []
        const awsSettings = await AwsSettings.findOne({}, 'aws_url is_cloud_front_enable cloud_front_url')
        if (totalRows > 0) {

            const data = await InfluencerHelp.find(query)
                .skip(offset).limit(limit).sort({ publish_date: -1, _id: -1 })

            for (let i = 0; i < data.length; i++) {
                const element = JSON.parse(JSON.stringify(data[i]))
                if (element.tags.length > 0) {
                    const query = {
                        _id: { $in: element.tags }
                    }
                    let data = await HelpTags.find(query, 'title')
                    element.tagList = data
                }
                if (element.visible_to_tags.length > 0 && element.is_visible_to_all_websites === false) {
                    const query = {
                        _id: { $in: element.visible_to_tags }
                    }
                    let data = await HelpTags.find(query, 'title')
                    element.specificWebsiteTagList = data
                }
                if (!_.isEmpty(element.video_url)) {
                    if (awsSettings.is_cloud_front_enable) {
                        element.video_url = `${awsSettings.cloud_front_url}/${element.video_url}`
                    } else {
                        element.video_url = `${awsSettings.aws_url}/${element.video_url}`
                    }
                }
                if (!_.isEmpty(element.pdf_url)) {
                    if (awsSettings.is_cloud_front_enable) {
                        element.pdf_url = `${awsSettings.cloud_front_url}/${element.pdf_url}`
                    } else {
                        element.pdf_url = `${awsSettings.aws_url}/${element.pdf_url}`
                    }
                }
                rows.push(element)
            }
        }
        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Get website influencer help successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/save', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', '')
    const title = _.get(data, 'title', '')
    const popupIntro = _.get(data, 'popup_intro', '')
    const html = _.get(data, 'html', '')
    const displayAsNotification = _.get(data, 'display_as_notification', false)
    const displayAsPopup = _.get(data, 'display_as_popup', false)
    const videoTitle = _.get(data, 'video_title', '')
    const videoUrl = _.get(data, 'video_url', '')
    const pdfTitle = _.get(data, 'pdf_title', '')
    const pdfUrl = _.get(data, 'pdf_url', '')
    const publishDate = _.get(data, 'publish_date', '')
    const publishDateFormat = await getTzFormatOfDate(publishDate)
    const excludeFromHelp = _.get(data, 'exclude_from_help', '')
    const tags = _.get(data, 'tags', [])
    const isVisibleToAllWebsites = _.get(data, 'is_visible_to_all_websites', false)
    const visibleToTags = _.get(data, 'visible_to_tags', [])
    const notificationExpirationDate = _.get(data, 'notification_expiration_date', '')
    const notificationExpirationDateFormat = await getTzFormatOfDate(notificationExpirationDate)
    const popupExpirationDate = _.get(data, 'popup_expiration_date', '')
    const popupExpirationDateFormat = await getTzFormatOfDate(popupExpirationDate)

    if (_.isEmpty(title)) {
        return res.send({ status: false, message: 'Title is required' })
    }

    if (_id === '') {
        const influencerData = {
            title: title,
            popup_intro: popupIntro,
            html: html,
            display_as_notification: displayAsNotification,
            display_as_popup: displayAsPopup,
            video_title: videoTitle,
            video_url: videoUrl,
            pdf_title: pdfTitle,
            pdf_url: pdfUrl,
            createdAt: new Date(),
            publish_date: publishDateFormat,
            exclude_from_help: excludeFromHelp,
            tags: tags,
            is_visible_to_all_websites: isVisibleToAllWebsites,
            visible_to_tags: visibleToTags,
            for_admin: true
        }
        if (displayAsNotification) {
            influencerData.notification_expiration_date = notificationExpirationDateFormat
        }
        if (displayAsPopup) {
            influencerData.popup_expiration_date = popupExpirationDateFormat
        }
        let influencerHelpData = new InfluencerHelp(influencerData)

        await influencerHelpData.save()
        return successResponse(res, {}, 'influencer help Save successfully', 200)
    } else {
        const newValues = {
            title: title,
            popup_intro: popupIntro,
            html: html,
            display_as_notification: displayAsNotification,
            display_as_popup: displayAsPopup,
            video_title: videoTitle,
            pdf_title: pdfTitle,
            updatedAt: new Date(),
            publish_date: publishDateFormat,
            exclude_from_help: excludeFromHelp,
            tags: tags,
            is_visible_to_all_websites: isVisibleToAllWebsites,
            visible_to_tags: visibleToTags,
            for_admin: true
        }
        if (videoUrl !== '') {
            newValues.video_url = videoUrl
        }
        if (pdfUrl !== '') {
            newValues.pdf_url = pdfUrl
        }

        if (displayAsNotification) {
            newValues.notification_expiration_date = notificationExpirationDateFormat
        }
        if (displayAsPopup) {
            newValues.popup_expiration_date = popupExpirationDateFormat
        }

        const query = { _id: _id }
        try {
            await InfluencerHelp.updateOne(query, {
                $set: newValues
            })

            return successResponse(res, {}, 'influencer help Save successfully', 200)
        } catch (error) {
            return errorResponse(res, error, error.message, 500)
        }
    }
})

router.get('/details', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)
    let data = await InfluencerHelp.findById(id)
    const awsSettings = await AwsSettings.findOne({}, 'aws_url is_cloud_front_enable cloud_front_url')
    if (!_.isEmpty(data.video_url)) {
        data.video_url = `${awsSettings.aws_url}/${data.video_url}`
    }
    if (!_.isEmpty(data.pdf_url)) {
        data.pdf_url = `${awsSettings.aws_url}/${data.pdf_url}`
    }
    return successResponse(res, data, 'influencer help Save successfully', 200)
})

router.post('/update/status', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let id = _.get(req, 'body._id', '')
    if (_.isEmpty(id)) {
        return errorResponse(res, 'error', 'Invalid Id', 500)
    }

    try {
        const influencerHelp = await InfluencerHelp.findOne({ _id: id })
        influencerHelp.is_active = !influencerHelp.is_active
        await influencerHelp.save()
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
    return successResponse(res, {}, 'influencer help status updated successfully', 200)
})

router.post('/delete', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let id = _.get(req, 'body._id', '')
    if (_.isEmpty(id)) {
        return errorResponse(res, 'error', 'Invalid Id', 500)
    }

    try {
        await InfluencerHelp.deleteOne({ _id: id })
        await UserHelpReadCount.deleteMany({ help_id: id })
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
    return successResponse(res, {}, 'influencer help delete successfully', 200)
})

router.post('/get/popup-with-notification-count', async (req, res) => {
    const token = _.get(req, 'body.token', '')
    const userRegisteredDate = _.get(req, 'body.userRegisteredDate', '')
    const userId = _.get(req, 'body.userId', '')
    const websiteDomain = _.get(req, 'body.domain', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const url = websiteDomain !== '' ? domain.hostname : ''
    const website = await Website.findOne({ website_url: url }, 'tag')

    if (token !== API_STATIC_AUTH_TOKEN || userId === '' || domain === '' || website === null) {
        return errorResponse(res, 'error', 'Invalid Request', 500)
    }

    const websiteTags = _.get(website, 'tag', [])
    const websiteTagIds = await getWebsiteTags(websiteTags)

    let currentDateAndTime = moment()
    currentDateAndTime = new Date(currentDateAndTime)

    const query = {
        is_active: true,
        publish_date: { $gt: userRegisteredDate, $lte: currentDateAndTime },
        display_as_popup: true,
        for_admin: true,
        '$or': [
            {
                'visible_to_tags': {
                    '$in': websiteTagIds
                }
            }, {
                'is_visible_to_all_websites': true
            }
        ],
        popup_expiration_date: { $gte: currentDateAndTime }
    }

    try {
        const awsSettings = await AwsSettings.findOne({}, 'aws_url is_cloud_front_enable cloud_front_url')
        // unread count for specific user
        const unreadCount = await getUnreadNotificationCount(userRegisteredDate, currentDateAndTime, domain, userId, websiteTagIds)

        const lastViewedPopupData = await UserHelpReadCount.find({
            user_id: userId,
            display_as_popup: true,
            domain: domain
        })
        delete query.display_as_notification
        query.display_as_popup = true
        if (lastViewedPopupData.length > 0) {
            const readIds = _.map(lastViewedPopupData, 'help_id')
            query._id = { $nin: readIds }
        }

        const popupInfluencerHelp = await InfluencerHelp.findOne(query).sort({ publish_date: 1 })

        const prefixUrl = awsSettings.cloud_front_url === true ? awsSettings.cloud_front_url : awsSettings.aws_url

        if (popupInfluencerHelp !== null) {
            if (!_.isEmpty(popupInfluencerHelp.video_url)) {
                popupInfluencerHelp.video_url = `${prefixUrl}/${popupInfluencerHelp.video_url}`
            }
            if (!_.isEmpty(popupInfluencerHelp.pdf_url)) {
                popupInfluencerHelp.pdf_url = `${prefixUrl}/${popupInfluencerHelp.pdf_url}`
            }
        }

        const response = {
            popup: popupInfluencerHelp,
            unread_count: unreadCount
        }
        return successResponse(res, response, 'help popup get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

/**
 * get tag ids
 *
 * @param {Array} tag tag
 * @returns {Array} tagIds
 */
async function getWebsiteTags(tag) {
    let websiteHelpIds = []
    const websiteTag = tag.length === 1 && tag.includes('') ? [] : tag
    if (websiteTag.length > 0) {
        const websiteHelpData = await HelpTags.find({ type: 'for_website', _id: { $in: websiteTag } })
        websiteHelpIds = _.map(websiteHelpData, '_id')
    }
    return websiteHelpIds
}

/**
 * get notification unread count
 *
 * @param {string} userRegisteredDate userRegisteredDate
 * @param {string} currentDateAndTime currentDateAndTime
 * @param {string} domain domain
 * @param {string} userId userId
 * @param {Array} tagIds tagIds
 * @returns {number} count
 */
async function getUnreadNotificationCount(userRegisteredDate, currentDateAndTime, domain, userId, tagIds) {
    // TODO: Improve fetching the unread notification count
    const query = {
        is_active: true,
        publish_date: { $gt: userRegisteredDate, $lte: currentDateAndTime },
        display_as_notification: true,
        for_admin: true,
        '$or': [
            {
                'visible_to_tags': {
                    '$in': tagIds
                }
            }, {
                'is_visible_to_all_websites': true
            }
        ],
        notification_expiration_date: { $gte: currentDateAndTime }
    }

    const influencerHelpData = await InfluencerHelp.find(query, { _id: 1 })
    let influencerHelpIds = []
    for (let index = 0; index < influencerHelpData.length; index++) {
        const element = influencerHelpData[index]
        const influencerHelpId = element._id.toString()
        influencerHelpIds.push(influencerHelpId)
    }
    const readCount = await UserHelpReadCount.countDocuments({ domain: domain, user_id: userId, help_id: { $in: influencerHelpIds } })
    const count = influencerHelpData.length - readCount
    return count
}

router.post('/read', async (req, res) => {
    const token = _.get(req, 'body.token', '')
    const userId = _.get(req, 'body.userId', '')
    const helpId = _.get(req, 'body.helpId', '')
    const websiteDomain = _.get(req, 'body.domain', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const url = websiteDomain !== '' ? domain.hostname : ''
    const userRegisteredDate = _.get(req, 'body.userRegisteredDate', '')
    try {
        const popupInfluencerHelp = await InfluencerHelp.findOne({ _id: helpId })

        if (token !== API_STATIC_AUTH_TOKEN || userId === '' || url === '' || popupInfluencerHelp === null) {
            return errorResponse(res, 'error', 'Invalid Request', 500)
        }

        const checkExistingRecord = await UserHelpReadCount.countDocuments({
            domain: domain,
            user_id: userId,
            help_id: popupInfluencerHelp._id
        })

        if (checkExistingRecord === 0) {
            const object = {
                domain: domain,
                help_id: popupInfluencerHelp._id,
                user_id: userId,
                publish_date: popupInfluencerHelp.publish_date,
                display_as_popup: popupInfluencerHelp.display_as_popup,
                display_as_notification: popupInfluencerHelp.display_as_notification,
                created_at: new Date()
            }
            const displayAsNotification = _.get(popupInfluencerHelp, 'display_as_notification', false)
            if (displayAsNotification) {
                object['notification_expiration_date'] = popupInfluencerHelp.notification_expiration_date
            }
            let newData = new UserHelpReadCount(object)
            await newData.save()
        }
        let currentDateAndTime = moment()
        currentDateAndTime = new Date(currentDateAndTime)
        const website = await Website.findOne({ website_url: url }, 'tag')
        const websiteTags = _.get(website, 'tag', [])
        const websiteTagIds = await getWebsiteTags(websiteTags)
        const unreadCount = await getUnreadNotificationCount(userRegisteredDate, currentDateAndTime, domain, userId, websiteTagIds)
        return successResponse(res, { unreadCount: unreadCount }, 'help read successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.post('/list', async (req, res) => {
    const token = _.get(req, 'body.token', '')
    const pageNum = _.get(req, 'body.pageNum', '')
    const tagIds = _.get(req, 'body.tagIds', [])
    const websiteDomain = _.get(req, 'body.domain', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const url = websiteDomain !== '' ? domain.hostname : ''
    const website = await Website.findOne({ website_url: url }, 'tag')

    if (token !== API_STATIC_AUTH_TOKEN || pageNum === '' || website === null) {
        return errorResponse(res, 'error', 'Invalid Request', 500)
    }

    const websiteTags = _.get(website, 'tag', [])
    const websiteTagIds = await getWebsiteTags(websiteTags)

    let currentDateAndTime = moment()
    currentDateAndTime = new Date(currentDateAndTime)
    const query = {
        is_active: true,
        publish_date: { $lte: currentDateAndTime },
        exclude_from_help: false,
        for_admin: true,
        '$or': [
            {
                'visible_to_tags': {
                    '$in': websiteTagIds
                }
            }, {
                'is_visible_to_all_websites': true
            }
        ]
    }

    if (tagIds.length > 0) {
        if (tagIds.length === 1) {
            query.tags = tagIds
        } else {
            query.tags = { $in: tagIds }
        }
    }

    const totalRows = await InfluencerHelp.countDocuments(query)

    let limit = 30
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (pageNum - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await InfluencerHelp.find(query, 'title publish_date')
            .skip(offset).limit(limit).sort({ publish_date: -1, _id: -1 })
    }

    const object = {
        data: rows,
        totalPages: totalPages,
        currentPage: Number(pageNum),
        totalRows: totalRows,
        limit: limit
    }

    let helpTagsData = []

    if (Number(pageNum) === 1) {
        helpTagsData = await HelpTags.find({ type: 'for_help' }, 'title')
        object.helpTagsData = helpTagsData
    }
    return successResponse(res, object, 'help popup get successfully', 200)
})

router.post('/details', async (req, res) => {
    const token = _.get(req, 'body.token', '')
    const helpId = _.get(req, 'body.helpId', '')

    if (token !== API_STATIC_AUTH_TOKEN || helpId === '') {
        return errorResponse(res, 'error', 'Invalid Request', 500)
    }

    const awsSettings = await AwsSettings.findOne({}, 'aws_url is_cloud_front_enable cloud_front_url')
    const helpDetail = await InfluencerHelp.findOne({ _id: helpId })

    const prefixUrl = awsSettings.cloud_front_url === true ? awsSettings.cloud_front_url : awsSettings.aws_url

    if (helpDetail !== null) {
        if (!_.isEmpty(helpDetail.video_url)) {
            helpDetail.video_url = `${prefixUrl}/${helpDetail.video_url}`
        }
        if (!_.isEmpty(helpDetail.pdf_url)) {
            helpDetail.pdf_url = `${prefixUrl}/${helpDetail.pdf_url}`
        }
    }

    const response = {
        helpDetail: helpDetail
    }
    return successResponse(res, response, 'help popup get successfully', 200)
})

router.post('/list/notification', async (req, res) => {
    const token = _.get(req, 'body.token', '')
    const userRegisteredDate = _.get(req, 'body.userRegisteredDate', '')
    const userId = _.get(req, 'body.userId', '')
    const pageNum = _.get(req, 'body.pageNum', '')
    const type = _.get(req, 'body.type', 'all')
    const onLoadApiCall = _.get(req, 'body.onLoadApiCall', false)
    const websiteDomain = _.get(req, 'body.domain', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const url = websiteDomain !== '' ? domain.hostname : ''
    const website = await Website.findOne({ website_url: url }, 'tag')
    const websiteTags = _.get(website, 'tag', [])
    const websiteTagIds = await getWebsiteTags(websiteTags)

    if (token !== API_STATIC_AUTH_TOKEN || pageNum === '' || domain === '' || website === null) {
        return errorResponse(res, 'error', 'Invalid Request', 500)
    }

    let currentDateAndTime = moment()
    currentDateAndTime = new Date(currentDateAndTime)
    const query = {
        is_active: true,
        publish_date: { $gt: userRegisteredDate, $lte: currentDateAndTime },
        display_as_notification: true,
        for_admin: true,
        '$or': [
            {
                'visible_to_tags': {
                    '$in': websiteTagIds
                }
            }, {
                'is_visible_to_all_websites': true
            }
        ],
        notification_expiration_date: { $gte: currentDateAndTime }
    }

    try {
        let isChangeUnreadToAll = false
        if (type === 'unread') {
            if (onLoadApiCall === true) {
                const unreadCount = await getUnreadNotificationCount(userRegisteredDate, currentDateAndTime, domain, userId, websiteTagIds)
                if (unreadCount > 0) {
                    const viewedRecords = await UserHelpReadCount.find({
                        user_id: userId,
                        display_as_notification: true,
                        domain: domain
                    }, 'help_id').sort({ publish_date: -1, _id: -1 })
                    const readIds = _.map(viewedRecords, 'help_id')
                    query._id = { $nin: readIds }
                } else {
                    isChangeUnreadToAll = true
                }
            } else {
                const viewedRecords = await UserHelpReadCount.find({
                    user_id: userId,
                    display_as_notification: true,
                    domain: domain
                }, 'help_id').sort({ publish_date: -1 })
                const readIds = _.map(viewedRecords, 'help_id')
                query._id = { $nin: readIds }
            }
        }

        const totalRows = await InfluencerHelp.countDocuments(query)

        let limit = 30
        let totalPages = Math.ceil(totalRows / limit)

        let offset = (pageNum - 1) * limit
        let rows = []
        let notificationRows = []
        if (totalRows > 0) {
            rows = await InfluencerHelp.find(query, 'title publish_date')
                .skip(offset).limit(limit).sort({ publish_date: -1 })

            for (let i = 0; i < rows.length; i++) {
                const element = rows[i]
                const query = {
                    user_id: userId,
                    display_as_notification: true,
                    domain: domain,
                    help_id: element._id
                }
                const checkDetail = await UserHelpReadCount.countDocuments(query)
                const object = {
                    _id: element._id,
                    title: element.title,
                    publish_date: element.publish_date,
                    isReadNotification: (checkDetail === 0) ? false : true
                }
                notificationRows.push(object)
            }
        }

        const object = {
            data: notificationRows,
            totalPages: totalPages,
            currentPage: Number(pageNum),
            totalRows: totalRows,
            limit: limit,
            isChangeUnreadToAll: isChangeUnreadToAll
        }
        return successResponse(res, object, 'get help notification list successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }

})

/**
 * convert date to tz format.
 *
 * @param {string} date date
 * @returns {string} tz format date
 */
async function getTzFormatOfDate(date) {
    return (date.includes('Z') || date.includes('z')) ? date : date + 'Z'
}

module.exports = router
