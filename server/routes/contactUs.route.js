import express from 'express'
const router = express.Router()
import { contactUs } from '../controller/contactUs.controller.js'

router.post('/contact-us', contactUs)

export default router
