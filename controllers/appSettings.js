const express = require('express')
const router = express.Router()
const _ = require('lodash')
const moment = require('moment')
const AppSettings = require('./../models/AppSettings')
const WebsiteCommission = require('./../models/WebsiteCommission')

router.post('/save', async (req, res) => {
    let subAccountArray = [
        req.body.ccbill_shop_account_code,
        req.body.ccbill_tips_account_code,
        req.body.ccbill_subscription_account_code,
        req.body.ccbill_chat_account_code
    ]

    subAccountArray = _.uniq(subAccountArray)

    subAccountArray.forEach(element => {
        AppSettings.find({ sub_account: element }).then(appSettings => {
            if (appSettings.length > 0) {
                let appSettingsData = appSettings[0]

                appSettingsData.platform_commission = req.body.platform_commission
                appSettingsData.ccbill_charge = req.body.ccbill_charge

                appSettingsData.save().then(() => { })
            } else {
                const data = {
                    sub_account: element,
                    platform_commission: req.body.platform_commission,
                    ccbill_charge: req.body.ccbill_charge
                }

                const appSettingsData = new AppSettings(data)

                appSettingsData.save().then(() => { })
            }
        })
    })

    const domain = new URL(req.body.domain)
    const hostName = domain.hostname
    const date = moment().format('YYYY-MM-DD 00:00:00')
    const currentDate = new Date(date)
    const platformCommission = req.body.platform_commission
    const ccbillCharge = req.body.ccbill_charge
    const stickyIoCharges = req.body.sticky_io_charges
    const stickyIoTransactionCharge = req.body.sticky_io_transaction_charge
    const ccbillTransactionCharges = req.body.ccbill_transaction_charge

    let previousWebsiteCommission = await WebsiteCommission.findOne({ domain: hostName }).sort({ target_date: -1 })

    let shouldAddNewRecord = false

    if (previousWebsiteCommission !== null) {
        const currentPlatformCommission = previousWebsiteCommission.platform_commission.toString()
        const currentCCBillCharge = previousWebsiteCommission.ccbill_fees.toString()
        const currentCCBillTransactionCharge = previousWebsiteCommission.ccbill_transaction_charge.toString()
        const isCommissionChange = (
            (platformCommission !== currentPlatformCommission) ||
            (ccbillCharge !== currentCCBillCharge) ||
            (ccbillTransactionCharges !== currentCCBillTransactionCharge)
        )

        if (currentDate.getTime() === previousWebsiteCommission.target_date.getTime()) {
            if (isCommissionChange === true) {
                previousWebsiteCommission.platform_commission = platformCommission
                previousWebsiteCommission.ccbill_fees = ccbillCharge
                previousWebsiteCommission.sticky_io_transaction_charge = stickyIoTransactionCharge
                previousWebsiteCommission.sticky_io_charges = stickyIoCharges
                previousWebsiteCommission.ccbill_transaction_charge = ccbillTransactionCharges
                previousWebsiteCommission.updated_at = new Date()

                await previousWebsiteCommission.save()
            }
        } else if (isCommissionChange === true) {
            shouldAddNewRecord = true
        }
    } else {
        shouldAddNewRecord = true
    }

    if (shouldAddNewRecord === true) {
        let websiteCommissionData = {
            domain: hostName,
            platform_commission: platformCommission,
            ccbill_fees: ccbillCharge,
            sticky_io_charges: stickyIoCharges,
            sticky_io_transaction_charge: stickyIoTransactionCharge,
            ccbill_transaction_charge: ccbillTransactionCharges,
            target_date: date,
            created_at: new Date(),
            updated_at: new Date()
        }

        let websiteCommission = new WebsiteCommission(websiteCommissionData)
        await websiteCommission.save()
    }

    return res.send({ message: 'Saved' })
})

router.post('/save-sticky-io-commission', async (req, res) => {
    const domain = new URL(req.body.domain)
    const hostName = domain.hostname
    const date = moment().format('YYYY-MM-DD 00:00:00')
    const currentDate = new Date(date)
    const platformCommission = req.body.platform_commission
    const stickyIoCharges = req.body.sticky_io_charges
    const stickyIoTransactionCharge = req.body.sticky_io_transaction_charge
    const ccbillCharge = req.body.ccbill_charge
    const ccbillTransactionCharges = req.body.ccbill_transaction_charge

    const previousWebsiteCommission = await WebsiteCommission.findOne({ domain: hostName, payment_gateway: 'sticky.io' }).sort({ target_date: -1 })

    let shouldAddNewRecord = false

    if (previousWebsiteCommission !== null) {
        const currentPlatformCommission = previousWebsiteCommission.platform_commission.toString()
        const currentStickyIoCharge = previousWebsiteCommission.sticky_io_charges
        const currentStickyIoTransactionCharge = previousWebsiteCommission.sticky_io_transaction_charge

        const isCommissionChange = (platformCommission.toString() !== currentPlatformCommission.toString()) ||
            (stickyIoTransactionCharge.toString() !== currentStickyIoTransactionCharge.toString()) ||
            (JSON.stringify(stickyIoCharges) !== JSON.stringify(currentStickyIoCharge))

        if (currentDate.getTime() === previousWebsiteCommission.target_date.getTime()) {
            if (isCommissionChange === true) {
                previousWebsiteCommission.platform_commission = platformCommission
                previousWebsiteCommission.sticky_io_transaction_charge = stickyIoTransactionCharge
                previousWebsiteCommission.sticky_io_charges = stickyIoCharges
                previousWebsiteCommission.ccbill_fees = ccbillCharge
                previousWebsiteCommission.ccbill_transaction_charge = ccbillTransactionCharges
                previousWebsiteCommission.updated_at = new Date()
                await previousWebsiteCommission.save()
            }
        } else if (isCommissionChange === true) {
            shouldAddNewRecord = true
        }
    } else {
        shouldAddNewRecord = true
    }

    if (shouldAddNewRecord === true) {
        const websiteCommissionData = {
            domain: hostName,
            platform_commission: platformCommission,
            sticky_io_charges: stickyIoCharges,
            sticky_io_transaction_charge: stickyIoTransactionCharge,
            ccbill_fees: ccbillCharge,
            target_date: date,
            created_at: new Date(),
            updated_at: new Date(),
            payment_gateway: 'sticky.io',
            ccbill_transaction_charge: ccbillTransactionCharges
        }

        const websiteCommission = new WebsiteCommission(websiteCommissionData)
        await websiteCommission.save()
    }

    return res.send({ message: 'Saved' })
})

router.post('/save-forumpay-commission', async (req, res) => {
    const domain = new URL(req.body.domain)
    const hostName = domain.hostname
    const date = moment().format('YYYY-MM-DD 00:00:00')
    const currentDate = new Date(date)
    const reqBody = req.body
    const forumPayCharge = reqBody.forumpay_transaction_charge

    const previousWebsiteCommission = await WebsiteCommission.findOne({ domain: hostName, payment_gateway: 'forumpay' }).sort({ target_date: -1 })

    let shouldAddNewRecord = false

    if (previousWebsiteCommission !== null) {
        const currentForumPayCharge = previousWebsiteCommission.forumpay_transaction_charge.toString()

        const isCommissionChange = (forumPayCharge.toString() !== currentForumPayCharge.toString())

        if (currentDate.getTime() === previousWebsiteCommission.target_date.getTime()) {
            if (isCommissionChange === true) {
                previousWebsiteCommission.forumpay_transaction_charge = forumPayCharge
                previousWebsiteCommission.updated_at = new Date()
                await previousWebsiteCommission.save()
            }
        } else if (isCommissionChange === true) {
            shouldAddNewRecord = true
        }
    } else {
        shouldAddNewRecord = true
    }

    if (shouldAddNewRecord === true) {
        const websiteCommissionData = {
            domain: hostName,
            platform_commission: reqBody.platform_commission,
            sticky_io_charges: reqBody.sticky_io_charges,
            sticky_io_transaction_charge: reqBody.sticky_io_transaction_charge,
            ccbill_fees: reqBody.ccbill_fees,
            target_date: date,
            created_at: new Date(),
            updated_at: new Date(),
            payment_gateway: 'forumpay',
            ccbill_transaction_charge: reqBody.ccbill_transaction_charge,
            forumpay_transaction_charge: forumPayCharge
        }

        const websiteCommission = new WebsiteCommission(websiteCommissionData)
        await websiteCommission.save()
    }

    return res.send({ message: 'Saved' })
})

module.exports = router
