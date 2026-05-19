import express from 'express'

import modelRoute from './model.route.js'
import authRoute from './auth.route.js'
import appSettingRoute from './appSetting.route.js'
import subscriptionRoute from './subscription.route.js'
import paymentRoute from './payment.route.js'
import hybridPayment from './hybridPayment.route.js'
import offerRoute from './offer.route.js'
import cryptoRoute from './crypto.route.js'
import couponRoute from './coupon.route.js'
import utilityRoute from './utility.route.js'
import chatRoute from './chat.route.js'
import generatePresignedUrl from './generatePresignedUrl.route.js'
import messageRoute from './message.route.js'
import blogRoute from './blog.route.js'
import emailSettingRoute from './emailSetting.route.js'
import contactUsRoute from './contactUs.route.js'

const router = express.Router()

// base routes
router.use('/', [modelRoute, authRoute, appSettingRoute, contactUsRoute])
// subscriptions
router.use('/users', subscriptionRoute)

// payments
router.use('/payment', paymentRoute)
router.use('/purchase', hybridPayment)
router.use('/crypto', cryptoRoute)

// offers & coupons
router.use('/offer', offerRoute)
router.use('/coupon', couponRoute)

// utilities
router.use('/services', utilityRoute)
// chat
router.use('/chat', chatRoute)
router.use('/upload', generatePresignedUrl)
router.use('/message', messageRoute)
router.use('/blog', blogRoute)
router.use('/email-settings', emailSettingRoute)
export default router
