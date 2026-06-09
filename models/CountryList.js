const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CountryListSchema = new Schema({
    name: {
        type: String
    },
    iso3: {
        type: String
    },
    iso2: {
        type: String
    },
    phone_code: {
        type: String
    },
    is_deleted: {
        type: Boolean
    },
    created_at: {
        type: Date
    }
})

CountryListSchema.index({ iso2: 1 })

module.exports = CountryList = mongoose.model('CountryList', CountryListSchema)
