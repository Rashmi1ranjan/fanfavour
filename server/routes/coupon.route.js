import express from 'express'
const router = express.Router()
import {
    checkCouponIsValid
} from './../controller/couponCode.controller.js'

router.post('/check', checkCouponIsValid)

export default router
