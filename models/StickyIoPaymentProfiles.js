const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StickyIoPaymentProfileSchema = new Schema({
    gateway_id: {
        type: String
    },
    gateway_type: {
        type: String
    },
    gateway_provider: {
        type: String
    },
    gateway_alias: {
        type: String
    },
    gateway_created: {
        type: String
    },
    gateway_active: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('StickyIoPaymentProfiles', StickyIoPaymentProfileSchema)
