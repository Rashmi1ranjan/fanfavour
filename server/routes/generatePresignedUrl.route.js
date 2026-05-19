import express from 'express'
const router = express.Router()
import {
    generatePresignUrl
} from './../controller/generatePresignUrl.controller.js'

// generate presigned url
router.post('/generate_presigned_url', generatePresignUrl)

export default router