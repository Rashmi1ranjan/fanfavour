const express = require('express')
const router = express.Router()
const HelpTags = require('../models/HelpTags')
const { SUPER_ADMIN, protectRouteWithRole } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const mongoose = require('mongoose')
const _ = require('lodash')

router.post('/get/tagList', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let currentPage = parseInt(req.query.page_num, 10)
    const tagType = _.get(req, 'body.tagType', '')
    const query = {}
    if (tagType !== '') {
        query.type = tagType
    }

    const totalRows = await HelpTags.countDocuments(query)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []
    if (totalRows > 0) {
        rows = await HelpTags.find(query)
            .skip(offset).limit(limit).sort({ _id: -1 })
    }

    return successResponse(res, {
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    }, 'help tag get successfully', 200)
})

router.get('/get/allTagList', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const rows = await HelpTags.find({ type: 'for_help' })

    return successResponse(res, {
        rows: rows
    }, 'help tag get successfully', 200)
})

router.get('/get/specificWebsiteTagList', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const rows = await HelpTags.find({ type: 'for_website' })

    return successResponse(res, {
        rows: rows
    }, 'help tag get successfully', 200)
})

router.post('/tag/save', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', '')
    const title = _.get(data, 'title', '')
    const type = _.get(data, 'type', '')

    if (_.isEmpty(title.trim())) {
        return errorResponse(res, 'error', 'Format error', 500)
    }

    if (!['for_website', 'for_help'].includes(type)) {
        return errorResponse(res, 'error', 'type is not match', 500)
    }

    const findData = await HelpTags.findOne({ title: title.trim() })
    if ((findData !== null && _id === '') || (findData !== null && findData.title !== title && _id !== '')) {
        return errorResponse(res, 'error', 'Tag is Already Exists', 500)
    }
    if (_id === '') {
        const influencerData = {
            title: title.trim(),
            type: type
        }
        let helpTagsData = new HelpTags(influencerData)

        await helpTagsData.save()
        return successResponse(res, {}, 'help tag Save successfully', 200)
    }
    const newValues = {
        title: title.trim(),
        type: type
    }

    const query = { _id: _id }
    try {
        await HelpTags.updateOne(query, {
            $set: newValues
        })

        return successResponse(res, {}, 'help tag Save successfully', 200)
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
})

router.get('/get/tag/id', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)
    let data = await HelpTags.findById(id)
    return successResponse(res, data, 'help tag get successfully', 200)
})

router.post('/tag/delete', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {
    let id = _.get(req, 'body._id', '')
    if (_.isEmpty(id)) {
        return errorResponse(res, 'error', 'Invalid Id', 500)
    }

    try {
        await HelpTags.deleteOne({ _id: id })
    } catch (error) {
        return errorResponse(res, error, error.message, 500)
    }
    return successResponse(res, {}, 'help tag delete successfully', 200)
})

module.exports = router
