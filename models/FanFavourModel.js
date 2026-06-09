const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FanFavourModel = new Schema({
    model_name: {
        type: String
    },
    likes: {
        type: Number
    },
    image: {
        type: String
    },
    website_url: {
        type: String
    },
    display_order: {
        type: Number
    },
    is_featured_model: {
        type: Boolean,
        default: false
    },
    featured_model_display_order: {
        type: Number
    }
}, { timestamps: true })

module.exports = mongoose.model('fan_favour_models', FanFavourModel)
