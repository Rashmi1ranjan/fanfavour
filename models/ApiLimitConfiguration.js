const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ApiLimitConfigurationSchema = new Schema({
    api_end_point: {
        type: String,
        index: true
    },
    max_attempt: {
        type: Number
    },
    duration: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('ApiLimitConfiguration', ApiLimitConfigurationSchema)
