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

const EmailSchema = new Schema({
    email: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

const UniversalUsersSchema = Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    },
    source_domain: {
        type: String
    },
    universal_login_merged_domains: {
        type: Array
    },
    wallet_amount: {
        type: Number
    },
    old_email: [EmailSchema],
    default_payment_method: {
        type: String,
        default: 'credit_card',
        enum: ['credit_card', 'crypto_currency']
    },
    payment_gateway: {
        type: String
    },
    card_id: {
        type: String
    },
    notes: [NotesSchema],
    last_used_crypto_currency: {
        type: String
    },
    user_deleted_domains: {
        type: Array
    },
    user_blocked_domains: {
        type: Array
    },
    is_blocked: {
        type: Boolean
    },
    universal_login_website_details: [{
        domain: { type: String },
        subscription_status: { type: Boolean },
        is_subscribed_ever: { type: Boolean },
        ccbill_subscription_status: { type: String },
        user_id: { type: Schema.Types.ObjectId }
    }],
    avatar_url: {
        type: String
    }
}, { timestamps: true })

UniversalUsersSchema.pre('save', function (next) {
    if (Array.isArray(this.universal_login_merged_domains)) {
        this.universal_login_merged_domains = [...new Set(this.universal_login_merged_domains.filter(Boolean))]
    }

    if (Array.isArray(this.universal_login_website_details)) {
        const uniqueWebsiteDetails = new Map()
        for (const detail of this.universal_login_website_details) {
            if (detail && detail.domain) {
                uniqueWebsiteDetails.set(detail.domain, detail)
            }
        }
        this.universal_login_website_details = Array.from(uniqueWebsiteDetails.values())
    }

    next()
})

UniversalUsersSchema.index({ email: 1, universal_login_merged_domains: 1 })

module.exports = mongoose.model('universal_users', UniversalUsersSchema)
