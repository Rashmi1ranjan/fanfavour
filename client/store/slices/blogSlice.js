import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    blog: [],
    isLoading: false,
    isBlogLoading: false,
    blogTotalPages: 0,
    blogCurrentPage: 0,
    isPaginationEnabled: false,
    firstPageBlogs: [],
    modelInfo: {},
    aggregatedFeed: []
}

export const blogSlice = createSlice({
    name: 'blog',
    initialState,
    reducers: {
        updateBlogData: (state, action) => {
            const updatedBlogData = action.payload
            const index = state.blog.findIndex(
                item => item._id === updatedBlogData._id
            )
            if (index !== -1) {
                state.blog[index] = updatedBlogData
            }
            state.isLoading = false
        },
        setBlogs: (state, action) => {
            let isFirstPageBlogs = false
            let newBlogs
            if (action.payload.currentPage === 1 || action.payload.isPaginationEnabled) {
                newBlogs = action.payload.blogs
            } else {
                newBlogs = [...state.blog, ...action.payload.blogs]
            }
            isFirstPageBlogs = action.payload.currentPage === 1
            state.blog = newBlogs
            state.blogTotalPages = action.payload.totalPages === 0 ? 1 : action.payload.totalPages
            state.blogCurrentPage = parseInt(action.payload.currentPage)
            state.isPaginationEnabled = action.payload.isPaginationEnabled
            state.firstPageBlogs = isFirstPageBlogs ? newBlogs : state.firstPageBlogs
        },
        storeSelectedModel: (state, action) => {
            state.modelInfo = action.payload
        },
        setIsBlogLoading: (state, action) => {
            state.isBlogLoading = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        blogUnlockPaymentLoading: (state, action) => {
            state.isBlogPaymentLoading = action.payload
        },
        updateAggregatedFeed: (state, action) => {
            const updatedBlogData = action.payload
            const index = state.aggregatedFeed ? state.aggregatedFeed.findIndex(
                item => item.blog_id === updatedBlogData._id
            ) : -1
            if (index !== -1) {
                state.aggregatedFeed[index] = {
                    ...state.aggregatedFeed[index],
                    media: updatedBlogData.media,
                    media_preview: updatedBlogData.media_preview,
                    isLocked: updatedBlogData.isLocked
                }
            }
        },
        setAggregatedFeed: (state, action) => {
            const { feed, currentPage } = action.payload
            if (currentPage === 1) {
                state.aggregatedFeed = feed
            } else {
                state.aggregatedFeed = [...state.aggregatedFeed, ...feed]
            }
        }
    }
})

export const {
    updateBlogData,
    setBlogs,
    setLoading,
    setIsBlogLoading,
    storeSelectedModel,
    blogUnlockPaymentLoading,
    updateAggregatedFeed,
    setAggregatedFeed
} = blogSlice.actions
export default blogSlice.reducer