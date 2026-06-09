const router = require('express').Router()
const { successResponse, errorResponse } = require('../utils')
const Coupon = require('../models/Coupon')
const { API_STATIC_AUTH_TOKEN } = require('../constants')

router.post('/save-user-data', async (req, res) => {
    const token = req.query.token
    if (token !== API_STATIC_AUTH_TOKEN) {
        return errorResponse(res, { error: 'You are not authorized' }, 'Unauthorized', 401)
    }

    const { userList } = req.body
    console.log('userList', req.body)
    for (const user of userList) {

        const coupon = await Coupon.findOne({ user_id: user.user_id, code: user.code })
        if (coupon) {
            coupon.user_id = user.user_id
            coupon.name = user.name
            coupon.email = user.email
            coupon.ccbill_subscription_status = user.ccbill_subscription_status
            coupon.transaction_date = user.transaction_date
            coupon.coupon_name = user.coupon_name
            coupon.discount_type = user.discount_type
            coupon.discount_value_for_initial = user.discount_value_for_initial
            coupon.discount_value_for_recurring = user.discount_value_for_recurring
            coupon.domain = user.domain
            coupon.amount = user.amount
            await coupon.save()
        } else {
            const newCoupon = new Coupon({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                ccbill_subscription_status: user.ccbill_subscription_status,
                transaction_date: user.transaction_date,
                coupon_name: user.coupon_name,
                discount_type: user.discount_type,
                discount_value_for_initial: user.discount_value_for_initial,
                discount_value_for_recurring: user.discount_value_for_recurring,
                domain: user.domain,
                amount: user.amount
            })
            await newCoupon.save()
        }

    }
    return successResponse(res, {}, 'User data saved successfully', 200)
})

module.exports = router
