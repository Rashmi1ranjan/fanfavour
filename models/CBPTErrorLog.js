const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CBPTErrorLogSchema = new Schema({
    url: {
        type: String
    },
    domain: {
        type: String,
        index: true
    },
    is_processed: {
        type: Boolean,
        index: true
    },
    status: {
        type: String,
        index: true
    },
    failure_reason: {
        type: String
    },
    response: {
        type: String
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
})

module.exports = CBPTErrorLog = mongoose.model('CBPTErrorLog', CBPTErrorLogSchema)
