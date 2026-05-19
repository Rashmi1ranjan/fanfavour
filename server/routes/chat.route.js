import express from 'express'
const router = express.Router()
import {
    getUserList,
    getModelList,
    getUserDetails,
    readMessageUser,
    getMessages,
    getUnreadCount,
    sendTextMessage,
    getUniversalChatMessages
} from './../controller/chat.controller.js'

// chat routes
router.get('/get_user_list', getUserList)
router.get('/get_model_list', getModelList)
router.get('/get_user_details', getUserDetails)
router.post('/read_message_user', readMessageUser)
router.get('/get_messages', getMessages)
router.get('/get_unread_count', getUnreadCount)
router.post('/send_message', sendTextMessage)
router.get('/universal-chat/get-user-message', getUniversalChatMessages)

export default router