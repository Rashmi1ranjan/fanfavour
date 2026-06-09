const WebsiteReferralHistory = require('./../models/WebsiteReferralHistory')
const moment = require('moment')

/**
 * 
 * @returns {boolean} true | false
 */
 async function setTargetDateOfWebsiteReferral() {
    let rows = await WebsiteReferralHistory.find()
    for (let element of rows) {
        const newValues = {
            $set: {
                target_date: moment(element.target_date).startOf('day').toISOString()
            }
        }
        const query = { _id: element._id }
        try {
            await WebsiteReferralHistory.updateOne(query, newValues)
        } catch (error) {
            console.log(error.message)
            return false
        }
    }
    return true
}

module.exports = { setTargetDateOfWebsiteReferral }
