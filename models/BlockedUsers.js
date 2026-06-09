const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const BlockedUserSchema = new Schema({
    domain_id: {
        type: Number,
        required: true
    },
    type: {
        type: Number,
        required: true
    },
    field: {
        type: String,
        required: true
    },
    block_code_id: {
        type: Schema.Types.ObjectId,
        ref: 'BlockCodes',
        required: true,
        index: true
    },
    status: {
        type: String,
        required: true
    },
    times_blocked: {
        type: Number,
        default: 0
    },
    source_domain: {
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('blocked_users', BlockedUserSchema)
