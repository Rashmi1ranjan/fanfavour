const express = require('express')
const router = express.Router()
const Website = require('../models/Website')
const { successResponse } = require('../utils')

router.post('/', async (req, res) => {
    try {
        const domain = req.body.domain
        let websitesData = await Website.findOne({
            status: { $in: ['live', 'published'] }, website_url: domain
        })

        let isActiveWebsite = false
        if (websitesData !== null) {
            isActiveWebsite = true
        }

        return successResponse(res, isActiveWebsite, 'get website status successfully', 200)
    } catch (error) {
        console.log('Error while site is active or not:', error)
    }
})

module.exports = router