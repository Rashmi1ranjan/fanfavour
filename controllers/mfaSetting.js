const express = require('express')
const router = express.Router()
const { protectRouteWithRole, SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL } = require('./../middleware/auth.middleware')
const User = require('./../models/User')
const { generateSecret, verifyMfaToken, generateOtpAuthUrl } = require('./../utils/mfa')
const bcrypt = require('bcryptjs')

router.post('/get-mfa-setting', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL]), async (req, res) => {
    const user = await User.findById(req.decoded.id, 'is_mfa_enabled mfa_secret name')
    if (user.is_mfa_enabled === false) {
        const mfa_secret = generateSecret()
        user.mfa_secret = mfa_secret.base32
        user.mfa_qr_code = generateOtpAuthUrl(mfa_secret.base32, user.name)
        await user.save()
    } else {
        user.mfa_qr_code = ''
        user.mfa_secret = ''
    }
    const response = {
        status: true,
        is_mfa_enabled: user.is_mfa_enabled,
        mfa_secret: user.mfa_secret,
        mfa_qr_code: user.mfa_qr_code
    }
    return res.send(response)
})

router.post('/enable-mfa-setting', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL]), async (req, res) => {
    const { token } = req.body

    const user = await User.findById(req.decoded.id, 'is_mfa_enabled mfa_secret')

    const verified = verifyMfaToken(user.mfa_secret, token)
    // MFA verification failed
    if (verified === false) {
        return res.send({ status: true, is_mfa_enabled: verified, message: 'Invalid MFA code' })
    }

    // MFA verification success
    user.is_mfa_enabled = true
    await user.save()
    return res.send({ status: true, is_mfa_enabled: true, message: 'MFA Successfully Saved' })
})

router.post('/verify-token', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL]), async (req, res) => {
    const { token } = req.body
    const user = await User.findById(req.decoded.id, 'is_mfa_enabled mfa_secret')
    const verified = verifyMfaToken(user.mfa_secret, token)

    if (verified === false) {
        const message = 'Invalid MFA code'
        return res.send({ status: verified, message })
    }
    const message = 'Successfully verified'

    return res.send({ status: verified, message })
})

router.get('/check-mfa-status', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL]), async (req, res) => {
    const user = await User.findById(req.decoded.id, 'is_mfa_enabled')

    return res.send({ status: true, is_mfa_enabled: user.is_mfa_enabled })
})

router.post('/disable-mfa-setting', protectRouteWithRole([SUPER_ADMIN, ROLE_ANALYTICS, ROLE_SUPPORT, ROLE_REFERRAL, LINK_REFERRAL]), async (req, res) => {
    const { token, password } = req.body

    const user = await User.findById(req.decoded.id, 'is_mfa_enabled mfa_secret password')
    const verifyMFACode = verifyMfaToken(user.mfa_secret, token)
    // MFA verification failed
    if (verifyMFACode === false) {
        const message = 'Invalid MFA code'
        return res.send({ status: false, message })
    }

    const verifyPassword = await bcrypt.compare(password, user.password)
    // Password verification failed
    if (verifyPassword === false) {
        const message = 'Invalid Password'
        return res.send({ status: false, message })
    }

    // MFA and password verification successful
    user.is_mfa_enabled = false
    user.mfa_secret = undefined
    await user.save()
    return res.send({ status: true, is_mfa_enabled: false, message: 'MFA Successfully Disabled' })
})

module.exports = router
