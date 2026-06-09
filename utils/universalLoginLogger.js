const UniversalLoginEventLogs = require('../models/UniversalLoginEventLogs')

/**
 * @description Add log for universal login
 *
 * @param {string} email user email
 * @param {string} event event name
 * @param {string} domain source domain
 * @param {object} meta event details
 */
async function addUniversalLog(email, event, domain, meta) {
    try {
        const eventLog = new UniversalLoginEventLogs({ email, event, domain, meta })
        await eventLog.save()
    } catch (error) {
        console.log('==================== Their was a problem while adding universal log ====================')
        console.log(error)
    }
}


module.exports = {
    addUniversalLog
}
