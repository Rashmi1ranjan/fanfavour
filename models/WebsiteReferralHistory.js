const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteReferralHistorySchema = new Schema({
    domain: {
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
    referral_name: {
        type: String
    },
    referral_name1: {
        type: String
    },
    referral_name2: {
        type: String
    },
    referral_commission: {
        type: String
    },
    referral_commission1: {
        type: String
    },
    referral_commission2: {
        type: String
    },
    target_date: {
        type: Date,
        index: true
    },
    created_at: {
        type: Date
    },
    referral_id: {
        type: Schema.Types.ObjectId
    },
    referral_id1: {
        type: Schema.Types.ObjectId
    },
    referral_id2: {
        type: Schema.Types.ObjectId
    }
})

WebsiteReferralHistorySchema.index({ referral_id: 1, referral_id1: 1, referral_id2: 1, domain: 1 })

module.exports = mongoose.model('WebsiteReferralHistory', WebsiteReferralHistorySchema, 'websitereferralhistory')
