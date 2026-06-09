const _ = require('lodash')
const axios = require('axios')
const moment = require('moment')
const csv2array = require('./csv.to.array')
const TransactionReports = require('./../models/CCBillTransactionReports')
const TransactionApiQueue = require('./../models/TransactionApiQueue')
const logger = require('./../config/winston')
const AppSettings = require('./../models/AppSettings')
const { getUserIdAndSubscriptionId } = require('../commands/voidRefundAndChargeback')
const { addCronStatusLog } = require('./addCronStatus')

/**
 * Get Item from transaction queue and if found download CSV from CCBill
 *
 * @returns {void}
 */
async function getTransactionQueue() {
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    let message = 'Record not found'

    const row = await TransactionApiQueue.findOne()
    if (row !== null) {
        const startDateTime = row.start_date_timestamp
        const endDateTime = row.end_date_timestamp
        console.log(startDateTime)
        console.log(endDateTime)
        await removeDataFromTransaction(startDateTime, endDateTime)
        const resData = await addTransactionDetails(startDateTime, endDateTime)
        if (resData.added == true) {
            logger.info('Transactions data added')
            try {
                await row.deleteOne()
                logger.info('Queue item removed')
                message = ''
            } catch (error) {
                message = 'DB Error - ' + _.get(error, 'message', '')
                logger.info('DB Error ', error)
            }
        } else {
            message = 'Transactions data not added'
            logger.info('Transactions data not added')
        }
    }
    const cronStatusData = {
        domain: 'services',
        command_name: 'Get transaction queue',
        cron_status: 'success',
        target_date: target_date,
        message: message
    }
    await addCronStatusLog(cronStatusData)
    return
}

/**
 * Add previous day element in Transaction API Queue
 *
 * @returns {void}
 */
async function addTransactionQueue() {
    const startDateTime = moment().startOf('day').subtract(1, 'days').format('YYYYMMDDHHmmss')
    const endDateTime = moment().endOf('day').subtract(1, 'days').format('YYYYMMDDHHmmss')
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    let message = 'Record not found'

    const queue = await TransactionApiQueue.find({ start_date_timestamp: startDateTime, end_date_timestamp: endDateTime })
    if (queue.length == 0) {
        message = ''
        logger.info('Adding Data in Queue')
        const obj = {
            start_date_timestamp: startDateTime,
            end_date_timestamp: endDateTime
        }
        const transactionApiQueue = new TransactionApiQueue(obj)
        await transactionApiQueue.save()
    }
    const cronStatusData = {
        domain: 'services',
        command_name: 'Add transaction queue',
        cron_status: 'success',
        target_date: target_date,
        message: message
    }
    await addCronStatusLog(cronStatusData)
    return
}

/**
 * Request CSV from CCBill and store data after formatting
 *
 * @param {string} startDateTime Start date and time
 * @param {string} endDateTime End date and time
 * @returns {object} response data
 */
async function addTransactionDetails(startDateTime, endDateTime) {
    const username = process.env.DATALINK_USERNAME
    const password = process.env.DATALINK_PASSWORD
    const clientAccnum = process.env.CLIENT_ACCOUNT_NUMBER
    const resData = {
        added: false
    }

    const queryParameters = {
        startTime: startDateTime,
        endTime: endDateTime,
        transactionTypes: 'NEW,REBILL,REFUND,CHARGEBACK,VOID,CDS',
        clientAccnum: clientAccnum,
        username: username,
        password: password
    }

    const queryString = new URLSearchParams(queryParameters).toString()
    let url = `https://datalink.ccbill.com/data/main.cgi?${decodeURIComponent(queryString)}`

    if (process.env.NODE_ENV === 'development') {
        url = 'http://localhost:8081/sendCSV'
    }

    const response = await axios.get(url)
    const body = response.data
    if (!body.includes('Error:')) {
        let rows = []
        try {
            rows = csv2array(body)
            if (rows.length > 0) {
                for (const row of rows) {
                    let [type, client_account_number, ...rest] = row
                    switch (type) {
                        case 'NEW': {
                            let [
                                new_client_sub_account,
                                new_subscription_id,
                                new_transaction_timestamp,
                                new_first_name,
                                new_last_name,
                                new_email_address,
                                new_partner_id,
                                new_subscription_status,
                                new_accounting_amount,
                                new_initial_period,
                                new_recurring_accounting_amount,
                                new_recurring_period,
                                new_recurring_status,
                                new_card_type
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: new_transaction_timestamp, client_sub_account: new_client_sub_account })
                            if (data === 0) {
                                const amounts = await calculateCommissions(new_client_sub_account, new_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: new_client_sub_account,
                                    subscription_id: new_subscription_id,
                                    transaction_timestamp: new_transaction_timestamp,
                                    first_name: new_first_name,
                                    last_name: new_last_name,
                                    email_address: new_email_address.toLowerCase(),
                                    partner_id: new_partner_id,
                                    subscription_status: new_subscription_status,
                                    accounting_amount: new_accounting_amount,
                                    initial_period: new_initial_period,
                                    recurring_accounting_amount: new_recurring_accounting_amount,
                                    recurring_period: new_recurring_period,
                                    recurring_status: new_recurring_status,
                                    card_type: new_card_type,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(new_transaction_timestamp, 'YYYYMMDDHHmmss')
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        case 'CLIENT DRIVEN SETTLEMENT': {
                            let [
                                cdc_client_sub_account,
                                cdc_subscription_id,
                                cdc_transaction_timestamp,
                                cdc_first_name,
                                cdc_last_name,
                                cdc_email_address,
                                cdc_partner_id,
                                cdc_subscription_status,
                                cdc_accounting_amount,
                                cdc_initial_period,
                                cdc_recurring_accounting_amount,
                                cdc_recurring_period,
                                cdc_recurring_status,
                                cdc_card_type,
                                cdc_cancel_date
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: cdc_transaction_timestamp, client_sub_account: cdc_client_sub_account })
                            if (data === 0) {
                                const amounts = await calculateCommissions(cdc_client_sub_account, cdc_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: cdc_client_sub_account,
                                    subscription_id: cdc_subscription_id,
                                    transaction_timestamp: cdc_transaction_timestamp,
                                    first_name: cdc_first_name,
                                    last_name: cdc_last_name,
                                    email_address: cdc_email_address.toLowerCase(),
                                    partner_id: cdc_partner_id,
                                    subscription_status: cdc_subscription_status,
                                    accounting_amount: cdc_accounting_amount,
                                    initial_period: cdc_initial_period,
                                    recurring_accounting_amount: cdc_recurring_accounting_amount,
                                    recurring_period: cdc_recurring_period,
                                    recurring_status: cdc_recurring_status,
                                    card_type: cdc_card_type,
                                    cancel_date: cdc_cancel_date,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(cdc_transaction_timestamp, 'YYYYMMDDHHmmss')
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        case 'REBILL': {
                            let [
                                rebill_client_sub_account,
                                rebill_subscription_id,
                                rebill_transaction_timestamp,
                                rebill_transaction_id,
                                rebill_accounting_amount
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: rebill_transaction_timestamp, client_sub_account: rebill_accounting_amount })
                            if (data === 0) {
                                const amounts = await calculateCommissions(rebill_client_sub_account, rebill_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: rebill_client_sub_account,
                                    subscription_id: rebill_subscription_id,
                                    transaction_timestamp: rebill_transaction_timestamp,
                                    accounting_amount: rebill_accounting_amount,
                                    rebill_transaction_id: rebill_transaction_id,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(rebill_transaction_timestamp, 'YYYYMMDDHHmmss')
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        case 'REFUND': {
                            let [
                                refund_client_sub_account,
                                refund_subscription_id,
                                refund_transaction_timestamp,
                                refund_accounting_amount
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: refund_transaction_timestamp, client_sub_account: refund_accounting_amount })
                            if (data === 0) {
                                const amounts = await calculateCommissions(refund_client_sub_account, refund_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: refund_client_sub_account,
                                    subscription_id: refund_subscription_id,
                                    transaction_timestamp: refund_transaction_timestamp,
                                    accounting_amount: refund_accounting_amount,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(refund_transaction_timestamp, 'YYYYMMDDHHmmss')
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        case 'CHARGEBACK': {
                            let [
                                chargeback_client_sub_account,
                                chargeback_subscription_id,
                                chargeback_transaction_timestamp,
                                chargeback_accounting_amount
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: chargeback_transaction_timestamp, client_sub_account: chargeback_accounting_amount })
                            if (data === 0) {
                                const amounts = await calculateCommissions(chargeback_client_sub_account, chargeback_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: chargeback_client_sub_account,
                                    subscription_id: chargeback_subscription_id,
                                    transaction_timestamp: chargeback_transaction_timestamp,
                                    accounting_amount: chargeback_accounting_amount,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(chargeback_transaction_timestamp, 'YYYYMMDDHHmmss'),
                                    platform_chargeback_fees: amounts.platformChargebackFees,
                                    model_chargeback_fees: amounts.modelChargebackFees
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        case 'VOID': {
                            let [
                                void_client_sub_account,
                                void_subscription_id,
                                void_transaction_timestamp,
                                void_accounting_amount
                            ] = rest

                            const data = await TransactionReports.countDocuments({ transaction_timestamp: void_transaction_timestamp, client_sub_account: void_client_sub_account })
                            if (data === 0) {
                                const amounts = await calculateCommissions(void_client_sub_account, void_accounting_amount, type)
                                const obj = {
                                    type: type,
                                    client_account_number: client_account_number,
                                    client_sub_account: void_client_sub_account,
                                    subscription_id: void_subscription_id,
                                    transaction_timestamp: void_transaction_timestamp,
                                    accounting_amount: void_accounting_amount,
                                    pcp_model_earnings: amounts.modelEarnings,
                                    pcp_platform_commission: amounts.platformCommissionAmount,
                                    pcp_ccbill_charge: amounts.ccbillChargeAmount,
                                    pcp_transaction_date: moment(void_transaction_timestamp, 'YYYYMMDDHHmmss')
                                }

                                const transactionReports = new TransactionReports(obj)
                                await transactionReports.save()
                            }
                            break
                        }
                        default:
                            break
                    }
                }
                resData.added = true
                // call function to update user info in ccbill transaction collection
                await getUserIdAndSubscriptionId(startDateTime, endDateTime)
            } else {
                logger.info('No transaction data for selected date')
                resData.added = true
            }
        } catch (err) {
            logger.info(err)
        }
    } else {
        logger.info(body)
        resData.added = true
    }

    return resData
}

/**
 * Calculate Commissions
 *
 * @param {string} subAccount CCBill sub-account
 * @param {string} amount amount
 * @param {string} type transaction type
 * @returns {Promise} Amounts object
 */
async function calculateCommissions(subAccount, amount, type) {
    const amounts = {
        modelEarnings: 0,
        platformCommission: 0,
        ccbillChargeAmount: 0,
        platformChargebackFees: 0,
        modelChargebackFees: 0
    }

    const appSettings = await AppSettings.findOne({ sub_account: subAccount })
    if (!_.isEmpty(appSettings)) {
        const platformCommission = appSettings.platform_commission
        const ccbillCharge = appSettings.ccbill_charge
        const originalAmount = parseFloat(amount)

        let ccbillChargeAmount = (originalAmount * ccbillCharge) / 100
        ccbillChargeAmount = parseFloat(ccbillChargeAmount)

        const remainingAmount = originalAmount - ccbillChargeAmount

        let platformCommissionAmount = (remainingAmount * platformCommission) / 100
        platformCommissionAmount = parseFloat(platformCommissionAmount)

        const modelEarnings = originalAmount - ccbillChargeAmount - platformCommissionAmount

        let platformChargebackFees = 0
        let modelChargebackFees = 0
        if (type === 'CHARGEBACK') {
            const platformCommissionPercentage = (platformCommissionAmount * 100) / originalAmount
            platformChargebackFees = 25 * (platformCommissionPercentage / 100)
            modelChargebackFees = 25 * ((100 - platformCommissionPercentage) / 100)
        }

        amounts.modelEarnings = modelEarnings
        amounts.platformCommission = platformCommission
        amounts.ccbillChargeAmount = ccbillChargeAmount
        amounts.platformChargebackFees = platformChargebackFees
        amounts.modelChargebackFees = modelChargebackFees
    }

    return amounts
}

/**
 * Remove the API Queue data after processing
 *
 * @param {*} startDate Start date
 * @param {*} endDate End date
 * @returns {Promise} resolve
 */
async function removeDataFromTransaction(startDate, endDate) {
    let startDateTime = moment(startDate, 'YYYYMMDDHHmmss')
    let endDateTime = moment(endDate, 'YYYYMMDDHHmmss')
    startDateTime = new Date(startDateTime)
    endDateTime = new Date(endDateTime)
    console.log(startDateTime)
    console.log(endDateTime)

    const transactionData = await TransactionReports.deleteMany({ pcp_transaction_date: { $gte: startDateTime, $lte: endDateTime } })
    console.log(transactionData)
    return
}

module.exports = { getTransactionQueue, addTransactionQueue }
