const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DatabaseSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    monthly_earning: {
        type: Number,
        index: true
    },
    created_at: {
        type: Date
    }
})

module.exports = Database = mongoose.model('Database', DatabaseSchema)
