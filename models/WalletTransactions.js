const mongoose = require('mongoose')
const Schema = mongoose.Schema
const moment = require('moment-timezone')

const transactionInfoSchema = new Schema({
    crypto_currency: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    payment_id: {
        type: String,
        default: ''
    },
    transaction_for: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    pos_id: {
        type: String,
        default: ''
    },
    content_id: {
        type: String
    },
    content_type: {
        type: String,
        enum: ['subscription', 'tips', 'chat', 'rebill', 'blog', 'add_fund', 'chat_pay_per_message']
    },
    is_confirm_by_cron: {
        type: Boolean,
        default: false
    },
    is_user_universal: {
        type: Boolean,
        default: false
    }
})

const WalletTransactionSchema = new Schema({
    domain: {
        type: String
    },
    user_id: {
        type: Schema.Types.ObjectId
    },
    email: {
        type: String,
        require: true
    },
    transaction_type: {
        type: String,
        enum: ['credit', 'debit']
    },
    amount: {
        type: Number
    },
    transaction_status: {
        type: String,
        enum: ['processing', 'success', 'failed'],
        default: 'processing'
    },
    pcp_transaction_id: {
        type: Schema.Types.ObjectId
    },
    ip_address: {
        type: String
    },
    transaction_info: transactionInfoSchema,
    forumpay_response: {
        type: Object
    },
    is_ignore: {
        type: Boolean,
        default: false
    },
    wallet_transaction_status: {
        type: String,
        enum: ['pending', 'success', 'failed', 'region_error', 'error'],
        default: 'pending'
    },
    mst_created_date: {
        type: Date,
        default: () => moment().tz('America/Phoenix').format('YYYY-MM-DDTHH:mm:ss')
    },
    is_universal_user: {
        type: Boolean,
        default: false
    },
    tracking_link: {
        type: String
    }
}, { timestamps: true })

WalletTransactionSchema.index({ domain: 1, email: 1, user_id: 1, transaction_status: 1  })
WalletTransactionSchema.index({ transaction_status: 1, transaction_type: 1, wallet_transaction_status: 1, domain: 1, createdAt: 1  })

module.exports = mongoose.model('wallet_transactions', WalletTransactionSchema)
