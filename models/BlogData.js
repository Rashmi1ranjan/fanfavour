const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BlogMediaSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId
    },
    url: {
        type: String
    },
    blur_url: {
        type: String
    },
    thumbnail_url: {
        type: String
    },
    is_process: {
        type: Boolean
    },
    size: {
        type: String
    },
    content_type: {
        type: String
    },
    is_error: {
        type: Boolean
    },
    length: {
        type: Number
    }
}, { _id: false })

const BlogDataSchema = new Schema({
    blog_id: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },
    blogType: {
        type: String
    },
    description: {
        type: String
    },
    model: {
        type: Schema.Types.ObjectId
    },
    public: {
        type: Boolean
    },
    privateBlur: {
        type: Boolean
    },
    processing: {
        type: Boolean
    },
    isLocked: {
        type: Boolean
    },
    amount: {
        type: String
    },
    isDeleted: {
        type: Boolean
    },
    hideFromUser: [
        Schema.Types.ObjectId
    ],
    date: {
        type: Date
    },
    captionBlur: {
        type: Boolean
    },
    blogSubType: {
        type: String
    },
    isPreviewEnable: {
        type: Boolean
    },
    showNumberOfGalleryImage: {
        type: Boolean
    },
    show_content_length: {
        type: Boolean
    },
    total_comments: {
        type: Number
    },
    total_likes: {
        type: Number
    },
    media: {
        type: [BlogMediaSchema],
        default: []
    },
    format: {
        type: String
    },
    udid: {
        type: String
    },
    isReuse: {
        type: Boolean
    },
    content_size: {
        type: Schema.Types.Mixed
    },
    media_preview: {
        type: BlogMediaSchema,
        default: null
    },
    cloudfront_url: {
        type: String
    },
    domain: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true })

BlogDataSchema.index({ domain: 1, blog_id: 1 }, { unique: true })

module.exports = mongoose.model('blog', BlogDataSchema)
