const _ = require('lodash')
const moment = require('moment')
const WebsiteCronStatus = require('../models/WebsiteCronStatus')

/**
 * Add cron status log to monitoring crons
 *
 * @param {object} data Command Details
 * @param {string} data.domain Domain name
 * @param {string} data.command_name Command Name
 * @param {string} data.cron_status Cron status
 * @param {string} data.updated_user_count Updated users
 * @param {string} data.target_date Command target date
 * @param {string} data.message Cron note
 */
async function addCronStatusLog(data) {
    try {
        let todayDate = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
        let target_date = _.get(data, 'target_date', new Date(todayDate))

        const cronStatusData = {
            domain: _.get(data, 'domain', ''),
            command_name: _.get(data, 'command_name', ''),
            cron_status: _.get(data, 'cron_status', ''),
            updated_user_count: 'NA',
            target_date: target_date,
            message: _.get(data, 'message', '')
        }
        const websiteCronStatus = new WebsiteCronStatus(cronStatusData)
        await websiteCronStatus.save()
        console.log(websiteCronStatus)
        return
    } catch (error) {
        console.log(error)
        return
    }
}

/**
 * Clean 15 days ago records of website cron logs
 */
async function cleanOldCronLogs() {
    const endDate = moment().subtract(15, 'days').format('YYYY-MM-DDT23:59:59.000+00:00')
    const res = await WebsiteCronStatus.deleteMany({ target_date: { $lte: endDate } })
    console.log(`Deleted ${res.deletedCount} document out of ${res.deletedCount}`)

}

module.exports = { addCronStatusLog, cleanOldCronLogs }
