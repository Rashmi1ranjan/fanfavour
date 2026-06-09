const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SubscriptionDetailSchema = new Schema({
    recurring_price: {
        type: Number
    },
    initial_price: {
        type: Number
    }
})

const ReSubscriptionOfferDetailSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId
    },
    user_min_active_month: {
        type: Number
    },
    title: {
        type: String
    },
    recurring_price: {
        type: Number
    },
    user_min_amount_spend: {
        type: Number,
        default: 0
    },
    give_free_month_subscription: {
        type: Number
    }
})

const ResubscriptionOfferReport = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: Schema.Types.ObjectId
    },
    email: {
        type: String
    },
    name: {
        type: String
    },
    subscription_payment_gateway: {
        type: String,
        enum: ['ccbill', 'sticky.io', 'forumpay']
    },
    registration_date: {
        type: Date
    },
    subscription_date: {
        type: Date
    },
    total_amount_spent: {
        type: Number
    },
    total_amount_spent_since_last_subscription: {
        type: Number
    },
    subscription_detail: SubscriptionDetailSchema,
    resubscription_offer_detail: ReSubscriptionOfferDetailSchema
}, { timestamps: true })

module.exports = mongoose.model('resubscription_offer_report', ResubscriptionOfferReport)
