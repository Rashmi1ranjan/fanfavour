import express from 'express'
const router = express.Router()
import {
    sendDeviceInfoToServices
} from './../controller/utility.controller.js'

router.post('/send-device-info', sendDeviceInfoToServices)

export default router