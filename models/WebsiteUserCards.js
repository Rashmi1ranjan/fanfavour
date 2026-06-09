const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WebsiteUserCards = new Schema({
    user_id: {
        type: Schema.Types.ObjectId
    },
    domain: {
        type: String,
        index: true
    },
    card_id: {
        type: String,
        index: true
    }
}, { timestamps: true })

WebsiteUserCards.index({ user_id: 1, domain: 1, card_id: 1 })

module.exports = mongoose.model('website_user_cards', WebsiteUserCards)
