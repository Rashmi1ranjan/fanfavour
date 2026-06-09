const express = require('express')
const router = express.Router()
const { successResponse } = require('../utils')
const ModelUnreadCountReports = require('../models/ModelUnreadCountReports')

router.post('/model_unread_counts', async (req, res) => {
    const unreadCountData = req.body

    await ModelUnreadCountReports.deleteMany({ domain: unreadCountData.domain })
    const unreadCount = new ModelUnreadCountReports(unreadCountData)
    await unreadCount.save()

    return successResponse(res, {}, 'Data saved')
})

module.exports = router
