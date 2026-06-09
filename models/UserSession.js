const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSessionSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    // Token: ff_uuidv4()
    access_token: {
        type: String,
        required: true,
        index: true
    },
    refresh_token: {
        type: String,
        index: true
    },
    expires_at: {
        type: Date,
        default: Date.now() + 365 * 24 * 60 * 60 * 1000
    },
    source_domain: {
        type: String
    },
    uuid: {
        type: String
    }
}, { timestamps: true })

UserSessionSchema.index({ user_id: 1, access_token: 1 })

module.exports = mongoose.model('user_session', UserSessionSchema)
