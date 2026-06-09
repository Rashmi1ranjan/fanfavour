const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OneSignalAnalytic = new Schema({
    notification_id: {
        type: String,
        require: true
    },
    message: {
        type: String,
        require: true
    },
    from: {
        type: String,
        require: true
    },
    domain: {
        type: String,
        require: true
    },
    onesignal_res: {
        type: Object
    }
}, { timestamps: true })

OneSignalAnalytic.index({ notification_id: 1, domain: 1 })

module.exports = mongoose.model('oneSignal_analytic', OneSignalAnalytic)
