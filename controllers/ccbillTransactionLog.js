const express = require('express')
const router = express.Router()
const _ = require('lodash')
const asyncHandler = require('express-async-handler')
const { API_AUTH_TOKEN } = require('./../utils/index')
const CCBillTransactionLog = require('../models/CCBillTransactionLog')

/**
 * @description API to get ccbill transaction information from website
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/save', asyncHandler(async (req, res) => {
    const { error, isValid } = validateCCBillTransactionInfo(req.body)
    if (!isValid) {
        return res.send({ error: error })
    }
    try {
        const ccbillLogData = {
            domain: req.body.domain,
            card_last_four_digits: req.body.card_last_four_digits,
            card_id: req.body.card_id,
            name_on_card: req.body.name_on_card,
            expire_month: req.body.expire_month,
            expire_year: req.body.expire_year,
            address: req.body.address,
            user_id: req.body.user_id,
            ip: req.body.ip,
            api_response: req.body.api_response
        }

        const ccbillTransactionLog = new CCBillTransactionLog(ccbillLogData)
        const saveTransactionLog = await ccbillTransactionLog.save()
        if (saveTransactionLog === null) {
            res.send({ error: 'Error! Data not saved' })
        }
        res.send({ success: 'Transaction response successfully saved' })
    } catch (error) {
        console.log(error)
        res.send({ error: 'Something want wrong try again' })
    }
}))

/**
 * @description validate CCBillTransactionInfo
 * @param {object} param request param object
 * @returns {object} error and isValid
 */
function validateCCBillTransactionInfo(param) {
    // token validation
    if (_.isEmpty(param.token) || param.token !== API_AUTH_TOKEN) {
        return { isValid: false, error: 'You are not authorized' }
    }

    let error = ''
    // request param validation
    if (_.isEmpty(param.domain)) {
        error += _.isEmpty(error) ? 'domain' : ', domain'
    }
    if (_.isEmpty(param.card_last_four_digits)) {
        error += _.isEmpty(error) ? 'card_last_four_digits' : ', card_last_four_digits'
    }
    if (_.isEmpty(param.card_id)) {
        error += _.isEmpty(error) ? 'card_id' : ', card_id'
    }
    if (_.isEmpty(param.name_on_card)) {
        error += _.isEmpty(error) ? 'name_on_card' : ', name_on_card'
    }
    if (_.isEmpty(param.expire_month)) {
        error += _.isEmpty(error) ? 'expire_month' : ', expire_month'
    }
    if (_.isEmpty(param.expire_year)) {
        error += _.isEmpty(error) ? 'expire_year' : ', expire_year'
    }
    if (_.isEmpty(param.address)) {
        error += _.isEmpty(error) ? 'address' : ', address'
    }
    if (_.isEmpty(param.user_id)) {
        error += _.isEmpty(error) ? 'user_id' : ', user_id'
    }
    if (_.isEmpty(param.ip)) {
        error += _.isEmpty(error) ? 'ip' : ', ip'
    }
    if (_.isEmpty(param.api_response)) {
        error += _.isEmpty(error) ? 'api_response' : ', api_response'
    }
    error += _.isEmpty(error) ? '' : ' Field(s) should not be empty'
    return { error, isValid: _.isEmpty(error) }
}

module.exports = router
