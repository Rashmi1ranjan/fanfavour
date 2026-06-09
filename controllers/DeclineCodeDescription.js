const express = require('express')
const router = express.Router()
const _ = require('lodash')
const axios = require('axios')
const DeclineCodeDescription = require('../models/DeclineCodeDescription')
const Website = require('../models/Website')
const mongoose = require('mongoose')
const { protectAdminRoute, protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('../middleware/auth.middleware')
const { successResponse, catchResponse, getDatesArray } = require('../utils/index')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

router.post('/add_decline_code_description', protectAdminRoute, async (req, res) => {
    const data = req.body
    delete data._id

    let row = await DeclineCodeDescription.findOne({ decline_code: data.decline_code, payment_gateway: data.payment_gateway })
    if (row !== null) {
        return res.send({ status: false, message: 'Same Record already exist with error code and payment gateway' })
    }

    data['created_at'] = new Date()
    let DeclineCodeDescriptionData = new DeclineCodeDescription(data)

    await DeclineCodeDescriptionData.save()
    return res.send({ status: true })
})

router.post('/edit_decline_code_description', protectAdminRoute, async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', false)
    const decline_code = _.get(data, 'decline_code', false)
    const description = _.get(data, 'description', false)
    const error_message = _.get(data, 'error_message', '')
    const link_to_change_card = _.get(data, 'link_to_change_card', false)
    const link_text = _.get(data, 'link_text', '')
    const payment_gateway = _.get(data, 'payment_gateway', 'ccbill')

    let row = await DeclineCodeDescription.findOne({ decline_code, payment_gateway })

    if (row !== null && row._id.toString() !== _id) {
        return res.send({ status: false, message: 'Same Record already exist with error code and payment gateway' })
    }

    const newValues = {
        $set: {
            decline_code: decline_code,
            description: description,
            error_message: error_message,
            link_to_change_card: link_to_change_card,
            link_text: link_text,
            payment_gateway: payment_gateway,
            updated_at: new Date()
        }
    }

    const query = { _id: _id }

    try {
        await DeclineCodeDescription.updateOne(query, newValues)

        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})

router.get('/get_decline_code_description_list', protectAdminRoute, async (req, res) => {

    const totalRows = await DeclineCodeDescription.countDocuments({})
    let currentPage = parseInt(req.query.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await DeclineCodeDescription.find({}).skip(offset).limit(limit).sort({ 'created_at': 'desc' })
    }

    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.get('/get_decline_code_description_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await DeclineCodeDescription.find({ _id: id })

    return res.send({
        rows: data
    })
})

router.get('/get_all_decline_code_description_options', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {

    let rows = await DeclineCodeDescription.find({}, 'decline_code description').sort({ 'decline_code': 1 })
    return res.send({
        rows: rows
    })
})

router.get('/fetch-all-declined-code', async (req, res) => {
    try {
        const declinedCode = await getAllDeclinedCodeForWebsite()
        return successResponse(res, declinedCode, 'Declined Code List', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in get declined Code List', 200)
    }
})

router.get('/send-all-declined-code-to-website', async (req, res) => {
    try {
        await sendAllDeclinedCodeToWebsite()
        return successResponse(res, {}, 'Declined code successfully sent.', 200)
    } catch (error) {
        return catchResponse(res, {}, 'Error in sending declined code', 200)
    }
})

/**
 * @description Get All Declined code for website
 * @returns {Array} Array of declined codes
 */
async function getAllDeclinedCodeForWebsite() {
    const select = {
        description: 1,
        decline_code: 1,
        error_message: 1,
        link_to_change_card: 1,
        link_text: 1,
        payment_gateway: 1,
        _id: -1
    }
    const declinedCode = await DeclineCodeDescription.find({}, select).sort({ 'created_at': 'desc' })
    return declinedCode
}

/**
 * Send Declined code to all website
 */
async function sendAllDeclinedCodeToWebsite() {
    const declinedCode = await getAllDeclinedCodeForWebsite()
    const websiteQuery = {
        status: { $in: ['published', 'live'] }
    }
    const websites = await Website.find(websiteQuery).sort({ website_id: -1 }).limit(1)
    for (const website of websites) {
        const { website_url } = website
        const host = getWebsiteDomain(website_url)
        const url = `${host}/api/declined-code/cache-declined-code`
        console.log({ url })
        const requestBody = { data: declinedCode }
        axios.post(url, requestBody).then(() => { }).catch((error) => {
            console.log(`error in website: ${website_url}, ${error}`)
            console.log(error)
        })
    }
}

module.exports = router
