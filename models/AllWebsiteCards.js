const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AllWebsiteCardsSchema = Schema({
    user_id: {
        type: Schema.Types.ObjectId
    },
    card_id: {
        type: String
    },
    card_type: {
        type: String
    },
    card_last_four_digits: {
        type: String
    },
    card_expiration_month_year: {
        type: String
    },
    card_holder_name: {
        type: String
    },
    is_primary: {
        type: Boolean
    },
    subscription_id: {
        type: String
    },
    client_acc_num: {
        type: String
    },
    client_sub_acc: {
        type: String
    },
    ccbill_response: {
        type: Object
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    ip: {
        type: String
    },
    payment_gateway: {
        type: String,
        enum: ['ccbill', 'sticky.io']
    },
    sticky_io_response: {
        type: Object
    },
    sticky_io_order_id: {
        type: String
    },
    country: {
        type: String
    }, // Flag for hybrid payments: card is authorized by primary gateway or not
    by_primary_gateway: {
        type: Boolean,
        default: true
    },
    domain: {
        type: String
    },
    email: {
        type: String
    }
}, { timestamps: true })

AllWebsiteCardsSchema.index({ email: 1, card_id: 1, domain: 1, is_primary: 1 })

AllWebsiteCardsSchema.index({ email: 1, card_id: 1, is_deleted: 1 })

AllWebsiteCardsSchema.index({ is_deleted: 1, card_id: 1 })

AllWebsiteCardsSchema.index({ is_deleted: 1, _id: 1 })

AllWebsiteCardsSchema.index({ email: 1, domain: 1, is_deleted: 1 })

AllWebsiteCardsSchema.index({ _id: 1, email: 1, is_deleted: 1 })

module.exports = mongoose.model('all_website_cards', AllWebsiteCardsSchema)
