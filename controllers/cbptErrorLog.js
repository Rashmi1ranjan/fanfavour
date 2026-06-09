const express = require("express")
const router = express.Router()
const _ = require('lodash')
const CBPTErrorLog = require('./../models/CBPTErrorLog')

router.get('/get_pending_items', async (req, res) => {
    const limit = parseInt(req.query.items, 10)
    const domain = req.query.domain

    const CbptErrorLogs = await CBPTErrorLog.find({
        domain: domain,
        is_processed: false
    }).limit(limit)

    return res.send({
        data: CbptErrorLogs
    })
})

router.post('/update_processing_status', async (req, res) => {
    const id = req.body.id
    const response = req.body.XMLResponse
    const failureReason = req.body.failure_reason
    const status = req.body.status

    const cbptErrorLog = await CBPTErrorLog.findByIdAndUpdate(
        { _id: id },
        {
            is_processed: true,
            response: response,
            failure_reason: failureReason,
            status: status,
            updated_at: new Date()
        }
    )

    const totalRemainingItems = await CBPTErrorLog.countDocuments({ domain: cbptErrorLog.domain, status: { $ne: 'tip' }, is_processed: false })
    return res.send({ updated: true, message: 'Updated record successfully', totalRemainingItems: totalRemainingItems })
})

module.exports = router
