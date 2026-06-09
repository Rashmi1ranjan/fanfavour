const CCBillRestApiAddCardLog = require('./../models/CCBillRestApiAddCardLog')
const mongoose = require('mongoose')

/**
 * @description Update is_unique flag for rest api card log
 */
async function updateIsUniqueFlagForCCBillAddCardLog() {
    try {
        const totalLogs = await CCBillRestApiAddCardLog.countDocuments()
        const limit = 200
        const totalPage = Math.ceil(totalLogs / limit)
        let processedRecords = 0

        for (let page = 1; page <= totalPage; page++) {
            const offset = limit * (page - 1)
            const logs = await CCBillRestApiAddCardLog.find({}).skip(offset).limit(limit)
            for (const log of logs) {
                // update current log
                await CCBillRestApiAddCardLog.findByIdAndUpdate(log._id, { is_unique: true })
                // if old record found on same email, domain and from_subscription then update flag is_unique to false
                const query = {
                    email: log.email,
                    domain: log.domain,
                    from_subscription: log.from_subscription,
                    _id: { $ne: new mongoose.Types.ObjectId(log._id) }
                }
                await CCBillRestApiAddCardLog.updateMany(query, { is_unique: false })
            }
            processedRecords = processedRecords + logs.length
            console.log('Records Processed:', `${processedRecords}/${totalLogs}`)
        }
    } catch (error) {
        console.log('Error in request processing', error)
    }
}

module.exports = { updateIsUniqueFlagForCCBillAddCardLog }
