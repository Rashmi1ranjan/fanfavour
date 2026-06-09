const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String
    },
    jwtSecret: {
        type: String
    },
    is_mfa_enabled: {
        type: Boolean,
        default: false
    },
    mfa_secret: {
        type: String
    },
    referral_id: {
        type: String,
        default: ''
    },
    referral_links: [{
        type: Schema.Types.ObjectId,
        ref: 'LinkTrackingReferrals'
    }],
    is_deleted: {
        type: Boolean,
        default: false
    }
})

UserSchema.index({ role: 1, is_deleted: 1, referral_links: 1 })
UserSchema.index({ _id: 1, is_deleted: 1 })
UserSchema.index({ email: 1, is_deleted: 1 })

module.exports = mongoose.model('users', UserSchema)
