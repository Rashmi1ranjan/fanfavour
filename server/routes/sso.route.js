import express from 'express'
const router = express.Router()
import { SsoLogin, SsoGenerateTempToken, SsoLogoutUserSession } from './../controller/sso.controller.js'

router.post('/login', SsoLogin)
router.post('/generate-token', SsoGenerateTempToken)
router.post('/logout', SsoLogoutUserSession)

export default router