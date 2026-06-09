const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SSOTempTokenSchema = new Schema({
    email: {
        type: String,
        index: true
    },
    token: {
        type: String,
        index: true
    },
    token_hash: {
        type: String
    },
    expires_at: {
        type: Date,
        default: () => Date.now() + 1 * 1 * 1 * 60 * 1000
    },
    source_domain: {
        type: String
    },
    uuid: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('sso_temp_tokens', SSOTempTokenSchema)
