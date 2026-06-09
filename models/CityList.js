const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CityListSchema = new Schema({
    name: {
        type: String
    },
    country_id: {
        type: Schema.Types.ObjectId,
        ref: 'CountryList',
        index: true
    },
    state_id: {
        type: Schema.Types.ObjectId,
        ref: 'StateList',
        index: true
    },
    is_deleted: {
        type: Boolean
    },
    created_at: {
        type: Date
    }
})

module.exports = CityList = mongoose.model('CityList', CityListSchema)
