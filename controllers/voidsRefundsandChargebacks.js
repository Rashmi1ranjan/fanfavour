const express = require('express')
const router = express.Router()
const CCbillTransactionReports = require('../models/CCBillTransactionReports')
const StickyIoTransactionReport = require('../models/StickyIoTransactionReport')
const Website = require('../models/Website')
const { successResponse } = require('../utils/index')
const moment = require('moment')
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const json2csv = require('json2csv').parse
const { v4: uuidv4 } = require('uuid')
const { errorResponse } = require('../utils/index')
const mongoose = require('mongoose')

const csvStatus = []

router.post('/getRefundAndChargeback', async (req, res) => {
    const stickyIO_query = {}
    const ccbill_query = {}

    const projectQuery = {
        subscription_sub_account: 1,
        shop_sub_account: 1,
        tip_sub_account: 1,
        _id: 0
    }

    const websiteDomain = _.get(req, 'body.website_url', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const website_url = websiteDomain !== '' ? domain.hostname : ''
    const website = await Website.findOne({ website_url: website_url }, projectQuery)
    const { subscription_sub_account, shop_sub_account, tip_sub_account } = website

    const startDate = _.get(req, 'body.start_date', '')
    const endDate = _.get(req, 'body.end_date', '')

    if (startDate !== '' && endDate !== '') {
        const start_date = new Date(moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00'))
        const end_date = new Date(moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59'))
        ccbill_query.pcp_transaction_date = { $gte: start_date, $lte: end_date }
        stickyIO_query.transaction_date = { $gte: start_date, $lte: end_date }
    }

    const type = _.get(req, 'body.type', '')
    if (!_.isEmpty(type)) {
        stickyIO_query.transaction_type = { $in: type }
        ccbill_query.type = { $in: type }
    } else {
        stickyIO_query.transaction_type = { $in: ['VOID', 'REFUND', 'CHARGEBACK'] }
        ccbill_query.type = { $in: ['VOID', 'REFUND', 'CHARGEBACK'] }
    }

    if (!_.isEmpty(website)) {
        if (subscription_sub_account !== '' || shop_sub_account !== '' || tip_sub_account !== '') {
            ccbill_query.client_sub_account = {
                $in: [subscription_sub_account, shop_sub_account, tip_sub_account]
            }
        }
    }

    if (!_.isEmpty(website_url)) {
        stickyIO_query.website_url = website_url
    }

    const user_id = _.get(req, 'body.user_id', '')
    let isValidUserId = true
    if (!_.isEmpty(user_id)) {
        isValidUserId = mongoose.Types.ObjectId.isValid(user_id.trim())
        if (isValidUserId === true) {
            stickyIO_query.pcp_user_id = user_id.trim()
            ccbill_query.user_id = user_id.trim()
        }
    }

    const currentPage = parseInt(req.body.page, 10)
    const countCCbillTransactionReport = await CCbillTransactionReports.countDocuments(ccbill_query)
    const countStickyIOTransaction = await StickyIoTransactionReport.countDocuments(stickyIO_query)
    const totalRows = parseInt(countCCbillTransactionReport) + parseInt(countStickyIOTransaction)

    const ccbill_limit = 100
    const stickyIo_limit = 100
    let limit = ccbill_limit + stickyIo_limit
    const ccbill_offset = (currentPage - 1) * ccbill_limit
    const stickyIo_offset = (currentPage - 1) * stickyIo_limit
    const totalPages = Math.ceil(totalRows / limit)
    const isExportCSV = _.get(req, 'body.exportCSV', false)

    let totalRecord = []
    if (totalRows > 0) {
        const ccBillProjectQuery = {
            payment_gateway: 'ccbill',
            first_name: 1,
            email_address: 1,
            pcp_transaction_date: 1,
            accounting_amount: 1,
            type: 1,
            user_id: 1
        }
        const stickyIoProjectQuery = {
            payment_gateway: 'sticky.io',
            first_name: 1,
            email: 1,
            transaction_date: 1,
            transaction_type: 1,
            amount: 1,
            pcp_user_id: 1
        }
        let ccBillTotalRecord = []
        let stickyIoTotalRecord = []
        if (isExportCSV === false) {
            ccBillTotalRecord = await CCbillTransactionReports.find(ccbill_query, ccBillProjectQuery).skip(ccbill_offset).limit(ccbill_limit).sort({ pcp_transaction_date: -1 })
            stickyIoTotalRecord = await StickyIoTransactionReport.find(stickyIO_query, stickyIoProjectQuery).skip(stickyIo_offset).limit(stickyIo_limit).sort({ transaction_date: -1 })
            if (currentPage === 1) {
                limit = ccBillTotalRecord.length + stickyIoTotalRecord.length
            } else {
                limit = req.body.limit
            }
        } else {
            ccBillTotalRecord = await CCbillTransactionReports.find(ccbill_query, ccBillProjectQuery).sort({ pcp_transaction_date: -1 })
            stickyIoTotalRecord = await StickyIoTransactionReport.find(stickyIO_query, stickyIoProjectQuery).sort({ transaction_date: -1 })
        }

        totalRecord = [...ccBillTotalRecord, ...stickyIoTotalRecord]
    }

    let ccBillTotalAmount = await CCbillTransactionReports.aggregate([
        {
            $match: ccbill_query
        },
        {
            $group: {
                _id: '$type',
                'amount': { '$sum': '$accounting_amount' }
            }
        }
    ])
    let stickyIoTotalAmount = await StickyIoTransactionReport.aggregate([
        {
            $match: stickyIO_query
        },
        {
            $group: {
                _id: '$transaction_type',
                'amount': { '$sum': { '$toDouble': '$amount' } }
            }
        }
    ])

    const transactionAmount = Object.values([...ccBillTotalAmount, ...stickyIoTotalAmount].reduce((item, obj) => {
        if (!item[obj._id]) {
            item[obj._id] = obj
        } else {
            item[obj._id].amount += obj.amount
        }
        return item
    }, {}))

    const refundAmount = transactionAmount.filter(item => item._id === 'REFUND').map(item => item.amount)[0]
    const chargebackAmount = transactionAmount.filter(item => item._id === 'CHARGEBACK').map(item => item.amount)[0]
    const voidAmount = transactionAmount.filter(item => item._id === 'VOID').map(item => item.amount)[0]
    let totalAmount = 0
    transactionAmount.forEach(item => {
        totalAmount += item.amount
    })
    const allTransactionAmount = {
        refundAmount: refundAmount,
        chargebackAmount: chargebackAmount,
        voidAmount: voidAmount,
        totalAmount: totalAmount
    }

    const getRefundAndChargeBackData = {
        totalRecord: totalRecord,
        totalPages: totalPages,
        currentPage: currentPage,
        totalRows: totalRows,
        limit: limit,
        transaction: allTransactionAmount
    }
    return successResponse(res, getRefundAndChargeBackData)
})

/**
 * @description generate void refund and chargeback data
 * @param {start_date} start_date start date
 * @param {end_date} end_date end date
 * @param {type} type type
 * @param {fileName} fileName file name
 * @param {website_url} website_url website_url
 * @returns filename
 */

async function generateUsersCSV(start_date, end_date, type, fileName, website_url, user_id) {
    try {
        const stickyIO_query = {}
        const ccbill_query = {}

        const projectQuery = {
            subscription_sub_account: 1,
            shop_sub_account: 1,
            tip_sub_account: 1,
            _id: 0
        }

        const website = await Website.findOne({ website_url: website_url }, projectQuery)
        const { subscription_sub_account, shop_sub_account, tip_sub_account } = website

        if (start_date !== '' && end_date !== '') {
            ccbill_query.pcp_transaction_date = { $gte: start_date, $lte: end_date }
            stickyIO_query.transaction_date = { $gte: start_date, $lte: end_date }
        }

        if (!_.isEmpty(type)) {
            stickyIO_query.transaction_type = type.trim()
            ccbill_query.type = type.trim()
        } else {
            stickyIO_query.transaction_type = { $in: ['VOID', 'REFUND', 'CHARGEBACK'] }
            ccbill_query.type = { $in: ['VOID', 'REFUND', 'CHARGEBACK'] }
        }

        if (!_.isEmpty(website)) {
            ccbill_query.client_sub_account = {
                $in: [subscription_sub_account, shop_sub_account, tip_sub_account]
            }
        }

        if (!_.isEmpty(website_url)) {
            stickyIO_query.website_url = website_url
        }

        if (!_.isEmpty(user_id)) {
            stickyIO_query.pcp_user_id = user_id.trim()
            ccbill_query.user_id = user_id.trim()
        }

        const countCCbillTransactionReport = await CCbillTransactionReports.countDocuments(ccbill_query)
        const countStickyIOTransaction = await StickyIoTransactionReport.countDocuments(stickyIO_query)
        const totalRows = parseInt(countCCbillTransactionReport) + parseInt(countStickyIOTransaction)
        if (totalRows > 0) {
            let limit = 500
            let totalPages = Math.ceil(totalRows / limit)
            for (let index = 0; index < totalPages; index++) {
                const ccBillProjectQuery = {
                    _id: 0,
                    payment_gateway: 'ccbill',
                    first_name: 1,
                    email_address: 1,
                    pcp_transaction_date: 1,
                    accounting_amount: 1,
                    type: 1,
                    user_id: 1
                }

                const ccBillRecord = await CCbillTransactionReports.find(ccbill_query, ccBillProjectQuery)
                const stickyIoProjectQuery = {
                    payment_gateway: 'sticky.io',
                    first_name: 1,
                    email: 1,
                    transaction_date: 1,
                    transaction_type: 1,
                    amount: 1,
                    _id: 0
                }
                const stickyIoRecord = await StickyIoTransactionReport.find(stickyIO_query, stickyIoProjectQuery)
                const totalRecord = [...JSON.parse(JSON.stringify(ccBillRecord)), ...JSON.parse(JSON.stringify(stickyIoRecord))]
                const totalRecordData = []
                for (let i = 0; i < totalRecord.length; i++) {
                    if (totalRecord[i].payment_gateway === 'ccbill') {
                        const ccBillObj = {
                            // first_name: totalRecord[i].first_name,
                            // email: totalRecord[i].email_address,
                            payment_gateway: 'ccbill',
                            amount: totalRecord[i].accounting_amount,
                            type: totalRecord[i].type,
                            date: totalRecord[i].pcp_transaction_date
                        }
                        totalRecordData.push(ccBillObj)
                    } else {
                        const stickyIoObj = {
                            // first_name: totalRecord[i].first_name,
                            // email: totalRecord[i].email,
                            payment_gateway: 'sticky.io',
                            amount: totalRecord[i].amount,
                            type: totalRecord[i].transaction_type,
                            date: totalRecord[i].transaction_date
                        }
                        totalRecordData.push(stickyIoObj)
                    }
                }

                writeDataToCsv(fileName, totalRecordData, index)

            }
            // update csv status to finish
            const findCurrentFileIndex = csvStatus.findIndex(csv => csv.file_name === fileName)
            csvStatus[findCurrentFileIndex].status = 'finish'
            return fileName
        }
    } catch (error) {
        console.log(error)
        return
    }
}

/**
 * @description write data to csv
 * @param {string} fileName CSV file name
 * @param {Array} data data to write in csv
 */
function writeDataToCsv(fileName, data) {
    // output file in the same folder
    const filename = path.resolve(`${__dirname}`, `./../temp/${fileName}`)
    // If file doesn't exist, we will create new file and add rows with headers.
    const header = !fs.existsSync(filename) ? true : false
    // remove old csv files if exist
    if (header === true) {
        const paths = path.resolve(`${__dirname}`, './../temp/')
        removeOldCSVFiles(paths)
    }

    const rows = json2csv(data, { header: header })
    // Append file function can create new file too.
    fs.appendFileSync(filename, rows)
    // Always add new line if file already exists.
    fs.appendFileSync(filename, '\r\n')
}

/**
 * @description Remove old csv from folder
 * @param {string} paths Dir path
 */
function removeOldCSVFiles(paths) {
    fs.readdirSync(paths).forEach(file => {
        if (file !== '.gitignore') {
            fs.stat(paths + '/' + file, function (err, stat) {
                const now = new Date().getTime()
                const endTime = new Date(stat.mtime).getTime() + (60 * 60 * 1000) // 1 hour in milliseconds
                if (err) { return console.error(err) }
                if (now > endTime) {
                    fs.unlinkSync(paths + '/' + file)
                }
            })
        }
    })
}

router.post('/check_csv_status', async (req, res) => {
    const fileName = req.body.file
    if (_.isEmpty(fileName)) {
        res.send({ error: 'file is required' })
        return
    }
    const findCurrentFileIndex = csvStatus.findIndex(csv => csv.file_name === fileName)
    const response = {
        status: findCurrentFileIndex !== -1 ? csvStatus[findCurrentFileIndex].status : ''
    }
    if (response.status === 'finish') {
        csvStatus.splice(findCurrentFileIndex, 1)
    }
    return successResponse(res, response, 'CSV File Status')
})

router.post('/download_csv', async (req, res) => {
    try {
        const fileName = req.body.file
        if (_.isEmpty(fileName)) {
            res.send({ error: 'file is required' })
            return
        }

        const options = {
            root: path.resolve(__dirname, './../temp'),
            headers: {
                'Content-disposition': `attachment; filename=${fileName}`,
                'x-timestamp': Date.now(),
                'x-sent': true
            }
        }

        res.sendFile(fileName, options, function (error) {
            if (error) {
                console.log(error)
            }
        })
    } catch (error) {
        return errorResponse(res, error, 'Error in csv download', 500)
    }
})

/**
 * @description export user CSV
 */
router.post('/voidRefundAndChargebackCsvExport', async (req, res) => {
    const startDate = _.get(req, 'body.start_date', '')
    const endDate = _.get(req, 'body.end_date', '')
    const start_date = moment(startDate, 'MM/DD/YYYY').format('YYYY-MM-DDT00:00:00')
    const end_date = moment(endDate, 'MM/DD/YYYY').format('YYYY-MM-DDT23:59:59')
    const websiteDomain = _.get(req, 'body.website_url', '')
    const domain = websiteDomain !== '' ? new URL(websiteDomain) : ''
    const website_url = websiteDomain !== '' ? domain.hostname : ''
    const user_id = _.get(req, 'body.user_id', '')

    const type = _.get(req, 'body.type', '')
    const fileName = `void-refund-and-chargeback_${uuidv4()}.csv`
    const csvStatusDetail = {
        status: 'processing',
        file_name: fileName,
        request_time: moment()
    }
    csvStatus.push(csvStatusDetail)
    generateUsersCSV(start_date, end_date, type, fileName, website_url, user_id)

    return successResponse(res, { csvFileName: fileName }, 'CSV File')
})

module.exports = router
