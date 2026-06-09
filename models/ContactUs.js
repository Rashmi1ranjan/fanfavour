const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ContactUsSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    subject: {
        type: String
    },
    body: {
        type: String
    },
    domain: {
        type: String,
        index: true
    },
    is_processed: {
        type: Boolean,
        default: false,
        index: true
    },
    processed_by: {
        type: String
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    }
})

module.exports = mongoose.model('contact_us', ContactUsSchema)
