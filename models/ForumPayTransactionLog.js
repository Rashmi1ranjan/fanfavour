const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ForumPayTransactionLogSchema = new Schema({
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
    transaction_status: {
        type: String
    },
    forum_pay_response: {
        type: Object
    },
    ip_address: {
        type: String
    },
    is_unique: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

ForumPayTransactionLogSchema.index({ is_recurring: 1, domain: 1, transaction_status: 1 })

module.exports = mongoose.model('forum_pay_transaction_log', ForumPayTransactionLogSchema)
