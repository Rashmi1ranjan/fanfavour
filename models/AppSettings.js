const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppSettingsSchema = new Schema({
    sub_account: {
        type: String
    },
    platform_commission: {
        type: Number
    },
    ccbill_charge: {
        type: Number
    }
})

module.exports = AppSettings = mongoose.model('AppSettings', AppSettingsSchema, 'appSettings')
