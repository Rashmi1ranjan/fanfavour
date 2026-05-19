import express from 'express'
const router = express.Router()
import {
    sendMessage
} from './../controller/message.controller.js'

// send media message
router.post('/send-message', sendMessage)

export default router