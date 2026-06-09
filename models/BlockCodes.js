const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const BlockCodeSchema = new Schema({
    code: {
        type: Number,
        required: true
    },
    message: {
        type: String,
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

module.exports = mongoose.model('block_codes', BlockCodeSchema)
