const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UniversalLoginEventLogs = Schema({
    domain: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    event: {
        type: String,
        require: true
    },
    meta: {
        type: Object,
        require: true
    }
}, { timestamps: true })

UniversalLoginEventLogs.index({ createdAt: 1, email: 1, domain: 1, event: 1 })

module.exports = mongoose.model('universal_login_event_logs', UniversalLoginEventLogs)
