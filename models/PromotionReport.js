const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PromotionReportSchema = new Schema({
    website_url: {
        type: String
    },
    promotion_id: {
        type: String
    },
    promotion_info: {
        type: String
    },
    start_date: {
        type: Date
    },
    duration: {
        type: String
    },
    discount: {
        type: String
    },
    promo_message: {
        type: String
    },
    number_of_transaction: {
        type: String
    },
    revenue: {
        type: String
    },
    registration: {
        type: String
    },
    promotion_type: {
        type: String
    },
    applicable_to: {
        type: String
    },
    created_at: {
        type: Date
    }
})

PromotionReportSchema.index({ promotion_type: 1, applicable_to: 1 })

module.exports = mongoose.model('PromotionReport', PromotionReportSchema)
