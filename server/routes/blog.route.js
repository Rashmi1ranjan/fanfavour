import express from 'express'
const router = express.Router()
import {
    getLatestBlog,
    getBlogInfo,
    saveBlogComment,
    removeBlogComment,
    likeDislikeBlog,
    getAggregatedFeed
} from './../controller/blog.controller.js'
import { protectRouteWithToken } from '../middleware/auth.middleware.js'

// auth user route
router.get('/get_latest_blog', getLatestBlog)
router.get('/get_blog_info', protectRouteWithToken, getBlogInfo)
router.post('/save_blog_comment', protectRouteWithToken, saveBlogComment)
router.post('/remove_blog_comment', protectRouteWithToken, removeBlogComment)
router.post('/like_dislike_blog', protectRouteWithToken, likeDislikeBlog)
router.get('/aggregated-feed', protectRouteWithToken, getAggregatedFeed)

export default router
