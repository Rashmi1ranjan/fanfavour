const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Create Schema
const UsersCard = new Schema({
    name: {
        type: String
    },
    last_4_digit: {
        type: String
    },
    expiry_date: {
        type: String
    },
    card_type: {
        type: String
    },
    card_id: {
        type: String
    },
    date_added: {
        type: Date
    },
    ip: {
        type: String
    }
})

module.exports = mongoose.model('users_card', UsersCard, 'dump_cards')