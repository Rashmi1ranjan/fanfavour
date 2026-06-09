const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteReferralDailyEarningReportSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    target_date: {
        type: Date,
        index: true
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
        type: Number
    },
    ccbill_commission: {
        type: Number
    },
    subscription_amount: {
        type: Number
    },
    subscription_refund_amount: {
        type: Number
    },
    subscription_chargeback_amount: {
        type: Number
    },
    subscription_chargeback_count: {
        type: Number
    },
    subscription_void_amount: {
        type: Number
    },
    shop_amount: {
        type: Number
    },
    shop_refund_amount: {
        type: Number
    },
    shop_chargeback_amount: {
        type: Number
    },
    shop_chargeback_count: {
        type: Number
    },
    shop_void_amount: {
        type: Number
    },
    tip_amount: {
        type: Number
    },
    tip_refund_amount: {
        type: Number
    },
    tip_chargeback_amount: {
        type: Number
    },
    tip_chargeback_count: {
        type: Number
    },
    tip_void_amount: {
        type: Number
    },
    gross_revenue: {
        type: Number
    },
    gross_refund: {
        type: Number
    },
    chargeback_amount: {
        type: Number
    },
    chargeback_count: {
        type: Number
    },
    chargeback_penalty: {
        type: Number
    },
    refund_amount: {
        type: Number
    },
    void_amount: {
        type: Number
    },
    net_revenue: {
        type: Number
    },
    ccbill_charge: {
        type: Number
    },
    revenue_collected: {
        type: Number
    },
    platform_earning: {
        type: Number
    },
    model_earning: {
        type: Number
    },
    updated_at: {
        type: Date
    },
    referral_history_id: {
        type: Schema.Types.ObjectId
    },
    referral_amount: {
        type: Number
    },
    referral_amount1: {
        type: Number
    },
    referral_amount2: {
        type: Number
    },
    created_at: {
        type: Date
    },
    payment_gateway: {
        type: String,
        default: 'ccbill'
    },
    sticky_io_campaign_id: {
        type: String
    },
    sticky_io_commission: {
        type: Number
    },
    sticky_io_charge: {
        type: Number
    },
    declined_count: {
        type: Number
    },
    declined_charges: {
        type: Number
    },
    fixed_sticky_io_commission: {
        type: Number
    },
    fixed_sticky_io_charge: {
        type: Number
    },
    fixed_model_earning: {
        type: Number
    },
    fixed_platform_earning: {
        type: Number
    },
    revenue_collected_after_fixed_charge: {
        type: Number
    },
    referral_amount_for_fixed_charge: {
        type: Number
    },
    referral_amount1_for_fixed_charge: {
        type: Number
    },
    referral_amount2_for_fixed_charge: {
        type: Number
    },
    gateway_charges: {
        type: Array
    },
    sticky_io_transaction_charge: {
        type: Number
    },
    sticky_io_payment_gateway: {
        type: String
    },
    total_transaction_count: {
        type: Number
    },
    sticky_io_transaction_cost: {
        type: Number
    },
    forumpay_transaction_commission: {
        type: Number
    },
    forumpay_transaction_charge: {
        type: Number
    },
    subscription_count: {
        type: Number
    },
    subscription_refund_count: {
        type: Number
    },
    subscription_void_count: {
        type: Number
    },
    shop_count: {
        type: Number
    },
    shop_refund_count: {
        type: Number
    },
    shop_void_count: {
        type: Number
    },
    tip_count: {
        type: Number
    },
    tip_refund_count: {
        type: Number
    },
    tip_void_count: {
        type: Number
    },
    fixed_mg_fees: {
        type: Number
    },
    link_tracking_referral_history_id: {
        type: Schema.Types.ObjectId
    }
})

WebsiteReferralDailyEarningReportSchema.index({ domain: 1, payment_gateway: 1, target_date: 1 })
module.exports = mongoose.model('WebsiteReferralDailyEarningReport', WebsiteReferralDailyEarningReportSchema, 'websitereferraldailyearningreport')
