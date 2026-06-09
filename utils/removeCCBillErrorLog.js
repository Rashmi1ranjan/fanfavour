const CCBillErrorLog = require('./../models/CCBillErrorLog')
const moment = require('moment')
const { addCronStatusLog } = require('./addCronStatus')

/**
 * Remove CCBill Error Log Loop
 *
 * @returns {boolean} true | false
 */
async function removeCCBillErrorLog() {
    let row = await CCBillErrorLog.findOne({}, 'created_at')
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    if (row !== null) {
        let createdAt = row.created_at

        const startDate = moment(createdAt)
        const targetDate = moment().subtract(14, 'days')

        while (startDate.isBefore(targetDate, 'day')) {
            let deletedRecord = await removeOldRecordsByDate(startDate)
            const object = {
                startDate: startDate,
                deletedCount: deletedRecord.deletedCount
            }
            console.log(object)
            startDate.add(1, 'days')
        }
    }
    const cronStatusData = {
        domain: 'services',
        command_name: 'Remove CCBill Error Logs',
        cron_status: 'success',
        target_date: target_date,
        message: ''
    }
    await addCronStatusLog(cronStatusData)

    return true
}

/**
 * remove record by date
 *
 * @param {Date} date date
 * @returns {object} count of deleted record by date
 */
async function removeOldRecordsByDate(date) {
    let transactionStartDate = moment(date).format('YYYY-MM-DDT00:00:00')
    let transactionEndDate = moment(date).format('YYYY-MM-DDT23:59:59')

    return await CCBillErrorLog.deleteMany({
        created_at: {
            $gte: transactionStartDate,
            $lte: transactionEndDate
        }
    })
}

module.exports = { removeCCBillErrorLog }
