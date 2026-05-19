import express from 'express'
const router = express.Router()
import {
    getPaymentMethod,
    getUsersNewPaymentMethod,
    markCardAsPrimary,
    removeCard,
    saveUserDefaultPaymentMethod
} from './../controller/payment.controller.js'

// get app setting with specific key
router.get('/get-payment-card', getPaymentMethod)
router.get('/get-new-payment-card', getUsersNewPaymentMethod)
router.post('/mark-card-as-primary', markCardAsPrimary)
router.post('/remove-card', removeCard)
router.post('/save-user-default-payment-method', saveUserDefaultPaymentMethod)

export default router