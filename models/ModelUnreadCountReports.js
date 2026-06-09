const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ModelUnreadCountReportsSchema = new Schema({
    domain: {
        type: String
    },
    model_unread_counts: {
        type: Number
    },
    unique_users_unread: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('reports_model_unread_count', ModelUnreadCountReportsSchema)
