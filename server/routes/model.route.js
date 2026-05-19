import express from 'express'
const router = express.Router()
import {
    getFanFavourModelList,
    getFanFavourFeaturedModel,
    getAuthImages,
    getSelectedModel,
    getCurrentUserSession
} from './../controller/model.controller.js'

router.get('/get-model-list', getFanFavourModelList)
router.get('/get-featured-model', getFanFavourFeaturedModel)
router.get('/get-auth-images', getAuthImages)
router.get('/get-selected-model', getSelectedModel)
router.post('/get-current-user-session', getCurrentUserSession)

export default router