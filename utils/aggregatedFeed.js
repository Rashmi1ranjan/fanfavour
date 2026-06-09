const _ = require('lodash')
const axios = require('axios')
const { generateSignedUrl } = require('./fileUpload')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * Sign url, blur_url and thumbnail_url on a single media object.
 * Returns a new object so the original is not mutated.
 *
 * @param {object} media - media object containing url fields
 * @param {string} cloudfrontUrl - cloudfront url of the domain
 * @param {boolean} isLocked - whether the feed item is locked
 * @param {boolean} isSubscribedToWebsite - whether the item belongs to a subscribed website
 * @param {boolean} isPublicPost - whether the post is public
 * @returns {object} media object with signed urls
 */
const signMediaObject = (media, cloudfrontUrl, isLocked = false, isSubscribedToWebsite = true, isPublicPost = false) => {
    if (_.isEmpty(media)) return media
    const signed = { ...media }
    const shouldSignMedia = isSubscribedToWebsite !== false || isPublicPost === true
    if (shouldSignMedia && signed.url) signed.url = generateSignedUrl(signed.url, true, cloudfrontUrl, true)
    if (shouldSignMedia && signed.thumbnail_url) signed.thumbnail_url = generateSignedUrl(signed.thumbnail_url, true, cloudfrontUrl, true)
    if (isLocked && signed.blur_url) signed.blur_url = generateSignedUrl(signed.blur_url, true, cloudfrontUrl, true)
    return signed
}

/**
 * Walk through each feed item and generate signed URLs for
 * every entry in `media` and for `media_preview`.
 * Uses the `cloudfront_url` stored on each feed item.
 *
 * @param {Array<object>} feed - list of feed items
 * @returns {Array<object>} feed with signed media urls
 */
const signFeedMediaUrls = (feed) => {
    return feed.map((item) => {
        const signedItem = { ...item }
        const cloudfrontUrl = signedItem.cloudfront_url || ''
        const isLocked = signedItem.isLocked === true
        const isSubscribedToWebsite = signedItem.isSubscribedToWebsite !== false
        const isPublicPost = signedItem.public === true
        if (Array.isArray(signedItem.media)) {
            signedItem.media = signedItem.media.map((m) => signMediaObject(m, cloudfrontUrl, isLocked, isSubscribedToWebsite, isPublicPost))
        }
        if (!_.isEmpty(signedItem.media_preview)) {
            signedItem.media_preview = signMediaObject(signedItem.media_preview, cloudfrontUrl, isLocked, isSubscribedToWebsite, isPublicPost)
        }
        return signedItem
    })
}

/**
 * Fetch model profile for each unique domain in the feed via
 * GET /api/app_settings/get-model-profile and attach it as
 * the `user` key on every matching feed item.
 *
 * @param {Array<object>} feed - list of feed items (each must have a `domain` field)
 * @param {string} token - auth token
 * @returns {Promise<Array<object>>} feed with `user` key populated
 */
const attachModelProfiles = async (feed, token) => {
    const uniqueDomains = [...new Set(feed.map((item) => item.domain).filter(Boolean))]
    const profileMap = {}

    await Promise.all(uniqueDomains.map(async (domain) => {
        try {
            const baseUrl = getWebsiteDomain(domain)
            const apiUrl = `${baseUrl}/api/app_settings/get-model-profile-ff`
            const response = await axios.get(apiUrl, {
                headers: { token: token },
                timeout: 5000
            })
            profileMap[domain] = _.get(response, 'data.data.user', null)
        } catch (error) {
            profileMap[domain] = null
        }
    }))

    return feed.map((item) => ({
        ...item,
        user: profileMap[item.domain] || null
    }))
}

module.exports = {
    signMediaObject,
    signFeedMediaUrls,
    attachModelProfiles
}
