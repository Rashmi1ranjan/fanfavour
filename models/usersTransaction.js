const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const UsersTransaction = new Schema({
    user_id: {
        type: Schema.Types.ObjectId
    },
    transaction_for: {
        type: String
    },
    amount: {
        type: String
    },
    transaction_date: {
        type: Date
    },
    payment_gateway: {
        type: String
    },
    description: {
        type: String
    },
    user_ip: {
        type: String
    }
})

module.exports = mongoose.model('users_transaction', UsersTransaction, 'dump_transactions')