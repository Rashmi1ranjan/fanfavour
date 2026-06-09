const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TopSpendingUserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true
    },
    subscription_status: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    total_amount_spent: {
        type: Number,
        required: true
    },
    last_seen: {
        type: Date
    }
}, { timestamps: true })

module.exports = mongoose.model('TopSpendingUser', TopSpendingUserSchema)
