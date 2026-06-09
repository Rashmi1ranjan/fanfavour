const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('./../models/User')
const { verifyMfaToken } = require('./../utils/mfa')
const loginValidationSchema = require('./../validation/login')
const WebsiteReferral = require('./../models/WebsiteReferral')
const mongoose = require('mongoose')

router.post('/login', async (req, res) => {
    try {
        await loginValidationSchema.validateAsync(req.body)


        const email = req.body.email.toLowerCase()
        const password = req.body.password
        const mfa_code = req.body.mfa_code || null

        // Find user by email
        const user = await User.findOne({ email, is_deleted: { $ne: true } })
        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        if (user.role === 'REFERRAL') {
            if (user.referral_id === '') {
                return res.status(404).json({ message: 'Referral id is missing.' })
            } else {
                const finReferralUser = await WebsiteReferral.findOne({ _id: new mongoose.Types.ObjectId(user.referral_id) })
                if (!finReferralUser) {
                    return res.status(404).json({ message: 'Invalid Referral user' })
                }
            }
        }

        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                let mfaVerified = false
                // verify MFA code
                if (mfa_code !== null && user.is_mfa_enabled === true) {
                    // mfa verification code here
                    mfaVerified = verifyMfaToken(user.mfa_secret, mfa_code)
                    if (mfaVerified === false) {
                        return res.status(400).json({ message: 'Invalid MFA Code' })
                    }
                }

                if (mfa_code === null && user.is_mfa_enabled === true) {
                    return res.json({
                        success: true,
                        is_mfa_verified: mfaVerified,
                        is_mfa_enabled: user.is_mfa_enabled
                    })
                }

                // User matched
                // Create JWT Payload
                const payload = {
                    id: user.id,
                    isAdmin: user.isAdmin,
                    role: user.role
                }

                let jwtSecret = process.env.JWT_SECRET

                // Sign token
                jwt.sign(
                    payload,
                    jwtSecret,
                    {
                        expiresIn: '1d' // 1 Day
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            is_mfa_verified: mfaVerified,
                            is_mfa_enabled: user.is_mfa_enabled,
                            token: 'Bearer ' + token,
                            role: user.role
                        })
                    }
                )
            } else {
                return res
                    .status(400)
                    .json({ message: 'Invalid email or password' })
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

module.exports = router
