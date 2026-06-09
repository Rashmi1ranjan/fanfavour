const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WalletBalanceSchema = new Schema({
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
    amount: {
        type: Number
    },
    universal_wallet: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

WalletBalanceSchema.index({ domain: 1, email: 1, user_id: 1 })

module.exports = mongoose.model('wallet_balance', WalletBalanceSchema)
