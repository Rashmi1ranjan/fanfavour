const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionApiQueueSchema = new Schema({
    start_date_timestamp: {
        type: String
    },
    end_date_timestamp: {
        type: String
    }
})

module.exports = TransactionApiQueue = mongoose.model('TransactionApiQueue', TransactionApiQueueSchema, 'transactionapiqueue')
