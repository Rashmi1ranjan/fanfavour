const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ForumPayWalletTransactionsReportSchema = new Schema({
    transaction_type: {
        type: String
    },
    transaction_id: {
        type: String,
        index: true
    },
    amount: {
        type: String
    },
    email: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    mst_transaction_date: {
        type: Date
    },
    pcp_transaction_type: {
        type: String
    },
    pcp_user_id: {
        type: String
    },
    pcp_transaction_id: {
        type: String
    },
    website_url: {
        type: String
    },
    tracking_link: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('forum_pay_wallet_transaction_report', ForumPayWalletTransactionsReportSchema)
