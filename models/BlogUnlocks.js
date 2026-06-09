const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BlogUnlocksLogSchema = new Schema({
    user_id_object: {
        type: Schema.Types.ObjectId,
        index: true
    },
    domain: {
        type: String,
        required: true,
        index: true
    },
    blog_id_objects: {
        type: [Schema.Types.ObjectId],
        default: []
    }
}, { timestamps: true })

BlogUnlocksLogSchema.index({ domain: 1, user_id_object: 1 }, { unique: true })
BlogUnlocksLogSchema.index({ domain: 1, blog_id_objects: 1 })
module.exports = mongoose.model('BlogUnlocks', BlogUnlocksLogSchema)
