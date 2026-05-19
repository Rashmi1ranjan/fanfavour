import _ from 'lodash'
import { setAggregatedFeed, setBlogs, setIsBlogLoading } from "../../store/slices/blogSlice"
import { setSweetAlert } from "../../store/slices/sweetAlertSlice"
import { api } from "./base-url"
import store from "../../store/index"
import { setBlogLoading, setWebsiteBlogData } from '../../store/slices/websiteBlogSlice'
import { updateUserListForNonSubscribedUser } from '../../store/slices/chatSlice'

export const getBlogData = async (domain, data, dispatch) => {
    try {
        const state = store.getState()
        const isPaginationEnabled = state.auth.appSettings.is_pagination_on_exclusive_content_enabled || data.isPaginationEnabled
        if (data.pageNum === 1) {
            dispatch(setIsBlogLoading(true))
        }
        const params = {
            page_num: data.pageNum,
            domain: domain
        }

        const res = await api.get(`/v1/blog/get_latest_blog`, { params })
        dispatch(setBlogs({ ...res.data.data, isPaginationEnabled }))
        dispatch(setIsBlogLoading(false))
        return res.data.data
    } catch (error) {
        dispatch(setIsBlogLoading(false))
        const errorMessage = _.get(error, 'response.data.message', 'Error while get blog list')
        const payload = {
            description: errorMessage
        }
        dispatch(setSweetAlert(payload))
    }
}

export const getWebsiteBlogData = async (domain, data, dispatch) => {
    try {
        const state = store.getState()
        const isPaginationEnabled = state.auth.appSettings.is_pagination_on_exclusive_content_enabled || data.isPaginationEnabled
        if (data.pageNum === 1 && isPaginationEnabled === false) {
            dispatch(setBlogLoading(true))
        }
        const params = {
            page_num: data.pageNum,
            domain: domain
        }
        const res = await api.get(`/v1/blog/get_latest_blog`, { params })
        dispatch(setWebsiteBlogData({ domain, ...res.data.data, isPaginationEnabled }))
        dispatch(setBlogLoading(false))
        return res.data.data
    } catch (error) {
        dispatch(setBlogLoading(false))
        const errorMessage = _.get(error, 'response.data.message', 'Error while get blog list')
        const payload = {
            description: errorMessage
        }
        dispatch(setSweetAlert(payload))
    }
}

export const getWebsiteBlogInfo = async (domain, blogId, dispatch) => {
    try {
        const params = {
            domain,
            blog_id: blogId
        }

        const res = await api.get(`/v1/blog/get_blog_info`, { params })
        return _.get(res, 'data.data', res.data)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get blog info')
        if (dispatch) {
            dispatch(setSweetAlert({ description: errorMessage }))
        }
        return null
    }
}

export const saveWebsiteBlogComment = async (domain, blogId, comment, isAnonymous, dispatch) => {
    try {
        const payload = {
            domain,
            blog_id: blogId,
            comment,
            is_anonymous: isAnonymous
        }

        const res = await api.post('/v1/blog/save_blog_comment', payload)
        return _.get(res, 'data.data', res.data)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while saving comment')
        if (dispatch) {
            dispatch(setSweetAlert({ description: errorMessage }))
        }
        return null
    }
}

export const removeWebsiteBlogComment = async (domain, blogId, commentId, dispatch) => {
    try {
        const payload = {
            domain,
            blog_id: blogId,
            comment_id: commentId
        }

        const res = await api.post('/v1/blog/remove_blog_comment', payload)
        return _.get(res, 'data.data', res.data)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while removing comment')
        if (dispatch) {
            dispatch(setSweetAlert({ description: errorMessage }))
        }
        return null
    }
}

export const likeOrDislikeBlog = async (domain, payload, dispatch) => {
    try {
        const res = await api.post('/v1/blog/like_dislike_blog', {
            domain,
            ...payload
        })
        return _.get(res, 'data.data', res.data)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while updating like status')
        if (dispatch) {
            dispatch(setSweetAlert({ description: errorMessage }))
        }
        return null
    }
}

export const getAggregatedFeed = async (dispatch, pageNum = 1, userCCBillSubscriptionStatus) => {
    try {
        if (pageNum === 1) {
            dispatch(setIsBlogLoading(true))
        }
        const params = { page_num: pageNum }
        const res = await api.get('/v1/blog/aggregated-feed', { params })
        const responseData = _.get(res, 'data.data', res.data)
        dispatch(setAggregatedFeed({ feed: responseData.feed || responseData, currentPage: pageNum }))
        dispatch(setIsBlogLoading(false))
        if (userCCBillSubscriptionStatus === '0') {
            const feedData = responseData.feed || []
            const uniqueUsersData = []
            const uniqueUserIds = new Set()
            feedData.forEach(element => {
                const user = {
                    ...element.user,
                    domain: element.domain
                }
                if (!uniqueUserIds.has(user._id)) {
                    uniqueUserIds.add(user._id)
                    uniqueUsersData.push(user)
                }
            });
            dispatch(updateUserListForNonSubscribedUser({ data: uniqueUsersData }))
        }
        return responseData
    } catch (error) {
        dispatch(setIsBlogLoading(false))
        const errorMessage = _.get(error, 'response.data.message', 'Error while fetching aggregated feed')
        const payload = {
            description: errorMessage
        }
        dispatch(setSweetAlert(payload))
        return null
    }
}
