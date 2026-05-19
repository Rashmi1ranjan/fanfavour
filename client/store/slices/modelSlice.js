import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  modelList: [],
  totalPages: 1,
  currentPage: 1,
  featuredModel: [],
  featureModelText: '',
  fullScreenLoader: false,
  feedImages: [],
  mainScreenLoader: false,
  loader: false
}

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    storeModelList: (state, action) => {
      state.modelList = action.payload
    },
    setTotalPages: (state, action) => {
      state.totalPages = action.payload
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    storeFeaturedModel: (state, action) => {
      state.featuredModel = action.payload
    },
    setFeaturedModelText: (state, action) => {
      state.featureModelText = action.payload
    },
    setFullScreenLoader: (state, action) => {
      state.fullScreenLoader = action.payload
    },
    setMainScreenLoader: (state, action) => {
      state.mainScreenLoader = action.payload
    },
    setFeedImages: (state, action) => {
      state.feedImages = action.payload
    },
    setLoader: (state, action) => {
      state.loader = action.payload
    }
  }
})

export const {
  storeModelList,
  setTotalPages,
  setCurrentPage,
  storeFeaturedModel,
  setFeaturedModelText,
  setFullScreenLoader,
  setMainScreenLoader,
  setFeedImages,
  setLoader
} = modelSlice.actions

export default modelSlice.reducer
