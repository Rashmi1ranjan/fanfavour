const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FeaturedModelTextSchema = new Schema({
    featured_model_text: {
        type: String,
        default: '🔥 Hot'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('featuredModelText', FeaturedModelTextSchema, 'featuredModelText')
