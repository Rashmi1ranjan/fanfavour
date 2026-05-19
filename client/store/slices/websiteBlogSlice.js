import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    blogs: {},
    isBlogLoading: false
}

const websiteBlogSlice = createSlice({
    name: 'websiteBlog',
    initialState,
    reducers: {
        setWebsiteBlogData: (state, action) => {
            const { domain, blogs, currentPage, totalPages, isPaginationEnabled } = action.payload
            let newBlogs
            if (currentPage === 1 || isPaginationEnabled) {
                newBlogs = blogs
            } else {
                newBlogs = [...state.blogs[domain].blogs, ...blogs]
            }
            state.blogs[domain] = {
                ...state.blogs[domain],
                blogs: newBlogs,
                currentPage: parseInt(currentPage),
                totalPages
            }
        },
        updateWebsiteBlogData: (state, action) => {
            const { domain, blog } = action.payload
            const index = state.blogs[domain] ? state.blogs[domain]?.blogs?.findIndex(
                item => item._id === blog._id
            ) : -1
            if (index !== -1) {
                state.blogs[domain].blogs[index] = blog
            }
        },
        appendBlogs: (state, action) => {
            const { domain, blogs } = action.payload
            state.blogs[domain].blogs.push(...blogs)
        },
        setBlogLoading: (state, action) => {
            state.isBlogLoading = action.payload
        }
    }
})

export const {
    setWebsiteBlogData,
    appendBlogs,
    setBlogLoading,
    updateWebsiteBlogData
} = websiteBlogSlice.actions
export default websiteBlogSlice.reducer
