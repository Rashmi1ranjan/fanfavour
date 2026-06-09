const mongoose = require('mongoose')
const Schema = mongoose.Schema

const OptInStatusReportSchema = new Schema({
    bounced: {
        type: Object
    },
    bounced_declined: {
        type: Object
    },
    declined: {
        type: Object
    },
    opt_in: {
        type: Object
    },
    opt_in_link_sent: {
        type: Object
    },
    opt_in_pending: {
        type: Object
    },
    total: {
        type: Object
    },
    website_url: {
        type: String,
        index: true
    },
    created_at: {
        type: Date
    }
})

module.exports = mongoose.model('OptInStatusReport', OptInStatusReportSchema, 'OptInStatusReport')
