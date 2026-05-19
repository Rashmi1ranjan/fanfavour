import express from 'express'
const router = express.Router()
import {
    subscriptionPayment,
    subscriptionPaymentByCard,
    chatPurchasePayment,
    sendTip,
    addNewCard,
    blogPurchasePayment
} from './../controller/hybridPayment.controller.js'

// get app setting with specific key
router.post('/subscription', subscriptionPayment)
router.post('/subscription-with-card', subscriptionPaymentByCard)
router.post('/chat-content-purchase', chatPurchasePayment)
router.post('/send-tip', sendTip)
router.post('/add-new-card', addNewCard)
router.post('/blog-content-purchase', blogPurchasePayment)

export default router