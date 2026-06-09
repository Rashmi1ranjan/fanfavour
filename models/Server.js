const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServerSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    monthly_earning: {
        type: Number,
        index: true
    },
    ip_address: {
        type: String
    },
    created_at: {
        type: Date
    }
})

module.exports = Server = mongoose.model('Server', ServerSchema)
