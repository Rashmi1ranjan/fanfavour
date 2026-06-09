const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteCommissionSchema = new Schema({
    domain: {
        type: String,
        index: true
    },
    platform_commission: {
        type: Number
    },
    ccbill_fees: {
        type: Number
    },
    target_date: {
        type: Date,
        index: true
    },
    updated_at: {
        type: Date
    },
    created_at: {
        type: Date
    },
    payment_gateway: {
        type: String,
        enum : ['ccbill', 'sticky.io', 'forumpay'],
        default: 'ccbill'
    },
    sticky_io_charges: {
        type: Array
    },
    sticky_io_transaction_charge: {
        type: String
    },
    ccbill_transaction_charge: {
        type: String,
        default: '0.15'
    },
    forumpay_transaction_charge: {
        type: String,
        default: '3'
    }
})
module.exports = mongoose.model('WebsiteCommission', WebsiteCommissionSchema, 'websitecommission')
