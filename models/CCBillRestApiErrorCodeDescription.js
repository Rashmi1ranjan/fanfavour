const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CCBillRestApiErrorCodeDescriptionSchema = new Schema({
    ccbill_error_code: {
        type: String
    },
    description: {
        type: String
    },
    error_message: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('CCBillRestApiErrorLogDescription', CCBillRestApiErrorCodeDescriptionSchema)
