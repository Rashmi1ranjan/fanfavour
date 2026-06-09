const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteSchema = new Schema({
    website_url: {
        type: String,
        index: true,
        unique: true,
        required: true
    },
    subscription_sub_account: {
        type: String
    },
    shop_sub_account: {
        type: String
    },
    tip_sub_account: {
        type: String
    },
    platform_commission: {
        type: String
    },
    ccbill_charge: {
        type: String
    },
    status: {
        type: String
    },
    google_analytics: {
        type: String
    },
    is_cloudfront: {
        type: Boolean
    },
    database_id: {
        type: Schema.Types.ObjectId
    },
    database_name: {
        type: String
    },
    server_id: {
        type: Schema.Types.ObjectId
    },
    model_name: {
        type: String
    },
    model_email: {
        type: String
    },
    created_at: {
        type: Date
    },
    is_referral: {
        type: Boolean,
        default: false
    },
    referral_name: {
        type: String,
        default: ''
    },
    referral_commission: {
        type: String,
        default: ''
    },
    vendor_name: {
        type: String,
        default: ''
    },
    referral_name1: {
        type: String
    },
    referral_commission1: {
        type: String
    },
    referral_name2: {
        type: String
    },
    referral_commission2: {
        type: String
    },
    total_referral: {
        type: Number
    },
    referral_type: {
        type: String,
        default: 'normal'
    },
    referral_type1: {
        type: String,
        default: 'normal'
    },
    referral_type2: {
        type: String,
        default: 'normal'
    },
    first_subscription_date: {
        type: Date,
        index: true
    },
    website_id: {
        type: Number,
        index: true
    },
    payment_gateway: {
        type: String,
        enum: ['ccbill', 'sticky.io', 'hybrid'],
        default: 'ccbill',
        index: true
    },
    sticky_io_campaign_id: {
        type: String,
        index: true
    },
    tag: [{
        type: String
    }],
    recaptcha_website_id: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    setup_date: {
        type: String
    },
    lunch_date: {
        type: String
    },
    bring_down_date: {
        type: String
    },
    is_crypto_payment_enabled: {
        type: Boolean,
        default: false,
        index: true
    },
    monthly_earning: {
        type: Number
    },
    sso_secret: {
        type: String
    }
})

WebsiteSchema.index({ website_url: 1, status: 1, is_crypto_payment_enabled: 1, monthly_earning: 1, server_id: 1, database_id: 1, tag: 1, sticky_io_campaign_id: 1, subscription_sub_account: 1, payment_gateway: 1 })
module.exports = mongoose.model('Website', WebsiteSchema)
