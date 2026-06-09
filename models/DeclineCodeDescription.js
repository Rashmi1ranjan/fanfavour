const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DeclineCodeDescriptionSchema = new Schema({
    decline_code: {
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
    },
    link_to_change_card: {
        type: Boolean,
        default: false
    },
    link_text: {
        type: String
    },
    payment_gateway: {
        type: String,
        enum: ['ccbill', 'sticky.io', 'forumpay'],
        default: 'ccbill'
    }
})

DeclineCodeDescriptionSchema.index({ decline_code: 1, payment_gateway: 1 })
module.exports = mongoose.model('DeclineCodeDescription', DeclineCodeDescriptionSchema)
