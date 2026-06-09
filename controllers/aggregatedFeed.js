const express = require('express')
const router = express.Router()
const _ = require('lodash')
const UniversalUsersSchema = require('../models/UniversalUsers')
const BlogData = require('../models/BlogData')
const BlogUnlocks = require('../models/BlogUnlocks')
const { safeGet, safeHGet, safeHset } = require('../utils/redis.util')
const { successResponse, errorResponseWithHTTPStatus } = require('../utils')
const { signFeedMediaUrls, attachModelProfiles } = require('../utils/aggregatedFeed')
const {
    HTTP_UNAUTHORIZED_401,
    HTTP_BAD_REQUEST_400,
    HTTP_INTERNAL_SERVER_ERROR_500,
    HTTP_OK_200
} = require('../utils/http.status')

/**
 * Apply subscription-based presentation rules to a blog item.
 *
 * @param {object} blog blog item
 * @param {boolean} isSubscribedDomain whether the domain is subscribed
 * @returns {object} updated blog item
 */
const applySubscriptionFeedRules = (blog, isSubscribedDomain) => {
    if (!blog || isSubscribedDomain !== true) {
        return {
            ...blog,
            isSubscribedToWebsite: false,
            // Non-public posts should be locked when the user is not subscribed
            isLocked: blog && blog.public !== true ? true : (blog ? blog.isLocked : false)
        }
    }

    return {
        ...blog,
        captionBlur: false,
        isSubscribedToWebsite: true
    }
}

const NON_SUBSCRIBED_FEED_CACHE_KEY = 'blogs:non_subscribed_users'
const NON_SUBSCRIBED_FEED_CACHE_TTL_SECONDS = 2 * 60 * 60

const isDeletedVisibleForUser = (blog, unlockedBlogIds) => {
    if (blog?.isDeleted !== true) return true
    const blogIdStr = blog?.blog_id?.toString() || blog?._id?.toString()
    return blogIdStr ? unlockedBlogIds.has(blogIdStr) : false
}

const getUnlockAwareLockStatus = (blog, unlockedBlogIds) => {
    const blogIdStr = blog?.blog_id?.toString() || blog?._id?.toString()
    const isUnlocked = blogIdStr ? unlockedBlogIds.has(blogIdStr) : false
    return Boolean(blog?.isLocked) && !isUnlocked
}

const stripTopLevelId = (blog) => {
    if (!blog || typeof blog !== 'object') return blog
    const rest = { ...blog }
    delete rest._id
    return rest
}

const serializeNonSubscribedFeed = (feed) => {
    const cachePayload = {}

    feed.forEach((blog) => {
        const blogId = blog?.blog_id?.toString() || blog?._id?.toString()
        if (!blogId) return
        cachePayload[blogId] = JSON.stringify(stripTopLevelId(blog))
    })

    return cachePayload
}

const readNonSubscribedFeedCache = async () => {
    const cachedFeed = await safeHGet(NON_SUBSCRIBED_FEED_CACHE_KEY)
    if (!cachedFeed || typeof cachedFeed !== 'object' || Object.keys(cachedFeed).length === 0) {
        return []
    }

    return Object.entries(cachedFeed)
        .map(([, value]) => {
            try {
                return JSON.parse(value)
            } catch (error) {
                return null
            }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * @description Get aggregated feed for the authenticated user.
 * Accepts `page` and `limit` query params for pagination.
 *
 * @param {object} req - HTTP request
 * @param {object} res - HTTP response
 * @returns {Promise<object>} API response with paginated feed
 */
router.get('/', async (req, res) => {
    try {
        const token = _.get(req, 'headers.token', '')
        if (_.isEmpty(token)) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const userSession = await safeHGet(`sso:user_session:${token}`)
        if (_.isEmpty(userSession) || !userSession.email) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const user = await UniversalUsersSchema.findOne({ email: userSession.email }).lean()
        if (!user) {
            return errorResponseWithHTTPStatus(res, { error: 'Invalid request' }, 'Bad Request', HTTP_BAD_REQUEST_400)
        }

        const page = Math.max(parseInt(_.get(req, 'query.page_num', 1), 10) || 1, 1)
        const limit = 20
        const skip = (page - 1) * limit

        const subscribedDomainsMap = new Map()
        if (user) {
            const websiteDetails = Array.isArray(user.universal_login_website_details) ? user.universal_login_website_details : []
            websiteDetails.forEach((w) => {
                if (w && (w.subscription_status === true || String(w.subscription_status).toLowerCase() === 'true')) {
                    if (w.domain) {
                        subscribedDomainsMap.set(w.domain, w.user_id)
                    }
                }
            })
        }

        const subscribedDomains = Array.from(subscribedDomainsMap.keys())
        const allUserIdsOnDomains = Array.from(subscribedDomainsMap.values())
        const isSubscribedEver = subscribedDomains.length > 0

        if (subscribedDomains.length === 0) {
            const cachedFeed = await readNonSubscribedFeedCache()
            if (cachedFeed.length > 0) {
                const totalFeed = cachedFeed.length
                const totalPages = Math.ceil(totalFeed / limit)
                const feed = await attachModelProfiles(
                    signFeedMediaUrls(cachedFeed.map((blog) => applySubscriptionFeedRules(blog, false))),
                    token
                )

                return successResponse(
                    res,
                    {
                        feed,
                        page: 1,
                        limit,
                        totalFeed,
                        totalPages,
                        hasNextPage: totalPages > 1,
                        is_subscribed_ever: isSubscribedEver
                    },
                    'Feed fetched successfully',
                    HTTP_OK_200
                )
            }

            const currentDateAndTime = new Date()
            const match = {
                processing: false,
                isError: { $ne: true },
                date: { $lt: currentDateAndTime },
                $or: [
                    { contentLeftForProcessing: { $exists: false } },
                    { contentLeftForProcessing: { $eq: 0 } }
                ],
                isDeleted: { $ne: true }
            }

            const aggregate = [
                { $match: match },
                { $sort: { date: -1 } },
                { $limit: limit }
            ]

            let dbFeed = await BlogData.aggregate(aggregate)
            const totalCountResult = await BlogData.aggregate([
                { $match: match },
                { $count: 'total' }
            ])

            const totalFeed = _.get(totalCountResult, '[0].total', 0)
            const totalPages = Math.ceil(totalFeed / limit)

            await safeHset(
                NON_SUBSCRIBED_FEED_CACHE_KEY,
                serializeNonSubscribedFeed(dbFeed),
                NON_SUBSCRIBED_FEED_CACHE_TTL_SECONDS
            )

            dbFeed = dbFeed.map((blog) => applySubscriptionFeedRules(blog, false))
            dbFeed = signFeedMediaUrls(dbFeed)
            dbFeed = await attachModelProfiles(dbFeed)

            return successResponse(
                res,
                {
                    feed: dbFeed,
                    page: 1,
                    limit,
                    totalFeed,
                    totalPages,
                    hasNextPage: totalPages > 1,
                    is_subscribed_ever: isSubscribedEver
                },
                'Feed fetched successfully',
                HTTP_OK_200
            )
        }

        const unlockedBlogIds = new Set()
        await Promise.all(
            Array.from(subscribedDomainsMap.entries()).map(async ([domain, userId]) => {
                if (!userId) return
                try {
                    const redisKey = `blog_unlocks:${domain}:${userId}`
                    const redisUnlocksStr = await safeGet(redisKey)
                    let unlocksArray = []

                    if (redisUnlocksStr) {
                        const parsed = JSON.parse(redisUnlocksStr)
                        if (Array.isArray(parsed)) {
                            unlocksArray = parsed
                        } else if (parsed && Array.isArray(parsed.blog_id_objects)) {
                            unlocksArray = parsed.blog_id_objects
                        }
                    } else {
                        const dbUnlocks = await BlogUnlocks.findOne({ domain, user_id_object: userId }).lean()
                        if (dbUnlocks && Array.isArray(dbUnlocks.blog_id_objects)) {
                            unlocksArray = dbUnlocks.blog_id_objects
                        }
                    }

                    unlocksArray.forEach(id => {
                        if (id) unlockedBlogIds.add(id.toString())
                    })
                } catch (error) {
                    console.log(`Failed to fetch unlocks for domain ${domain} user ${userId}`, error)
                }
            })
        )

        let feed = []
        let redisSuccess = true

        try {
            const currentDateAndTime = new Date()
            for (const domain of subscribedDomains) {
                const blogDataStr = await safeGet(`blogs:${domain}`)
                if (blogDataStr) {
                    let blogData = JSON.parse(blogDataStr)
                    if (Array.isArray(blogData)) {
                        const userIdOnDomain = subscribedDomainsMap.get(domain)
                        blogData = blogData.filter(blog => {
                            // Apply match conditions from user snippet
                            if (blog.processing === true) return false
                            if (blog.isError === true) return false
                            if (new Date(blog.date) >= currentDateAndTime) return false
                            if (blog.contentLeftForProcessing !== undefined && blog.contentLeftForProcessing !== 0) return false

                            // hideFromUser check
                            if (userIdOnDomain && blog.hideFromUser && Array.isArray(blog.hideFromUser)) {
                                if (blog.hideFromUser.some(id => id.toString() === userIdOnDomain.toString())) return false
                            }

                            // isDeleted check
                            if (!isDeletedVisibleForUser(blog, unlockedBlogIds)) {
                                return false
                            }
                            return true
                        })
                        feed = feed.concat(blogData)
                    }
                } else {
                    redisSuccess = false
                }
            }
        } catch (error) {
            redisSuccess = false
        }

        if (redisSuccess && feed.length > 0) {
            feed.sort((a, b) => new Date(b.date) - new Date(a.date))
            const totalFeed = feed.length
            const totalPages = Math.ceil(totalFeed / limit)
            feed = feed.slice(skip, skip + limit)
            feed = feed.map((blog) => applySubscriptionFeedRules(blog, true))
            feed = signFeedMediaUrls(feed)
            feed = await attachModelProfiles(feed, token)

            feed = feed.map((blog) => {
                return {
                    ...blog,
                    isLocked: getUnlockAwareLockStatus(blog, unlockedBlogIds)
                }
            })
            return successResponse(
                res,
                {
                    feed,
                    page,
                    limit,
                    totalFeed,
                    totalPages,
                    hasNextPage: page < totalPages,
                    is_subscribed_ever: isSubscribedEver
                },
                'Feed fetched successfully',
                HTTP_OK_200
            )
        }

        const currentDateAndTime = new Date()
        let match = {
            processing: false,
            isError: { $ne: true },
            date: { $lt: currentDateAndTime },
            $or: [
                { contentLeftForProcessing: { $exists: false } },
                { contentLeftForProcessing: { $eq: 0 } }
            ]
        }

        // Adapt to multiple domains by checking if any of the user's IDs are in the hide list
        if (allUserIdsOnDomains.length > 0) {
            match.hideFromUser = { $nin: allUserIdsOnDomains }
        }
        // Also restrict to subscribed domains
        match.domain = { $in: subscribedDomains }

        const aggregate = [{
            $match: match
        },
        {
            $sort: {
                'date': -1
            }
        }]

        // Add pagination to aggregation
        aggregate.push({ $skip: skip }, { $limit: limit })

        let dbFeed = await BlogData.aggregate(aggregate)
        dbFeed = dbFeed.filter((blog) => isDeletedVisibleForUser(blog, unlockedBlogIds))

        // For total count (optional but good for pagination response)
        const totalCountResult = await BlogData.aggregate([
            { $match: match },
            { $count: 'total' }
        ])
        const totalFeed = _.get(totalCountResult, '[0].total', 0)
        const totalPages = Math.ceil(totalFeed / limit)

        dbFeed = dbFeed.map((blog) => applySubscriptionFeedRules(blog, true))
        dbFeed = signFeedMediaUrls(dbFeed)
        dbFeed = await attachModelProfiles(dbFeed)

        dbFeed = dbFeed.map((blog) => {
            return {
                ...blog,
                isLocked: getUnlockAwareLockStatus(blog, unlockedBlogIds)
            }
        })

        return successResponse(
            res,
            {
                feed: dbFeed,
                page,
                limit,
                totalFeed,
                totalPages,
                hasNextPage: page < totalPages,
                is_subscribed_ever: isSubscribedEver
            },
            'Feed fetched successfully',
            HTTP_OK_200
        )
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while fetching aggregated feed')
        return errorResponseWithHTTPStatus(res, { message: errorMessage }, 'Error while fetching feed', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
