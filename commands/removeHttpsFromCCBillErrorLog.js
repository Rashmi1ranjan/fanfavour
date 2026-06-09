const CCBillErrorLog = require('./../models/CCBillErrorLog')

/**
 * @description Remove HTTPS from ccbill error log
 */
async function removeHttpsFromCCBillErrorLog() {
    try {
        const totalLogs = await CCBillErrorLog.countDocuments()
        const limit = 200
        const totalPage = Math.ceil(totalLogs / limit)
        let processedRecords = 0
        for (let page = 1; page <= totalPage; page++) {
            const offset = limit * (page - 1)
            const logs = await CCBillErrorLog.find({}).skip(offset).limit(limit)
            for (const log of logs) {
                const domain = new URL(log.domain)
                const updateLog = {
                    domain: domain.hostname
                }
                await CCBillErrorLog.findByIdAndUpdate(log._id, updateLog)
            }
            processedRecords = processedRecords + logs.length
            console.log('Records Processed:', `${processedRecords}/${totalLogs}`)
        }
    } catch (error) {
        console.log('Error in log update', error)
    }
}

module.exports = { removeHttpsFromCCBillErrorLog }
