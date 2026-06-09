const express = require("express")
const router = express.Router()
const asyncHandler = require('express-async-handler')
var parseString = require('xml2js').parseString;
const rp = require("request-promise")
const moment = require("moment-timezone")
const _ = require('lodash')
const TransactionReports = require('../models/CCBillTransactionReports')

router.post("/", (req, res) => {
    const email = req.body.email.trim()
    const subAccNum = req.body.sub_account_number

    TransactionReports.find({ type: "NEW", email_address: email, client_sub_account: subAccNum }).then(transactionData => {
        if (transactionData.length > 0) {
            const transactionsData = transactionData[0]
            let subscriptionId = transactionsData.subscription_id
            let status = true
            let clientAccnum = transactionsData.client_account_number

            var resData = {
                status,
                subscriptionId,
                clientAccnum
            }
            return res.send(resData)
        } else {
            var resData = {
                status: false
            }
            return res.send(resData)
        }
    })
})

router.post("/get_active_subscription_id", asyncHandler(async (req, res) => {
    const email = req.body.email.trim()
    const subAccountNumber = req.body.sub_account_number

    let transactionData = await TransactionReports.find({ type: "NEW", email_address: email, client_sub_account: subAccountNumber, is_expired_or_void: { $ne: true } })

    if (transactionData.length > 0) {
        let index
        let activeSubscriptionIdArray = []
        let isCCBillError = false

        for (index = 0; index < transactionData.length; index++) {
            const element = transactionData[index];
            let subscriptionId = element.subscription_id
            let clientAccnum = element.client_account_number
            let userName = req.body.user_name
            let password = req.body.password

            let result = await getExpirationDateFromCCBill(subscriptionId, clientAccnum, userName, password, subAccountNumber)

            let subscriptionStatus = _.get(result, 'results.subscriptionStatus[0]', false)
            let expirationDate = _.get(result, 'results.expirationDate[0]', false)
            let nextBillingDate = _.get(result, 'results.nextBillingDate[0]', false)

            let expirationDateStringFromCCbill = _.get(result, 'results.expirationDate[0]', false)
            let nextBillingDateStringFromCCbill = _.get(result, 'results.nextBillingDate[0]', false)

            let isExpired = true
            if(expirationDate !== false) {
                if(expirationDate.length == 8) {
                    expirationDate += '235959'
                }
                expirationDate = moment(expirationDate, "YYYYMMDDHHmmss")
                let expirationdateString = expirationDate.format('YYYY-MM-DD HH:mm:ss')
                let expirationdateMST  = moment.tz(expirationdateString, "America/Denver");
                let currentMSTTime = moment().tz("America/Denver")
                if(expirationdateMST.isAfter(currentMSTTime)) {
                    isExpired = false
                }
            }
            if(nextBillingDate !== false) {
                if(nextBillingDate.length == 8) {
                    nextBillingDate += '235959'
                }
                nextBillingDate = moment(nextBillingDate, "YYYYMMDDHHmmss")
            }

            if (subscriptionStatus !== false) {
                if(subscriptionStatus == '0' && isExpired == false) {
                    subscriptionStatus = '1' 
                }

                if (subscriptionStatus == '1' || subscriptionStatus == '2') {

                    if(expirationDateStringFromCCbill === false && nextBillingDateStringFromCCbill !== false) {
                        expirationDateStringFromCCbill = nextBillingDateStringFromCCbill
                    }

                    var data = {
                        subscriptionId: subscriptionId,
                        expirationDate: expirationDateStringFromCCbill,
                        subscriptionStatus: subscriptionStatus
                    }

                    activeSubscriptionIdArray.push(data)
                } else if (subscriptionStatus == '0') {
                    element.is_expired_or_void = true
                    element.save()
                } else {
                    isCCBillError = true
                    break;
                }
            } else if (result.results == "-3") { // No record was found for the given subscription. possible case ccbill
                element.is_expired_or_void = true
                element.save()
            } else {
                console.log(`TODO: Check for Error: ${result}`)
                isCCBillError = true
                break;
            }
        }

        var resData = {
            status: false,
            isCCBillError: isCCBillError
        }

        if (activeSubscriptionIdArray.length > 0) {
            resData = {
                status: true,
                subscriptionId: activeSubscriptionIdArray[0].subscriptionId,
                expirationDate: activeSubscriptionIdArray[0].expirationDate,
                subscriptionStatus: activeSubscriptionIdArray[0].subscriptionStatus,
                isCCBillError: isCCBillError
            }
        }

        return res.send(resData)
    } else {
        var resData = {
            status: false
        }
        return res.send(resData)
    }
}))

/**
 * Get subscription status from CCBill
 * @param {String} subscriptionId 
 * @param {String} clientAccnum 
 * @param {String} userName 
 * @param {String} password
 * @param {String} subAccountNumber
 * @returns {Promise} CCBill subscriptionStatus
 */

async function getExpirationDateFromCCBill(subscriptionId, clientAccnum, userName, password, subAccountNumber) {
    return new Promise(async (resolve, reject) => {
        let url = `https://datalink.ccbill.com/utils/subscriptionManagement.cgi?password=${password}&action=viewSubscriptionStatus&usingSubacc=${subAccountNumber}&subscriptionId=${subscriptionId}&username=${userName}&clientAccnum=${clientAccnum}&returnXML=1`
        console.log(url)
        let resBody = await rp.get({
            url: url
        })

        let result = await parseStringXmlToJson(resBody)

        resolve(result)
    })
}

function parseStringXmlToJson(body) {
    return new Promise(function (resolve, reject) {
        parseString(body, function (error, result) {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    });
}

module.exports = router
