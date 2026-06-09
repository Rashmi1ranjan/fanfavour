const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillRestApiOauthErrorLogSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: String
    },
    email: {
        type: String
    },
    ccbill_url: {
        type: String
    },
    ccbill_error_message: {
        type: String
    },
    ccbill_error_code: {
        type: String
    },
    ccbill_response: {
        type: Object
    }
}, { timestamps: true })

module.exports = mongoose.model('CCBillRestApiOauthErrorLog', CCBillRestApiOauthErrorLogSchema)
