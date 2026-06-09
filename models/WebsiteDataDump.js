const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteDataDump = new Schema({
    domain: {
        type: String,
        unique: true,
        required: true
    },
    data: {
        type: Object
    }
}, { timestamps: true })

module.exports = mongoose.model('website_data_dump', WebsiteDataDump, 'website_data_dump')
