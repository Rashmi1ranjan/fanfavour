const express = require('express')
const router = express.Router()
const _ = require('lodash')
const { protectAdminRoute } = require('./../middleware/auth.middleware')
const { errorResponse, successResponse } = require('../utils')
const FanFavourModel = require('../models/FanFavourModel')
const mongoose = require('mongoose')
const { generateSignedUrl } = require('../utils/fileUpload')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const FeaturedModelText = require('../models/FeaturedModelText')

router.post('/add-model', protectAdminRoute, async (req, res) => {
    try {
        const data = req.body
        const website_url = _.get(data, 'website_url.value', '').trim().toLowerCase()
        const model_name = _.get(data, 'model_name', '').trim()
        const likes = _.get(data, 'likes', 0)
        const display_order = _.get(data, 'display_order', 0)
        const image = _.get(data, 'image', '').trim()
        const is_featured_model = _.get(data, 'is_featured_model', false)
        const featured_model_display_order = _.get(data, 'featured_model_display_order', 0)

        if (!website_url) return errorResponse(res, {}, 'Please add website url')
        if (!model_name) return errorResponse(res, {}, 'Please enter valid model name')
        if (display_order === 0) return errorResponse(res, {}, 'Please enter valid display order')
        if (!image) return errorResponse(res, {}, 'Please upload image')

        const existingWebsite = await FanFavourModel.findOne({ website_url })
        if (existingWebsite) {
            return errorResponse(res, {}, 'This website_url already exists. Please choose a different one.')
        }

        await FanFavourModel.updateMany(
            { display_order: { $gte: display_order } },
            { $inc: { display_order: 1 } }
        )

        if (is_featured_model) {
            if (featured_model_display_order === 0) {
                return errorResponse(res, {}, 'Please enter valid featured model display order')
            }

            await FanFavourModel.updateMany(
                {
                    is_featured_model: true,
                    featured_model_display_order: { $gte: featured_model_display_order }
                },
                { $inc: { featured_model_display_order: 1 } }
            )
        }

        // Create model
        const modelData = new FanFavourModel({
            website_url,
            model_name,
            likes,
            display_order,
            image,
            is_featured_model,
            featured_model_display_order
        })

        await modelData.save()

        return successResponse(res, {}, 'Model information added successfully', 200)

    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'There was a problem in adding website data.', 500)
    }
})

router.post('/edit-model', protectAdminRoute, async (req, res) => {
    try {
        const data = req.body.data
        const previousData = req.body.previousData
        const _id = _.get(data, '_id', '')
        delete data._id

        const model_name = _.get(data, 'model_name', '').trim()
        const likes = _.get(data, 'likes', 0)
        const display_order = _.get(data, 'display_order', 0)
        const image = _.get(data, 'image', '').trim()
        const is_featured_model = _.get(data, 'is_featured_model', false)
        const featured_model_display_order = _.get(data, 'featured_model_display_order', 0)

        if (!model_name) return errorResponse(res, {}, 'Please enter valid model name')
        if (display_order === 0) return errorResponse(res, {}, 'Please enter valid display order')
        if (!image) return errorResponse(res, {}, 'Please upload image')

        // ---- Handle display_order reordering ----
        if (display_order !== previousData.display_order) {
            if (display_order < previousData.display_order) {
                // Moving up → push others down
                await FanFavourModel.updateMany(
                    {
                        _id: { $ne: _id },
                        display_order: { $gte: display_order, $lt: previousData.display_order }
                    },
                    { $inc: { display_order: 1 } }
                )
            } else {
                // Moving down → pull others up
                await FanFavourModel.updateMany(
                    {
                        _id: { $ne: _id },
                        display_order: { $gt: previousData.display_order, $lte: display_order }
                    },
                    { $inc: { display_order: -1 } }
                )
            }
        }

        // ---- Handle featured_model_display_order reordering ----
        if (is_featured_model && featured_model_display_order !== previousData.featured_model_display_order) {
            if (featured_model_display_order === 0) {
                return errorResponse(res, {}, 'Please enter valid featured model display order')
            }

            if (featured_model_display_order < previousData.featured_model_display_order) {
                // Moving up
                await FanFavourModel.updateMany(
                    {
                        _id: { $ne: _id },
                        is_featured_model: true,
                        featured_model_display_order: { $gte: featured_model_display_order, $lt: previousData.featured_model_display_order }
                    },
                    { $inc: { featured_model_display_order: 1 } }
                )
            } else {
                // Moving down
                await FanFavourModel.updateMany(
                    {
                        _id: { $ne: _id },
                        is_featured_model: true,
                        featured_model_display_order: { $gt: previousData.featured_model_display_order, $lte: featured_model_display_order }
                    },
                    { $inc: { featured_model_display_order: -1 } }
                )
            }
        }

        // ---- Update model ----
        const obj = {
            model_name,
            likes,
            display_order,
            image,
            is_featured_model,
            featured_model_display_order
        }

        await FanFavourModel.findByIdAndUpdate(_id, { $set: obj })

        return successResponse(res, {}, 'Model information updated successfully', 200)

    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'There was a problem in editing model data.', 500)
    }
})


router.post('/get_model_list', protectAdminRoute, async (req, res) => {
    try {

        const totalRows = await FanFavourModel.countDocuments()
        let limit = 20
        let totalPages = Math.ceil(totalRows / limit)
        let currentPage = parseInt(req.query.page_num, 10)
        let offset = (currentPage - 1) * limit
        let rows = []

        const website_url = _.get(req.body, 'website_url', '').trim()

        let query = {}
        if (website_url !== '') {
            query.website_url = website_url
        }

        if (totalRows > 0) {
            rows = await FanFavourModel.find(query).sort({ display_order: 1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Model data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.get('/get_model_data_by_id', protectAdminRoute, async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId(req.query._id)
        const data = await FanFavourModel.findById(id)
        const plain = data.toObject()
        if (plain.image !== '') {
            const getSignedUrl = await generateSignedUrl(data.image)
            plain.previewUrl = getSignedUrl
        }
        return successResponse(res, plain, 'Model data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.get('/model_list', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        const totalRows = await FanFavourModel.countDocuments()
        let limit = 12
        let totalPages = Math.ceil(totalRows / limit)
        let currentPage = parseInt(req.query.page, 10)
        let offset = (currentPage - 1) * limit
        let rows = []

        if (totalRows > 0) {
            rows = await FanFavourModel.find({ is_featured_model: { $ne: true } }, 'website_url display_order image is_featured_model likes model_name').sort({ display_order: 1 }).skip(offset).limit(limit)
        }

        for (const row of rows) {
            const signedUrl = await generateSignedUrl(row.image)
            row.image = signedUrl
        }

        const data = {
            rows: rows,
            totalPages: totalPages,
            currentPage: currentPage,
            totalRows: totalRows,
            limit: limit
        }
        return successResponse(res, data, 'Model data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.get('/model_details', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        const website_url = _.get(req.query, 'domain', '').trim().toLowerCase()
        if (!website_url) {
            return errorResponse(res, {}, 'Domain is required', 400)
        }

        const model = await FanFavourModel.findOne(
            { website_url },
            'website_url display_order image is_featured_model likes model_name'
        )

        if (!model) {
            return errorResponse(res, {}, 'Model not found', 404)
        }

        const plainModel = model.toObject()

        if (plainModel.image) {
            plainModel.image = generateSignedUrl(plainModel.image)
        }

        return successResponse(res, plainModel, 'Model data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch model data.', 500)
    }
})

router.get('/get_featured_model', async (req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
        }

        let data = await FanFavourModel.find({ is_featured_model: true }, 'website_url display_order image is_featured_model likes model_name').sort({ featured_model_display_order: 1 })
        const featuredModelText = await FeaturedModelText.findOne({}, 'featured_model_text')
        for (const row of data) {
            const signedUrl = await generateSignedUrl(row.image)
            row.image = signedUrl
        }

        let text = featuredModelText.featured_model_text

        return successResponse(res, {data, text}, 'Model data get successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetch website data.', 500)
    }
})

router.get('/get_featured_model_text', protectAdminRoute, async (req, res) => {
    try {
        let data = await FeaturedModelText.findOne()

        if (_.isEmpty(data)) {
            await FeaturedModelText.create({ featured_model_text: '🔥 Hot' })
        }
        const featuredModelText = _.isEmpty(data) ? '🔥 Hot' : data.featured_model_text
        const featuredModelData = {
            featured_model_text: featuredModelText
        }
        return successResponse(res, featuredModelData, 'Featured model text fetched successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in fetching featured model text.', 500)
    }
})

router.post('/save_featured_model_text', protectAdminRoute, async (req, res) => {
    try {
        const body = req.body

        if (_.isEmpty(body.featured_model_text)) {
            return errorResponse(res, {}, 'Featured Model Text can not be empty', 400)
        }

        await FeaturedModelText.updateOne({}, { featured_model_text: body.featured_model_text.trim() })

        return successResponse(res, { featured_model_text: body.featured_model_text.trim() }, 'Saved successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in saving data.', 500)
    }
})

router.post('/remove_model_by_id', protectAdminRoute, async (req, res) => {
    try {
        const modelId = req.body.modelId
        if (!modelId) {
            return errorResponse(res, {}, 'Model ID is required', 400)
        }

        const model = await FanFavourModel.findById(modelId)
        if (!model) {
            return errorResponse(res, {}, 'Model not found', 404)
        }

        await FanFavourModel.deleteOne({ _id: modelId })
        return successResponse(res, {}, 'Model removed successfully', 200)
    } catch (error) {
        console.error(error)
        return errorResponse(res, error, 'There was a problem in removing the model.', 500)
    }
})

router.get('/get_selected_model', async (req, res) => {
    try {
        const modelId = req.query.id
        if (!modelId) {
            return errorResponse(res, {}, 'Model ID is required', 400)
        }

        const model = await FanFavourModel.findById(modelId)
        if (!model) {
            return errorResponse(res, {}, 'Model not found', 404)
        }

        console.log(model)
        return successResponse(res, model, 'Model removed successfully', 200)
    } catch (error) {
        return errorResponse(res, error, 'There was a problem in removing the model.', 500)
    }
})

module.exports = router
