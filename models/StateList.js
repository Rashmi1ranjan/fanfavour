const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StateListSchema = new Schema({
    name: {
        type: String
    },
    country_id: {
        type: Schema.Types.ObjectId,
        ref: 'CountryList',
        index: true
    },
    state_code: {
        type: String
    },
    is_deleted: {
        type: Boolean
    },
    created_at: {
        type: Date
    }
})

StateListSchema.index({ state_code: 1 })

module.exports = StateList = mongoose.model('StateList', StateListSchema)
