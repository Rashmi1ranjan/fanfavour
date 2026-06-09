const { ROLE_ACCOUNT_MANAGER } = require('./../middleware/auth.middleware')
const { generateToken } = require('./analyticsReport')
const User = require('./../models/User')
const bcrypt = require('bcryptjs')
const _ = require('lodash')

/**
 * @description create account manager user
 * @param {email} email email address
 * @param {password} password password
 */

const createAccountManager = async function(email, password) {
    if (_.isEmpty(email) || _.isEmpty(password)) {
        console.log('please provide username and password')
        return
    }
    let USE_SECURE_JWT = process.env.USE_SECURE_JWT || false

    let userInfo = {
        name: 'Account Manager',
        email: email,
        password: password,
        isAdmin: true,
        role: ROLE_ACCOUNT_MANAGER
    }

    let emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
    const checkEmail = email.match(emailRegex)
    if (checkEmail === null) {
        console.log('please enter valid email address')
        return
    }

    if (USE_SECURE_JWT) {
        userInfo.jwtSecrect = generateToken(32)
    }

    try {
        let user = await User.countDocuments({email:userInfo.email})
        if (user === 0) {
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(userInfo.password, salt)
            userInfo.password = hash
            const newUser = new User(userInfo)
            await newUser.save()
            console.log('success')
        } else {
            console.log('Account Manager user already exist')
        }
        return
    } catch (error) {
        return
    }
}

module.exports = {
    createAccountManager
}
