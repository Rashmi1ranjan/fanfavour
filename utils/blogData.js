const _ = require('lodash')

const blogPayloadFields = [
    'blogType',
    'description',
    'model',
    'public',
    'privateBlur',
    'processing',
    'isLocked',
    'amount',
    'isDeleted',
    'hideFromUser',
    'date',
    'captionBlur',
    'blogSubType',
    'isPreviewEnable',
    'showNumberOfGalleryImage',
    'show_content_length',
    'total_comments',
    'total_likes',
    'media',
    'format',
    'udid',
    'isReuse',
    'content_size',
    'media_preview',
    'cloudfront_url',
    'domain'
]

/**
 * Build a normalized payload for storing or updating blog data.
 *
 * @param {object} body Request body blog object
 * @param {boolean} includeBlogId Include `blog_id` in the returned payload
 * @returns {object} Normalized blog payload
 */
function getBlogPayload(body, includeBlogId = false) {
    const payload = {}

    if (includeBlogId === true && _.has(body, 'blog_id')) {
        payload.blog_id = _.get(body, 'blog_id')
    }

    blogPayloadFields.forEach((field) => {
        if (_.has(body, field)) {
            payload[field] = _.get(body, field)
        }
    })

    return payload
}

/**
 * Build a normalized blog unlock payload from the grouped website request object.
 *
 * @param {object} body Request body blog unlock object
 * @returns {object} Normalized blog unlock payload
 */
function getBlogUnlockPayload(body) {
    const userIdObject = _.get(body, 'user_id_object', '')
    const domain = _.get(body, 'domain', '')
    const blogIdObjects = _.get(body, 'blog_id_objects', [])

    if (Array.isArray(blogIdObjects) !== true) {
        return {
            user_id_object: userIdObject,
            domain: domain,
            blog_id_objects: []
        }
    }

    return {
        user_id_object: userIdObject,
        domain: domain,
        // Keep the incoming array shape, but remove duplicates while preserving order.
        blog_id_objects: Array.from(new Set(blogIdObjects))
    }
}

module.exports = { getBlogPayload, getBlogUnlockPayload }
