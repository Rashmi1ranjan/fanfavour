const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roomSchema = new Schema({
    coupon_name: {
        type: String,
        required: true
    },
    discount_type: {
        type: String,
        default: 'percentage',
        enum: ['percentage', 'fixed']
    },
    discount_value_for_initial: {
        type: Number,
        default: 0,
        required: true
    },
    discount_value_for_recurring: {
        type: Number,
        default: 0
    },
    user_id: {
        type: Schema.Types.ObjectId
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    ccbill_subscription_status: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    domain: {
        type: String
    },
    amount: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('coupons', roomSchema)
