import express from 'express'
const router = express.Router()
import {
    dismissChangeEmailRequest,
    resendChangeEmailRequest
} from './../controller/email.setting.controller.js'

// auth user route
router.post('/dismiss-change-email-request', dismissChangeEmailRequest)
router.post('/resend-change-email-request', resendChangeEmailRequest)

export default router
