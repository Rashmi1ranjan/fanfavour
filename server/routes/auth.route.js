import express from 'express'
const router = express.Router()
import {
    loginUser,
    registerUser,
    forgotPassword,
    getUserDetails,
    updateProfile,
    changeOldPassword,
    resetUserPassword
} from './../controller/auth.controller.js'

// auth user route
router.post('/login', loginUser)
router.post('/register', registerUser)

// forgot password
router.post('/forgot_password', forgotPassword)

router.get('/get-user-details', getUserDetails)
router.post('/update-profile', updateProfile)
router.post('/change_old_password', changeOldPassword)
router.post('/reset_password', resetUserPassword)

export default router