const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotesSchema = new Schema({
    note: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

const AllWebsiteUsersSchema = Schema({
    name: {
        type: String
    },
    domain: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    old_email: {
        type: String
    },
    password: {
        type: String,
        require: true
    },
    total_amount_spent: {
        type: Number
    },
    default_payment_method: {
        type: String,
        default: 'credit_card',
        enum: ['credit_card', 'crypto_currency']
    },
    payment_gateway: {
        type: String
    },
    is_blocked: {
        type: Boolean
    },
    is_deleted: {
        type: Boolean
    },
    is_previously_universal_user: {
        type: Boolean,
        default: false
    },
    notes: [NotesSchema]
}, { timestamps: true })

AllWebsiteUsersSchema.index({ email: 1, domain: 1 })
AllWebsiteUsersSchema.index({ email: 1, is_blocked: 1, is_deleted: 1, domain: 1 })

module.exports = mongoose.model('all_website_users', AllWebsiteUsersSchema)
