const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StickyIoCsvImportLogSchema = new Schema({
    file_name: {
        type: String
    },
    uploaded_by: {
        type: String
    },
    date_of_transactions: {
        type: Array
    },
    file_path: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('StickyIoCsvImportLog', StickyIoCsvImportLogSchema)
