import express from 'express'
const router = express.Router()
import {
    getAppSetting,
    getAllAppSetting
} from './../controller/appSetting.controller.js'

// get app setting with specific key
router.post('/get-app-setting', getAppSetting)
router.get('/get-all-app-setting', getAllAppSetting)

export default router