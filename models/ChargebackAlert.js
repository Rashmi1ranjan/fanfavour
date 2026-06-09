const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ChargeBackAlertSchema = new Schema({
    alert_type: {
        type: String,
        index: true
    },
    query: {
        type: Object
    },
    body: {
        type: Object
    },
    is_processed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('ChargeBackAlert', ChargeBackAlertSchema)
