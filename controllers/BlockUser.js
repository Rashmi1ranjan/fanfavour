const express = require('express')
const router = express.Router()
const BlockedUsers = require('../models/BlockedUsers')
const Website = require('../models/Website')
const WebsiteBlockedUsers = require('../models/WebsiteBlockedUsers')
const { protectAdminRoute } = require('./../middleware/auth.middleware')
const mongoose = require('mongoose')
const _ = require('lodash')
const axios = require('axios')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { errorResponseWithHTTPStatus, successResponse } = require('../utils/index')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } = require('../utils/http.status')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

router.post('/block_user', protectAdminRoute, async (req, res) => {
    try {
        const data = req.body
        delete data._id
        let query = {
            field: data.field
        }
        if (data.domain_id !== 0) {
            query.domain_id = { $in: [data.domain_id, 0] }
        } else {
            query.domain_id = 0
        }

        let row = await BlockedUsers.findOne(query)
        if (row !== null) {
            return errorResponseWithHTTPStatus(res, {}, 'You can not add duplicate record', HTTP_BAD_REQUEST_400)
        }

        // Block user in site for now stopped
        // data.status = 'pending'

        data.status = 'processed'
        let blockUser = new BlockedUsers(data)
        const blockedUserData = await blockUser.save()
        // For now not block user in website.
        // blockUserInWebsite(blockedUserData)

        return successResponse(res, {}, 'block data added successfully', 200)
    } catch (error) {
        return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/get_block_user_list', protectAdminRoute, async (req, res) => {

    const domainFilter = _.get(req, 'body.filter.domain', [])
    const sourceDomainFilter = _.get(req, 'body.filter.source_domain', [])
    const email = _.get(req, 'body.filter.email', '')
    const card = _.get(req, 'body.filter.card', '')
    const type = _.get(req, 'body.filter.type', 'all')
    const query = {}

    let fieldFilterArray = []
    if (email !== '') {
        fieldFilterArray.push(email)
    }
    if (card !== '') {
        fieldFilterArray.push(card)
    }
    if (fieldFilterArray.length > 0) {
        query.field = { $in: fieldFilterArray }
    }
    if (domainFilter.length > 0) {
        const domains = domainFilter.map(domain => domain.value)
        query.domain_id = { $in: domains }
    }
    if (sourceDomainFilter.length > 0) {
        const domains = sourceDomainFilter.map(domain => domain.value)
        query.source_domain = { $in: domains }
    }
    if (type !== 'all') {
        if (type === 'email') {
            query.type = 0
        } else if (type === 'card') {
            query.type = 1
        } else {
            query.type = 2
        }
    }

    const sort = req.body.sort_by
    const key = sort.key
    const sortBy = { [key]: sort.direction }
    const totalRows = await BlockedUsers.countDocuments(query)
    let currentPage = parseInt(req.body.page_num, 10)
    let limit = 20
    let totalPages = Math.ceil(totalRows / limit)

    let offset = (currentPage - 1) * limit
    let rows = []

    if (totalRows > 0) {
        rows = await BlockedUsers.find(query).skip(offset).limit(limit).sort(sortBy)
    }
    return res.send({
        rows: rows,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit
    })
})

router.put('/block_user', protectAdminRoute, async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', '')
    const domain_id = _.get(data, 'domain_id', -1)

    if (domain_id === -1) {
        return res.send({ status: false, message: 'Invalid domain.' })
    }
    let row = await BlockedUsers.findById(_id)

    if (row !== null && row._id.toString() !== _id) {
        return res.send({ status: false, message: 'You can not add duplicate record' })
    }

    const newValues = {
        $set: {
            domain_id: domain_id,
            updated_at: new Date()
        }
    }

    const query = { _id: _id }

    try {
        await BlockedUsers.updateOne(query, newValues)
        // For now not block user in website.
        // const blockData = await BlockedUsers.findById(_id)
        // blockUserInWebsite(blockData)
        return res.send({ status: true })
    } catch (error) {
        return res.send({ status: false, message: error.message })
    }
})


router.get('/block_user_by_id', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query._id)

    let data = await BlockedUsers.find({ _id: id })

    return res.send({
        rows: data
    })
})

router.get('/blocked_users_list', protectAdminRoute, async (req, res) => {
    let id = new mongoose.Types.ObjectId(req.query.id)
    const query = {
        block_user_id: id
    }
    let rows = await WebsiteBlockedUsers.find(query).sort({ 'created_at': 'desc' })
    return res.send({
        rows: rows
    })
})

router.post('/check_user_block', async (req, res) => {
    let field = _.get(req, 'body.fieldValue', '')
    if (field === '') return res.send({ status: false, message: 'Invalid field.' })
    const domain = _.get(req, 'body.domain', '')
    if (domain === '') return res.send({ status: false, message: 'Invalid domain.' })
    const requestFrom = _.get(req, 'body.requestFrom', '')
    try {
        const website = await Website.findOne({ website_url: domain }, 'website_id')
        if (website === null) {
            return res.send(false)
        }

        if (requestFrom === 'name') {
            field = { $regex: `^${field}$`, $options: 'i' }
        }

        const query = {
            field: field,
            domain_id: { $in: [0, website.website_id] }
        }

        let rows = await BlockedUsers.findOne(query, '_id')
        if (rows === null) {
            return res.send(false)
        }
        await BlockedUsers.updateOne({ _id: rows._id }, {
            $inc: {
                times_blocked: 1
            }
        })
        return res.send(true)
    } catch (err) {
        return res.send(false)
    }
})

router.post('/block_user_by_website', async (req, res) => {
    const requestBody = req.body
    const email = requestBody.email
    const domain = requestBody.domain
    const cards = requestBody.cards
    let count = 0
    try {
        const website = await Website.findOne({ website_url: domain }, 'website_id')
        if (website === null) {
            const resData = {
                count: count
            }
            return res.send(resData)
        }
        const emailBlockData = {
            domain_id: website.website_id,
            type: 0,
            field: email,
            block_code_id: '-1',
            status: 'processed'
        }
        let query = {
            field: emailBlockData.field
        }
        if (emailBlockData.domain_id !== 0) {
            query.domain_id = { $in: [emailBlockData.domain_id, 0] }
        } else {
            query.domain_id = 0
        }

        let row = await BlockedUsers.findOne(query)
        if (row === null) {
            const blockData = new BlockedUsers(emailBlockData)
            await blockData.save()
            count++
        }

        for (let index = 0; index < cards.length; index++) {
            const card = cards[index]
            const cardBlockData = {
                domain_id: website.website_id,
                type: 1,
                field: card.card_id,
                block_code_id: '-1',
                status: 'processed'
            }
            let query = {
                field: cardBlockData.field
            }
            if (cardBlockData.domain_id !== 0) {
                query.domain_id = { $in: [cardBlockData.domain_id, 0] }
            } else {
                query.domain_id = 0
            }

            let row = await BlockedUsers.findOne(query)
            if (row === null) {
                const blockData = new BlockedUsers(cardBlockData)
                await blockData.save()
                count++
            }
        }
        const resData = {
            count
        }
        return res.send(resData)
    } catch (err) {
        console.log(err)
        const resData = {
            count
        }
        return res.send(resData)
    }
})

async function blockUserInWebsite(blockData) {
    let websiteWhere = {
        $or: [
            { status: 'live' },
            { status: 'published' }
        ]
    }
    const project = { website_url: 1, website_id: 1 }
    if (blockData.domain_id !== 0) {
        websiteWhere.website_id = blockData.domain_id
    }
    const totalWebsite = await Website.find(websiteWhere, project)
    for (let index = 0; index < totalWebsite.length; index++) {
        const website_url = totalWebsite[index].website_url
        const website_id = totalWebsite[index].website_id
        const api_url = getWebsiteDomain(website_url)
        const data = {
            type: blockData.type,
            field: blockData.field,
            token: API_STATIC_AUTH_TOKEN
        }
        try {
            const blockUserUrl = `${api_url}/api/block_user_by_services`
            const res = await axios.post(blockUserUrl, data)
            const BlockedUserList = _.get(res, 'data.data', [])
            if (BlockedUserList.length > 0) {
                for (let index = 0; index < BlockedUserList.length; index++) {
                    const blockedUser = BlockedUserList[index]
                    const websiteBlockUser = {
                        domain_id: website_id,
                        blocked_user_details: blockedUser,
                        block_user_id: blockData._id
                    }
                    const blockUser = new WebsiteBlockedUsers(websiteBlockUser)
                    await blockUser.save()
                }
            } else {
                const websiteBlockUser = {
                    domain_id: website_id,
                    blocked_user_details: 'No user found.',
                    block_user_id: blockData._id
                }
                const blockUser = new WebsiteBlockedUsers(websiteBlockUser)
                await blockUser.save()
            }
        } catch (error) {
            const websiteBlockUser = {
                domain_id: website_id,
                blocked_user_details: 'Error in block:' + _.get(error, 'message', ''),
                block_user_id: blockData._id
            }
            const blockUser = new WebsiteBlockedUsers(websiteBlockUser)
            await blockUser.save()
        }
        if (index + 1 === totalWebsite.length) {
            await BlockedUsers.findByIdAndUpdate(blockData._id, { status: 'processed' })
        }
    }
}

module.exports = router
