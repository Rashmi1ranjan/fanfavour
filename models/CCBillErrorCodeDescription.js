const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillErrorCodeDescriptionSchema = new Schema({
    ccbill_error_code: {
        type: String
    },
    description: {
        type: String
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    error_message: {
        type: String
    }
})

module.exports = mongoose.model('CCBillErrorLogDescription', CCBillErrorCodeDescriptionSchema)
