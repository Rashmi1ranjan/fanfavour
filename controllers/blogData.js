const express = require('express')
const _ = require('lodash')
const router = express.Router()
const BlogData = require('../models/BlogData')
const BlogUnlocks = require('../models/BlogUnlocks')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { successResponse, errorResponseWithHTTPStatus } = require('../utils')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500, HTTP_OK_200, HTTP_UNAUTHORIZED_401 } = require('../utils/http.status')
const { getBlogPayload, getBlogUnlockPayload } = require('../utils/blogData')

/**
 * Store blog data received from the website.
 *
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 * @returns {Promise<object>} API response
 */
router.post('/store-blog-data', async (req, res) => {
    try {
        const token = _.get(req, 'query.token', '')
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const blogs = Array.isArray(req.body) ? req.body : _.get(req, 'body.blogs', [])

        if (Array.isArray(blogs) !== true || blogs.length === 0) {
            return errorResponseWithHTTPStatus(res, { blogs: 'blogs array is required' }, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const invalidBlogIndex = blogs.findIndex((blog) => _.isEmpty(_.get(blog, 'blog_id', '')) || _.isEmpty(_.get(blog, 'domain', '')))
        if (invalidBlogIndex !== -1) {
            return errorResponseWithHTTPStatus(
                res,
                { blogs: `Required fields are missing for blog at index ${invalidBlogIndex}` },
                'Invalid request',
                HTTP_BAD_REQUEST_400
            )
        }

        const operations = blogs.map((blog) => {
            const blogId = _.get(blog, 'blog_id', '')
            const domain = _.get(blog, 'domain', '')
            const blogPayload = getBlogPayload(blog, true)

            return {
                updateOne: {
                    filter: { blog_id: blogId, domain: domain },
                    update: { $set: blogPayload },
                    upsert: true
                }
            }
        })

        await BlogData.bulkWrite(operations)

        return successResponse(res, { totalBlogs: blogs.length }, 'Blog data stored successfully', HTTP_OK_200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while storing blog data')
        return errorResponseWithHTTPStatus(res, { message: errorMessage }, 'Error while storing blog data', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * Store blog unlock data received from the website.
 *
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 * @returns {Promise<object>} API response
 */
router.post('/store-blog-unlocks', async (req, res) => {
    try {
        const token = _.get(req, 'query.token', '')
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponseWithHTTPStatus(res, { error: 'You are not authorized' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
        }

        const blogUnlocks = Array.isArray(req.body) ? req.body : _.get(req, 'body.blog_unlocks', [])

        if (Array.isArray(blogUnlocks) !== true || blogUnlocks.length === 0) {
            return errorResponseWithHTTPStatus(res, { blog_unlocks: 'blog_unlocks array is required' }, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const invalidBlogUnlockIndex = blogUnlocks.findIndex((blogUnlock) => {
            const blogIdObjects = _.get(blogUnlock, 'blog_id_objects', [])
            const hasInvalidBlogId = Array.isArray(blogIdObjects) !== true || blogIdObjects.length === 0 || blogIdObjects.some((blogIdObject) => _.isEmpty(blogIdObject))

            return _.isEmpty(_.get(blogUnlock, 'domain', '')) || _.isEmpty(_.get(blogUnlock, 'user_id_object', '')) || hasInvalidBlogId
        })

        if (invalidBlogUnlockIndex !== -1) {
            return errorResponseWithHTTPStatus(
                res,
                { blog_unlocks: `domain, user_id_object and blog_id_objects are required for blog unlock at index ${invalidBlogUnlockIndex}` },
                'Invalid request',
                HTTP_BAD_REQUEST_400
            )
        }

        const uniqueBlogUnlocks = Array.from(
            blogUnlocks.reduce((blogUnlockMap, blogUnlock) => {
                const payload = getBlogUnlockPayload(blogUnlock)
                const mapKey = `${payload.domain}:${payload.user_id_object}`
                const existingPayload = blogUnlockMap.get(mapKey)

                if (_.isEmpty(existingPayload)) {
                    blogUnlockMap.set(mapKey, payload)
                    return blogUnlockMap
                }

                blogUnlockMap.set(mapKey, {
                    ...existingPayload,
                    blog_id_objects: Array.from(new Set([
                        ...existingPayload.blog_id_objects,
                        ...payload.blog_id_objects
                    ]))
                })

                return blogUnlockMap
            }, new Map()).values()
        )

        const operations = uniqueBlogUnlocks.map((blogUnlock) => ({
            updateOne: {
                filter: {
                    domain: blogUnlock.domain,
                    user_id_object: blogUnlock.user_id_object
                },
                update: { $set: blogUnlock },
                upsert: true
            }
        }))

        await BlogUnlocks.bulkWrite(operations)

        return successResponse(res, { totalBlogUnlocks: uniqueBlogUnlocks.length }, 'Blog unlocks stored successfully', HTTP_OK_200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while storing blog unlocks')
        return errorResponseWithHTTPStatus(res, { message: errorMessage }, 'Error while storing blog unlocks', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
