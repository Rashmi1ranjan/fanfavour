const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteCronStatus = new Schema({
    domain: {
        type: String,
        require: true
    },
    command_name: {
        type: String
    },
    cron_status: {
        type: String,
        require: true
    },
    updated_user_count: {
        type: String
    },
    target_date: {
        type: Date
    },
    message: {
        type: String
    }
}, { timestamps: true })

WebsiteCronStatus.index({ domain: 1, cron_status: 1, target_date: 1 })

module.exports = mongoose.model('website_cron_status', WebsiteCronStatus)
