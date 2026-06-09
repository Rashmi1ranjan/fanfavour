const express = require('express')
const router = express.Router()
const Website = require('../models/Website')
const { successResponse } = require('../utils')

router.get('/get-stopped-website-list', async (req, res) => {
    try {
        const website = await Website.find({ status: 'removed' }, 'website_url')
        return successResponse(res, website, 'website list get success', 200)
    } catch (error) {
        console.log(error)
    }
})

module.exports = router
