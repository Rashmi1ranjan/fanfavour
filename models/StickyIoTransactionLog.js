const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StickyIoTransactionLogSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: Schema.Types.ObjectId
    },
    transaction_type: {
        type: String
    },
    is_recurring: {
        type: Boolean
    },
    request_url: {
        type: String
    },
    request_data: {
        type: Object
    },
    transaction_status: {
        type: String
    },
    sticky_io_response: {
        type: Object
    },
    transaction_for: {
        type: String,
        index: true
    },
    ip_address: {
        type: String
    },
    is_unique: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

StickyIoTransactionLogSchema.index({ is_recurring: 1, domain: 1, transaction_status: 1 })
StickyIoTransactionLogSchema.index({ user_id: 1, domain: 1, _id: -1 })
StickyIoTransactionLogSchema.index({ transaction_status: 1, transaction_for: 1, createdAt: 1 })

module.exports = mongoose.model('StickyIoTransactionLog', StickyIoTransactionLogSchema)
