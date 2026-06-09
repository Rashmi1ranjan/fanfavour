const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillTransactionLogSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    card_last_four_digits: {
        type: Number
    },
    card_id: {
        type: String
    },
    name_on_card: {
        type: String
    },
    expire_month: {
        type: Number
    },
    expire_year: {
        type: Number
    },
    address: {
        type: String
    },
    user_id: {
        type: String
    },
    ip: {
        type: String
    },
    api_response: {
        type: Object
    }
}, { timestamps: true })

module.exports = mongoose.model('CCBillTransactionLog', CCBillTransactionLogSchema)
