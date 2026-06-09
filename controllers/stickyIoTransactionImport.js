const express = require('express')
const router = express.Router()
const csvtojson = require('csvtojson')
const StickyIoTransactions = require('../models/StickyIoTransactions')
const StickyIoCsvImportLog = require('../models/StickyIoCsvImportLog')
const AwsSettings = require('../models/AwsSettings')
const { protectRouteWithRole, SUPER_ADMIN, ROLE_SUPPORT } = require('./../middleware/auth.middleware')
const moment = require('moment')
const { stickyIoDailyTransactionAnalysis, generateStickyIoDailyEarningReportByDate } = require('./../utils/stickyIoTransactions')
const { uploadFileToS3 } = require('./../utils/upload')
const { v4: uuidv4 } = require('uuid')
const { processRebillTransactionByDate } = require('./../commands/processStickyIoRebillTransaction')
const { checkUserSubscriptionStatusAfterRebill } = require('./../commands/checkUserSubscriptionStatus')

router.post('/import-csv', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        if (req.files === null || req.files.csv === undefined) {
            return res.send({ status: false, message: 'Please select CSV file' })
        }

        const csv = req.files.csv
        const fileType = csv.mimetype
        if (fileType !== 'text/csv') {
            return res.send({ status: false, message: 'Please select CSV file' })
        }

        let filePath = ''
        let isCsvUploaded = false
        let csvErrorMessage = ''
        try {
            // upload csv into s3
            const csvFile = csv.data
            let [fileName, fileExtension] = csv.name.split(/\.(?=[^.]+$)/)
            fileName = `${uuidv4()}_${fileName}.${fileExtension}`
            let s3FilePath = `sticky_io_report/${fileName}`
            const uploadCSV = await uploadFileToS3(csvFile, s3FilePath, 'text/csv')
            filePath = uploadCSV.key
            isCsvUploaded = true
        } catch (error) {
            csvErrorMessage = error.message
        }

        const csvData = csv.data.toString('utf-8')
        const transactions = await csvtojson(csvData).fromString(csvData)
        const transactionDates = []

        const RefundTransactionDates = ['12/06/2021', '12/07/2021', '12/08/2021']
        const RefundTransactionCampaignId = ['34', '38']

        for (const transaction of transactions) {
            const transactionDateTime = moment(`${transaction['Date of Sale']} ${transaction['Time of Sale']}`, 'MM/DD/YYYY HH:mm A').format('YYYY-MM-DD 00:00:00')

            const transactionData = {
                order_status: transaction['Order Status'],
                campaign_id: transaction['Campaign Id'],
                product_id: transaction['Product Id'],
                offer_id: transaction['Offer Id'],
                billing_model_id: transaction['Billing Model Id'],
                gateway_id: transaction['Gateway Id'],
                payment: transaction['Payment'],
                order_total: transaction['Order Total'],
                order_date_time: moment.utc(transactionDateTime),
                order_id: transaction['Order Id'],
                bill_first_name: transaction['Bill First'],
                bill_last_name: transaction['Bill Last'],
                bill_phone: transaction['Bill Phone'],
                bill_email: transaction['Bill Email'],
                ip_address: transaction['IP Address'],
                ip_address_lookup: transaction['IP Address Lookup'],
                decline_reason: transaction['Decline Reason'],
                transaction_number: transaction['Transaction Number'],
                auth_number: transaction['Auth Number'],
                is_cancel: transaction['Is Cancel'],
                is_fraud: transaction['Is Fraud'],
                is_recurring: transaction['Is Recurring'],
                recurring_date: transaction['Recurring Date'],
                is_chargeback: transaction['Is Chargeback'],
                chargeback_date: transaction['Chargeback Date'],
                chargeback_by: transaction['Chargeback By'],
                is_void: transaction['Is Void'],
                void_amount: transaction['Void Amount'],
                void_date: transaction['Void Date'],
                voided_by: transaction['Voided By'],
                is_refund: transaction['Is Refund'],
                refund_amount: transaction['Refund Amount'],
                refund_date: transaction['Refund Date'],
                refunded_by: transaction['Refunded By'],
                pcp_user_id: transaction['C1'],
                pcp_transaction_id: transaction['C2'],
                pcp_transaction_type: transaction['C3'],
                ancestor_order_id: transaction['Ancestor Order Id'],
                parent_order_id: transaction['Parent Order Id'],
                payment_gateway: transaction['Gateway Alias'].toLowerCase(),
                is_cascaded: transaction['Is Cascaded'],
                original_gateway_id: transaction['Original Gateway Id'],
                original_decline_reason: transaction['Original Decline Reason'],
            }

            if (
                RefundTransactionDates.includes(transaction['Date of Sale']) === true &&
                RefundTransactionCampaignId.includes(transaction['Campaign Id']) === true &&
                transaction['Gateway Id'] === '4' &&
                transaction['Order Status'] === 'NEW'
            ) {
                transactionData.is_refund = 'YES'
                transactionData.order_status = 'VOID/REFUNDED'
                transactionData.refund_amount = transaction['Order Total']
                transactionData.refund_date = moment().subtract(1, 'day').format('MM/DD/YYYY')
                transactionData.refunded_by = 'PCP System'
            }

            if (transactionDates.indexOf(transactionDateTime) === -1) {
                transactionDates.push(transactionDateTime)
            }

            const findTransaction = await StickyIoTransactions.findOne({ order_status: transaction['Order Status'], campaign_id: transaction['Campaign Id'], order_id: transaction['Order Id'] })

            if (findTransaction === null) {
                const insertTransaction = new StickyIoTransactions(transactionData)
                await insertTransaction.save()
            } else {
                await StickyIoTransactions.updateOne({ _id: findTransaction._id }, { $set: transactionData })
            }
        }

        transactionDates.sort()
        // process records
        if (transactionDates.length > 0) {
            for (const date of transactionDates) {
                const formattedDate = moment(date, 'YYYY-MM-DD 00:00:00 Z').format('YYYY-MM-DD')
                await stickyIoDailyTransactionAnalysis(formattedDate)
                checkUserSubscriptionStatusAfterRebill(formattedDate)
                processRebillTransactionByDate(formattedDate)
            }
        }

        const csvLogData = {
            file_name: csv.name,
            uploaded_by: req.decoded.role,
            date_of_transactions: transactionDates,
            file_path: filePath
        }
        const addCsvImportLog = new StickyIoCsvImportLog(csvLogData)
        await addCsvImportLog.save()

        const message = isCsvUploaded === true ? 'Transaction Report Successfully Import.' : `Transaction Report Successfully Import. Error in CSV upload: ${csvErrorMessage}`

        return res.send({ status: true, message: message })
    } catch (error) {
        return res.send({ status: false, message: 'Error in transaction import' })
    }
})

router.post('/import-csv-log', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10)
        const totalRows = await StickyIoCsvImportLog.countDocuments({})
        const limit = 20
        const totalPages = Math.ceil(totalRows / limit)
        const offset = (page - 1) * limit

        const rows = await StickyIoCsvImportLog.find({}).sort({ _id: -1 }).skip(offset).limit(limit)

        const awsSettings = await AwsSettings.findOne({}, 'aws_url')
        const response = {
            rows: rows,
            totalPages: totalPages,
            currentPage: page,
            totalRows: totalRows,
            limit: limit,
            awsUrl: awsSettings.aws_url || ''
        }
        return res.send({ status: true, message: 'CSV import log', data: response })
    } catch (error) {
        return res.send({ status: false, message: 'Error in fetch CSV import log' })
    }
})

router.post('/calculate-earning', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const date = req.body.date
        const formattedDate = moment(date).format('YYYY-MM-DD')
        await generateStickyIoDailyEarningReportByDate(formattedDate)
        return res.send({ status: true, message: 'Earning Successfully Calculated' })
    } catch (error) {
        return res.send({ status: false, message: 'Error in fetch CSV import log' })
    }
})
module.exports = router
