const mongoose = require('mongoose')
const Schema = mongoose.Schema

const HelpTagsSchema = new Schema({
    title: {
        type: String,
        index: true
    },
    type: {
        type: String,
        index: true,
        default: 'for_help'
    },
    updatedAt: {
        type: Date
    },
    createdAt: {
        type: Date
    }
})

module.exports = mongoose.model('HelpTags', HelpTagsSchema)
