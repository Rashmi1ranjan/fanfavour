const express = require('express')
const router = express.Router()
const _ = require('lodash')
const Validator = require('validator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const UniversalUsers = require('../models/UniversalUsers')
const AllWebsiteUsers = require('../models/AllWebsiteUsers')
const AllWebsiteCards = require('../models/AllWebsiteCards')
const BlockedUsers = require('../models/BlockedUsers')
const Website = require('../models/Website')
const WalletBalance = require('../models/WalletBalance')
const BlockCodes = require('../models/BlockCodes')
const { errorResponseWithHTTPStatus, successResponse, getDatesArray } = require('../utils/index')
const {
    removeUserPrimaryCards,
    updateUniversalUserDetails,
    updateUniversalUserPassword,
    hashPassword,
    getOldUserPaymentMethodOnMergeAccount,
    updateUniversallyBlockStatus,
    updateCardDetailsOnWebsites,
    registerUserInWebsite,
    syncSingleUserSubscription
} = require('../utils/universalLogin')

const { protectRouteWithRole, SUPER_ADMIN, protectWebsiteRoute, ROLE_SUPPORT } = require('../middleware/auth.middleware')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } = require('../utils/http.status')
const { ADD_ACCOUNT, CHECK_USER_ACCOUNT, REQ_FROM_REGISTER, MERGE_ACCOUNT, REQ_FROM_LOGIN, LOGIN_MERGE, MERGE_ACCOUNT_FROM_RESET_PASSWORD, REGISTER } = require('../utils/universalLoginConstant')
const { processMissingForumPayWebhook, getWalletBalance, updateWalletAmount } = require('../utils/forumpay')
const WalletTransactions = require('../models/WalletTransactions')
const moment = require('moment')
const UniversalLoginEventLogs = require('../models/UniversalLoginEventLogs')

/**
 * @description Register user
 *
 * @param {object} req request body
 * @param {object} req.body user details
 * @param {object} res response data
 */
router.post('/register', protectWebsiteRoute, async (req, res) => {
    let ULAction = ''
    try {
        const name = _.get(req, 'body.userDetails.name', '')
        const action = _.get(req, 'body.action', '')
        const reqFrom = _.get(req, 'body.reqFrom', '')
        const oldUser = _.get(req, 'body.oldUser', false)
        const isFFUser = _.get(req, 'body.isFFUser', false)
        const country_code = _.get(req, 'body.userDetails.country_code', false)
        const phone_number = _.get(req, 'body.userDetails.phone_number', false)

        const email = _.get(req, 'body.userDetails.email', '').toLowerCase().trim()
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.domain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const password = _.get(req, 'body.userDetails.password', '')
        if (_.isEmpty(password)) return errorResponseWithHTTPStatus(res, {}, 'Invalid password', HTTP_BAD_REQUEST_400)

        const projection = 'name email password universal_login_merged_domains wallet_amount default_payment_method payment_gateway card_id last_used_crypto_currency is_blocked'
        ULAction = CHECK_USER_ACCOUNT
        let universalUser = await UniversalUsers.findOne({ email: email }, projection)

        const isBlock = _.get(universalUser, 'is_blocked', false)
        if (isBlock) return errorResponseWithHTTPStatus(res, {}, 'Something went wrong. Please try again.', HTTP_BAD_REQUEST_400)

        let userDetails = {}
        let isUserMergeInUniversal = false
        let showMergePopup = false
        let siteListOfMergeAccount = []
        let showForgotPasswordPopup = false
        let siteListOfMergeOldAccount = []
        let siteListOfDifferentPassword = []
        let showOldUserMergePopup = false
        let mergeOldUser = false
        let showDifferentPasswordPopup = false

        // find old website list
        const oldUserAccounts = await AllWebsiteUsers.find({ email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true } }, 'name email password domain default_payment_method')
        let filterCurrentSite = false
        if (!_.isEmpty(oldUserAccounts)) {
            filterCurrentSite = oldUserAccounts.some(item => item.domain === sourceDomain)
        }

        // check old user password and add in the array
        if (_.isEmpty(oldUserAccounts) === false) {
            const oldUserLength = oldUserAccounts.length
            for (let i = 0; i < oldUserLength; i++) {
                let user = oldUserAccounts[i]
                const result = await bcrypt.compare(password, user.password)
                if (result) {
                    siteListOfMergeOldAccount.push(user.domain)
                } else {
                    siteListOfDifferentPassword.push(user.domain)
                }
            }
        }

        // Make user universal account if user not have universal account
        if (_.isEmpty(universalUser) && _.isEmpty(oldUserAccounts) === true) {
            if (reqFrom === REQ_FROM_REGISTER) {
                ULAction = 'Register'
                const hashedPassword = await hashPassword(password)
                if (isFFUser === true) {
                    const data = {
                        name,
                        email,
                        password: hashedPassword,
                        sourceDomain,
                        country_code,
                        phone_number
                    }
                    await registerUserInWebsite(data)
                }
                // common function to create new user while register
                const filter = { email, universal_login_merged_domains: { $in: sourceDomain } }
                const update = { name, email, password: hashedPassword, source_domain: sourceDomain, universal_login_merged_domains: sourceDomain }
                universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, '', true)
                isUserMergeInUniversal = true
                userDetails = universalUser
            }

        } else if (_.isEmpty(universalUser) && reqFrom === REQ_FROM_LOGIN && filterCurrentSite && oldUserAccounts.length === 1) {
            // check if user login from current website when old user is only one
            ULAction = 'Login'
            const userName = oldUserAccounts[0].name
            const userEmail = oldUserAccounts[0].email
            const default_payment_method = oldUserAccounts[0].default_payment_method === 'crypto_currency' ? 'crypto_currency' : 'credit_card'
            const hashedPassword = await hashPassword(password)
            // common function to create new user while login old user and present only in one site
            const filter = { email: userEmail, universal_login_merged_domains: { $in: sourceDomain } }
            const update = { name: userName, email: userEmail, password: hashedPassword, source_domain: sourceDomain, universal_login_merged_domains: sourceDomain, default_payment_method: default_payment_method }
            universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, '', true)
            isUserMergeInUniversal = true
            userDetails = universalUser
            mergeOldUser = true
            const walletAmount = await updateWalletAmount(email, sourceDomain)
            userDetails.wallet_amount = walletAmount
            await AllWebsiteUsers.deleteMany({ email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true }, domain: { $in: sourceDomain } })
        } else {
            let isPasswordMatch = false
            if (!_.isEmpty(universalUser)) {
                isPasswordMatch = await bcrypt.compare(password, universalUser.password)
            }

            if (oldUser === true) {
                ULAction = MERGE_ACCOUNT
                const mergeWebsiteList = oldUserAccounts.map(item => item.domain)
                // if universal user exists
                if (!_.isEmpty(universalUser)) {
                    const domainList = universalUser.universal_login_merged_domains.concat(mergeWebsiteList)
                    universalUser.universal_login_merged_domains = domainList
                    await universalUser.save()
                    await syncSingleUserSubscription(email)
                    const filter = { email: email, universal_login_merged_domains: { $in: sourceDomain } }
                    await removeUserPrimaryCards(email, mergeWebsiteList)
                    universalUser = await updateUniversalUserDetails(filter, {}, sourceDomain, 'universal_login', false)
                    isUserMergeInUniversal = true
                    userDetails = universalUser
                } else {
                    let userName = oldUserAccounts[0].name

                    const user = oldUserAccounts.filter(item => item.domain === sourceDomain)
                    if (!_.isEmpty(user)) {
                        userName = user[0].name
                    } else {
                        mergeWebsiteList.push(sourceDomain)
                    }

                    const hashedPassword = await hashPassword(password)
                    const filter = { email: email, universal_login_merged_domains: { $in: sourceDomain } }
                    const update = { name: userName, email, password: hashedPassword, source_domain: sourceDomain, universal_login_merged_domains: mergeWebsiteList }
                    const paymentDetails = await getOldUserPaymentMethodOnMergeAccount(email, mergeWebsiteList)
                    if (_.isEmpty(paymentDetails) === false) {
                        Object.assign(update, paymentDetails)
                        if (_.isEmpty(paymentDetails.card_id) === false) {
                            await removeUserPrimaryCards(email, mergeWebsiteList)
                            await AllWebsiteCards.updateOne({ email, card_id: paymentDetails.card_id, domain: { $in: mergeWebsiteList } }, { $set: { is_primary: true } })
                        }
                    }
                    universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, 'universal_login', true)
                    isUserMergeInUniversal = true
                    userDetails = universalUser
                }
                const walletAmount = await updateWalletAmount(email, sourceDomain)
                userDetails.wallet_amount = walletAmount
                await AllWebsiteUsers.deleteMany({ email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true }, domain: { $in: mergeWebsiteList } })
            } else if (action === MERGE_ACCOUNT) {
                // Merge old user in universal login
                ULAction = MERGE_ACCOUNT

                let userName = name
                // add source domain siteListOfMergeOldAccount while user merge account from register page
                if (reqFrom === REQ_FROM_REGISTER) {
                    siteListOfMergeOldAccount.push(sourceDomain)
                    if (isFFUser === true) {
                        const hashedPassword = await hashPassword(password)
                        const data = {
                            name,
                            email,
                            password: hashedPassword,
                            sourceDomain,
                            country_code,
                            phone_number
                        }
                        await registerUserInWebsite(data)
                    }
                } else {
                    // if current site exit while merge account from login page
                    if (filterCurrentSite === true) {
                        const user = oldUserAccounts.filter(item => item.domain === sourceDomain)
                        userName = user[0].name
                    } else {
                        // while login old user with same email and password but not available in current website
                        siteListOfMergeOldAccount.push(sourceDomain)
                        userName = oldUserAccounts[0].name
                    }
                }
                const hashedPassword = await hashPassword(password)
                const filter = { email: email, universal_login_merged_domains: { $in: sourceDomain } }
                const update = { name: userName, email: email, password: hashedPassword, source_domain: sourceDomain, universal_login_merged_domains: siteListOfMergeOldAccount }
                const paymentDetails = await getOldUserPaymentMethodOnMergeAccount(email, siteListOfMergeOldAccount)
                if (_.isEmpty(paymentDetails) === false) {
                    Object.assign(update, paymentDetails)
                    if (_.isEmpty(paymentDetails.card_id) === false) {
                        await removeUserPrimaryCards(email, siteListOfMergeOldAccount)
                        await AllWebsiteCards.updateOne({ email, card_id: paymentDetails.card_id, domain: { $in: siteListOfMergeOldAccount } }, { $set: { is_primary: true } })
                    }
                }
                // common function to create new user while register and login old user
                universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, 'universal_login', true)
                isUserMergeInUniversal = true
                userDetails = universalUser
                const walletAmount = await updateWalletAmount(email, sourceDomain)
                userDetails.wallet_amount = walletAmount
                await AllWebsiteUsers.deleteMany({ email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true }, domain: { $in: siteListOfMergeOldAccount } })

            } else if (action === ADD_ACCOUNT) {
                ULAction = ADD_ACCOUNT
                universalUser.universal_login_merged_domains.push(sourceDomain)
                await universalUser.save()
                await syncSingleUserSubscription(email)
                if (oldUserAccounts.length > 0) {
                    const paymentDetails = await getOldUserPaymentMethodOnMergeAccount(email, universalUser.universal_login_merged_domains)
                    if (_.isEmpty(paymentDetails) === false) {
                        if (_.isEmpty(paymentDetails.card_id) === false) {
                            await removeUserPrimaryCards(email, universalUser.universal_login_merged_domains)
                            await AllWebsiteCards.updateOne({ email, card_id: paymentDetails.card_id, domain: { $in: universalUser.universal_login_merged_domains } }, { $set: { is_primary: true } })
                        }
                    }
                    await AllWebsiteUsers.deleteMany({ email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true }, domain: { $in: universalUser.universal_login_merged_domains } })
                }
                isUserMergeInUniversal = true
                if (isFFUser === true) {
                    const hashedPassword = await hashPassword(password)
                    const data = {
                        name,
                        email,
                        password: hashedPassword,
                        sourceDomain,
                        country_code,
                        phone_number
                    }
                    await registerUserInWebsite(data)
                }
                userDetails = universalUser
            } else {
                // check merge old account when current site exist while both account password different while login
                const showOldUserPopup = filterCurrentSite ? siteListOfMergeOldAccount.length > 1 : true
                // check filterCurrentSite exist while request from login while current site exist or not
                const checkCurrentUser = reqFrom === REQ_FROM_LOGIN ? filterCurrentSite : true
                if (!_.isEmpty(universalUser)) {
                    siteListOfMergeAccount = universalUser.universal_login_merged_domains
                    isPasswordMatch === false ? showForgotPasswordPopup = true : showMergePopup = true
                } else if (!_.isEmpty(siteListOfMergeOldAccount) && showOldUserPopup) {
                    // show old user merge popup while found list of old account
                    showOldUserMergePopup = true
                } else if (!_.isEmpty(siteListOfDifferentPassword) && checkCurrentUser) {
                    if (reqFrom === REQ_FROM_LOGIN) {
                        showDifferentPasswordPopup = true
                    } else {
                        showForgotPasswordPopup = true
                        mergeOldUser = true
                    }
                }
            }
        }

        const resData = {
            isUserMergeInUniversal,
            showMergePopup,
            siteListOfMergeAccount,
            userDetails,
            showForgotPasswordPopup,
            showOldUserMergePopup,
            siteListOfMergeOldAccount,
            mergeOldUser,
            siteListOfDifferentPassword,
            showDifferentPasswordPopup
        }
        return successResponse(res, resData, 'User register successfully', 200)
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'Error while register')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { ULAction, message: errorMessage, name: errorName, stack: errorStack }, 'Error in register user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Get user details
 *
 * @param {string} email user email
 * @param {string} sourceDomain user email
 */
router.post('/get-user-details', protectWebsiteRoute, async (req, res) => {
    try {
        const isOldUser = _.get(req, 'body.isOldUser', false)
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const projection = 'name email password universal_login_merged_domains wallet_amount default_payment_method card_id last_used_crypto_currency'
        const universalUser = await UniversalUsers.findOne({ email: email, universal_login_merged_domains: { $in: sourceDomain } }, projection)
        if (!isOldUser) {
            if (_.isEmpty(universalUser)) return errorResponseWithHTTPStatus(res, {}, 'User not found', HTTP_BAD_REQUEST_400)
            await processMissingForumPayWebhook(email)

            const balance = await getWalletBalance(email, sourceDomain)
            universalUser.wallet_amount = balance
            await universalUser.save()
        }

        const universalMergedUserDomain = []

        if (universalUser) {
            for (const website of universalUser.universal_login_merged_domains) {
                const websiteStatus = await Website.findOne({ status: { $in: ['published', 'live'] }, website_url: website })

                if (websiteStatus) {
                    universalMergedUserDomain.push(website)
                }
            }

            universalUser.universal_login_merged_domains = universalMergedUserDomain
        }

        const query = { email: email, is_blocked: { $ne: true }, is_deleted: { $ne: true } }
        if (!_.isEmpty(universalUser) && universalUser.universal_login_merged_domains) {
            query.domain = { $nin: universalUser.universal_login_merged_domains }
        }

        const allWebsiteUsers = await AllWebsiteUsers.find(query, 'name email password domain default_payment_method')
        const siteListOfDifferentPassword = []
        allWebsiteUsers.forEach(user => { siteListOfDifferentPassword.push(user.domain) })

        let userDetails = {}
        if (!_.isEmpty(universalUser)) userDetails = { ...universalUser.toObject() }
        userDetails.siteListOfDifferentPassword = siteListOfDifferentPassword.filter(site => site !== sourceDomain)
        return successResponse(res, userDetails, 'User details get successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get user details')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in get user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description fetch the universal merge domain list using email
 *
 * @param {object} req request body
 * @param {object} req.body user email
 * @param {object} res response data
 */
router.post('/universal-login-merge-domain-list', protectWebsiteRoute, async (req, res) => {
    try {
        const userEmail = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(userEmail)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const universalUser = await UniversalUsers.findOne({ email: userEmail }, 'universal_login_merged_domains')

        return successResponse(res, universalUser, 'Get Universal merge domain list successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get universal domain website list')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in get universal domain website list', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description update user password
 *
 * @param {string} email user email
 * @param {string} domain current website domain name
 * @param {string} password user password in hash formate
 */
router.post('/update-password', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const password = _.get(req, 'body.password', '')
        if (_.isEmpty(password)) return errorResponseWithHTTPStatus(res, {}, 'Invalid password', HTTP_BAD_REQUEST_400)

        const query = { email: email, universal_login_merged_domains: { $in: domain } }
        const update = { $set: { password: password } }

        const universalUser = await updateUniversalUserPassword(domain, query, update, 'password')
        let universalAccountCount = 0
        if (!_.isEmpty(universalUser)) {
            universalAccountCount = universalUser.universal_login_merged_domains.length
        } else {
            await AllWebsiteUsers.updateOne({ email: email, domain: domain, is_blocked: { $ne: true }, is_deleted: { $ne: true } }, update)
        }

        return successResponse(res, { universalAccountCount }, 'Password update successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while update password')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in update user password', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description update user payment method
 *
 * @param {string} email user email
 * @param {string} sourceDomain source domain
 * @param {string} paymentMethod user payment method 'credit_card' or 'crypto_currency'
 */
router.post('/update-user-payment-method', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const paymentMethod = _.get(req, 'body.paymentMethod', '')
        if (_.isEmpty(paymentMethod)) return errorResponseWithHTTPStatus(res, {}, 'Payment method require', HTTP_BAD_REQUEST_400)

        const filter = { email, universal_login_merged_domains: { $in: sourceDomain } }
        const update = { default_payment_method: paymentMethod === 'crypto_currency' ? 'crypto_currency' : 'credit_card' }
        const universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, 'card')
        if (_.isEmpty(universalUser)) {
            await AllWebsiteUsers.updateOne({ email: email, domain: sourceDomain, is_blocked: { $ne: true }, is_deleted: { $ne: true } }, update)
        }

        return successResponse(res, {}, 'Update user payment method successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while update user payment method')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in save user payment method', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Add new card
 *
 * @param {string} email user email
 * @param {string} sourceDomain source domain
 * @param {object} cardDetails card details
 */
router.post('/add-new-card', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const cardDetails = _.get(req, 'body.cardDetails', {})
        if (_.isEmpty(cardDetails)) return errorResponseWithHTTPStatus(res, {}, 'Card details require', HTTP_BAD_REQUEST_400)

        const universalMergeDomainList = await UniversalUsers.findOne({ email, universal_login_merged_domains: { $in: sourceDomain } }, 'universal_login_merged_domains user_deleted_domains user_blocked_domains')
        const universalMergeDomain = _.get(universalMergeDomainList, 'universal_login_merged_domains', [])
        const deleteDomain = _.get(universalMergeDomainList, 'user_deleted_domains', [])
        const blockDomain = _.get(universalMergeDomainList, 'user_blocked_domains', [])

        // Check Card is already exist for user
        const isCardExist = await AllWebsiteCards.exists({ email, card_id: cardDetails.card_id, is_deleted: { $ne: true }, domain: { $in: universalMergeDomain } })
        if (!_.isEmpty(isCardExist)) return errorResponseWithHTTPStatus(res, {}, 'Card already exits', HTTP_BAD_REQUEST_400)

        const card = new AllWebsiteCards(cardDetails)
        card.email = email
        card.domain = sourceDomain
        card.is_primary = true

        const filter = { email, universal_login_merged_domains: { $in: sourceDomain } }
        const update = { card_id: card.card_id, default_payment_method: 'credit_card', payment_gateway: card.payment_gateway }
        const universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, 'card')

        let domainList = [sourceDomain]
        if (!_.isEmpty(universalUser)) {
            domainList = universalUser.universal_login_merged_domains
        }

        if (!_.isEmpty(universalUser) && !_.isEmpty(deleteDomain)) {
            domainList.push(...deleteDomain)
        }

        if (!_.isEmpty(universalUser) && !_.isEmpty(blockDomain)) {
            domainList.push(...blockDomain)
        }
        const nonUniversalUser = await AllWebsiteUsers.find({ email, is_previously_universal_user: true }, 'domain')
        if (nonUniversalUser.length > 1) {
            const domains = _.map(nonUniversalUser, 'domain')
            domainList.push(...domains)
        }

        // Remove other primary card of user
        await removeUserPrimaryCards(email, domainList)
        await card.save()

        return successResponse(res, {}, 'Card added successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while add new card')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in save user card details', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Update user primary card
 *
 * @param {string} email user email
 * @param {string} sourceDomain source domain
 * @param {string} id card _id
 */
router.post('/update-primary-card', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const id = _.get(req, 'body.id', {})
        if (_.isEmpty(id)) return errorResponseWithHTTPStatus(res, {}, 'Card id require', HTTP_BAD_REQUEST_400)

        const query = { is_deleted: { $ne: true } }
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id
        } else {
            query.card_id = id
        }

        let card = await AllWebsiteCards.findOne({ ...query, domain: sourceDomain }, 'card_id is_primary payment_gateway')

        if (card === null) {
            card = await AllWebsiteCards.findOne(query, 'card_id is_primary payment_gateway')
        }
        if (_.isEmpty(card)) return errorResponseWithHTTPStatus(res, {}, 'Card not found', HTTP_BAD_REQUEST_400)

        const activeCardId = card.card_id

        const filter = { email, universal_login_merged_domains: { $in: sourceDomain } }
        const update = { card_id: activeCardId, default_payment_method: 'credit_card', payment_gateway: card.payment_gateway }
        const universalUser = await updateUniversalUserDetails(filter, update, sourceDomain, 'card')
        const domainList = universalUser.universal_login_merged_domains ? universalUser.universal_login_merged_domains : [sourceDomain]

        if (!_.isEmpty(universalUser.user_blocked_domains)) {
            domainList.push(...universalUser.user_blocked_domains)
        }

        if (!_.isEmpty(universalUser.user_deleted_domains)) {
            domainList.push(...universalUser.user_deleted_domains)
        }

        // update primary card status false for non-universal user who has previously universal user and block from website
        const nonUniversalUser = await AllWebsiteUsers.find({ email, is_previously_universal_user: true }, 'domain')
        if (nonUniversalUser.length > 1) {
            const domains = _.map(nonUniversalUser, 'domain')
            domainList.push(...domains)
        }
        await removeUserPrimaryCards(email, domainList)

        await AllWebsiteCards.updateOne({ _id: card._id }, { $set: { is_primary: true } })
        return successResponse(res, { activeCardId }, 'Primary card update successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while update primary card')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in update primary card', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description remove user card
 *
 * @param {string} email user email
 * @param {string} id card id
 */
router.post('/remove-user-card', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        // Card _id
        const id = _.get(req, 'body.id', {})
        let query = {
            is_deleted: { $ne: true }
        }
        if (mongoose.Types.ObjectId.isValid(id)) {
            query._id = id
        } else {
            query.card_id = id
        }
        if (_.isEmpty(id)) return errorResponseWithHTTPStatus(res, {}, 'Card id require', HTTP_BAD_REQUEST_400)

        const is_user_universal = _.get(req, 'body.is_user_universal', false)
        const domain = _.get(req, 'body.domain', '')

        if (is_user_universal === false && !_.isEmpty(domain)) {
            query.domain = req.body.domain
        }
        const card = await AllWebsiteCards.findOne(query)
        if (_.isEmpty(card)) return errorResponseWithHTTPStatus(res, {}, 'Card not found', HTTP_BAD_REQUEST_400)
        if (card.is_primary) return errorResponseWithHTTPStatus(res, {}, 'You can not remove primary card', HTTP_BAD_REQUEST_400)

        if (is_user_universal === false) {
            card.is_deleted = true
            await card.save()
        } else if (is_user_universal) {
            const universalUser = await UniversalUsers.findOne({ email }, 'universal_login_merged_domains')

            await AllWebsiteCards.updateMany({
                card_id: card.card_id,
                domain: { $in: universalUser.universal_login_merged_domains }
            }, {
                $set: {
                    is_deleted: true
                }
            })

            if (universalUser.universal_login_merged_domains.length > 1) {
                updateCardDetailsOnWebsites(card.card_id, universalUser.universal_login_merged_domains, domain)
            }
        }

        const removeCardId = card.card_id
        return successResponse(res, { removeCardId }, 'Card remove successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while remove user card')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in remove card details', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Send user card details
 *
 * @param {string} email user email
 * @param {string} sourceDomain current domain
 */
router.post('/get-user-cards', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const universalUser = await UniversalUsers.findOne({ email: email, universal_login_merged_domains: { $in: sourceDomain } }, 'default_payment_method universal_login_merged_domains')
        if (_.isEmpty(universalUser)) return errorResponseWithHTTPStatus(res, {}, 'User not found', HTTP_BAD_REQUEST_400)

        const defaultPaymentMethod = universalUser.default_payment_method
        const userMergedDomains = universalUser.universal_login_merged_domains
        const deletedDomain = universalUser.user_deleted_domains
        const blockDomain = universalUser.user_blocked_domains

        if (_.isEmpty(deletedDomain) === false) {
            userMergedDomains.push(...deletedDomain)
        }

        if (_.isEmpty(blockDomain) === false) {
            userMergedDomains.push(...blockDomain)
        }

        const aggregation = [
            {
                '$match': {
                    'email': email,
                    'domain': { '$in': userMergedDomains },
                    'is_deleted': { '$ne': true }
                }
            }, {
                '$group': {
                    '_id': '$card_id',
                    'doc': {
                        '$first': '$$ROOT'
                    }
                }
            }, {
                '$replaceRoot': {
                    'newRoot': '$doc'
                }
            }, {
                '$sort': {
                    'is_primary': -1,
                    'createdAt': -1
                }
            }, {
                '$project': {
                    '_id': 1,
                    'card_id': 1,
                    'card_type': 1,
                    'is_primary': 1,
                    'subscription_id': 1,
                    'card_last_four_digits': 1,
                    'card_expiration_month_year': 1
                }
            }
        ]

        const userCard = await AllWebsiteCards.aggregate(aggregation)

        const data = {
            userCard,
            defaultPaymentMethod
        }
        return successResponse(res, data, 'Fetch user card details', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get user cards')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in fetch user cards', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Get user default card details for payments
 *
 * @param {string} email user email
 * @param {string} sourceDomain current domain
 */
router.post('/get-user-default-card', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)


        const universalUser = await UniversalUsers.findOne({ email: email, universal_login_merged_domains: { $in: sourceDomain } }, 'card_id')
        if (_.isEmpty(universalUser)) return errorResponseWithHTTPStatus(res, {}, 'User not found', HTTP_BAD_REQUEST_400)

        const cardDetails = await AllWebsiteCards.findOne({ email: email, card_id: universalUser.card_id, is_deleted: { $ne: true } })

        return successResponse(res, cardDetails, 'User default card get successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get user default card')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in get user default card', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description get user card details
 *
 * @param {string} email email
 * @param {string} id card id
 */
router.post('/get-card-details', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const id = _.get(req, 'body.id', '')
        if (_.isEmpty(id)) return errorResponseWithHTTPStatus(res, {}, 'Invalid card id', HTTP_BAD_REQUEST_400)

        const cardDetails = await AllWebsiteCards.findOne({ _id: new mongoose.Types.ObjectId(id), email, is_deleted: { $ne: true } })

        return successResponse(res, cardDetails, 'User default card get successfully')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get card details')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in get user default card', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Check card is exist for user
 * Check card exist while user add new card
 *
 * @param {string} email user email
 * @param {string} card_id card id
 */
router.post('/check-card-exist', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const card_id = _.get(req, 'body.card_id', '')
        if (_.isEmpty(card_id)) return errorResponseWithHTTPStatus(res, {}, 'Invalid card id', HTTP_BAD_REQUEST_400)

        const universalUser = await UniversalUsers.findOne({ email }, 'universal_login_merged_domains user_deleted_domains user_blocked_domains')
        const universalMergeDomain = _.get(universalUser, 'universal_login_merged_domains', [])
        const deletedDomain = universalUser.user_deleted_domains
        const blockDomain = universalUser.user_blocked_domains

        if (_.isEmpty(deletedDomain) === false) {
            universalMergeDomain.push(...deletedDomain)
        }

        if (_.isEmpty(blockDomain) === false) {
            universalMergeDomain.push(...blockDomain)
        }
        const card = await AllWebsiteCards.exists({ email, card_id, is_deleted: { $ne: true }, domain: { $in: universalMergeDomain } })

        const isCardExist = _.isEmpty(card) ? false : true

        return successResponse(res, { isCardExist }, 'Check user card exist')
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while check card exist')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in check user card exist', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/users', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', [])
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        let currentPage = _.get(req, 'body.page', 1)
        currentPage = parseInt(currentPage, 10)

        const query = {}

        if (!_.isEmpty(email)) {
            query.email = email
        }

        if (domain.length > 0) {
            query.universal_login_merged_domains = { $in: domain }
        }

        const totalRows = await UniversalUsers.countDocuments(query)
        const limit = 20
        const totalPage = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit

        const project = {
            email: 1,
            name: 1,
            default_payment_method: 1,
            universal_login_merged_domains: 1,
            createdAt: 1,
            old_email: 1
        }

        let rows = []
        if (totalRows > 0) {
            rows = await UniversalUsers.find(query, project).sort({ createdAt: -1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            currentPage: currentPage,
            limit: limit,
            totalRows: totalRows,
            totalPages: totalPage
        }

        return successResponse(res, data, 'Universal login users detail retrieved successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get universal user details')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in getting Universal login users', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/all-website-users', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', [])
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        let currentPage = _.get(req, 'body.page', 1)
        currentPage = parseInt(currentPage, 10)

        const query = {}

        if (!_.isEmpty(email)) {
            query.email = email
        }

        if (domain.length > 0) {
            query.domain = { $in: domain }
        }

        const totalRows = await AllWebsiteUsers.countDocuments(query)
        const limit = 20
        const totalPage = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit

        const project = {
            domain: 1,
            email: 1,
            default_payment_method: 1,
            createdAt: 1
        }

        let rows = []
        if (totalRows > 0) {
            rows = await AllWebsiteUsers.find(query, project).sort({ createdAt: -1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            currentPage: currentPage,
            limit: limit,
            totalRows: totalRows,
            totalPages: totalPage
        }

        return successResponse(res, data, 'All website users detail retrieved successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get all website user')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in getting all website users', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/cards', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        const card_id = _.get(req, 'body.card_id', '').trim()
        const subscription_id = _.get(req, 'body.subscription_id', '').trim()
        const sticky_io_order_id = _.get(req, 'body.sticky_io_order_id', '').trim()
        const last_four_digit = _.get(req, 'body.card_last_four_digits', '').trim()
        const payment_gateway = _.get(req, 'body.payment_gateway', '').trim()
        const domain = _.get(req, 'body.domain', [])
        const cardHolderName = _.get(req, 'body.card_holder_name', '').trim()
        let currentPage = _.get(req, 'body.page', 1)
        currentPage = parseInt(currentPage, 10)

        const query = {}

        if (!_.isEmpty(email)) {
            query.email = email
        }

        if (!_.isEmpty(card_id)) {
            query.card_id = card_id
        }

        if (!_.isEmpty(subscription_id)) {
            query.subscription_id = subscription_id
        }

        if (!_.isEmpty(last_four_digit)) {
            query.card_last_four_digits = last_four_digit
        }

        if (!_.isEmpty(sticky_io_order_id)) {
            query.sticky_io_order_id = sticky_io_order_id
        }

        if (!_.isEmpty(payment_gateway)) {
            query.payment_gateway = payment_gateway
        }

        if (domain.length > 0) {
            query.domain = { $in: domain }
        }

        if (!_.isEmpty(cardHolderName)) {
            query.card_holder_name = cardHolderName
        }

        const totalRows = await AllWebsiteCards.countDocuments(query)
        const limit = 20
        const totalPage = Math.ceil(totalRows / limit)
        let offset = (currentPage - 1) * limit

        let rows = []
        const project = {
            card_id: 1,
            email: 1,
            domain: 1,
            is_primary: 1,
            payment_gateway: 1,
            is_deleted: 1,
            card_type: 1,
            card_last_four_digits: 1,
            card_expiration_month_year: 1,
            subscription_id: 1,
            sticky_io_order_id: 1,
            country: 1,
            card_holder_name: 1,
            createdAt: 1
        }
        if (totalRows > 0) {
            rows = await AllWebsiteCards.find(query, project).sort({ createdAt: -1 }).skip(offset).limit(limit)
        }

        const data = {
            rows: rows,
            currentPage: currentPage,
            limit: limit,
            totalRows: totalRows,
            totalPage: totalPage
        }
        return successResponse(res, data, 'Log data fetched successfully', 200)

    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while get universal user card details')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in fetch universal login card details', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * Add custom note in universal user
 *
 * @param userId userId for add new note
 * @param noteText noteText
 */
router.post('/add-new-note', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const userId = _.get(req, 'body.userId', '')
        if (_.isEmpty(userId)) return errorResponseWithHTTPStatus(res, {}, 'userId is required', HTTP_BAD_REQUEST_400)
        const noteText = _.get(req, 'body.noteText', '').trim()
        if (_.isEmpty(noteText)) return errorResponseWithHTTPStatus(res, {}, 'Note is required', HTTP_BAD_REQUEST_400)

        const note = {
            note: noteText
        }
        const response = await UniversalUsers.findByIdAndUpdate({ _id: userId }, { $push: { notes: note } }, { new: true, projection: { notes: 1 } })
        response.notes.sort((a, b) => b.created_at - a.created_at)
        return successResponse(res, response, 'Note added successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while add new note')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error while add new note', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * Fetch user added note
 *
 * @param userId userId
 */
router.post('/get-user-note', protectRouteWithRole([SUPER_ADMIN, ROLE_SUPPORT]), async (req, res) => {
    try {
        const userId = _.get(req, 'body.userId', '')
        if (_.isEmpty(userId)) return errorResponseWithHTTPStatus(res, {}, 'userId is required', HTTP_BAD_REQUEST_400)
        const userNote = await UniversalUsers.findOne({ _id: userId }, 'notes')

        // sort note by created date
        userNote.notes.sort((a, b) => b.created_at - a.created_at)
        const resData = {
            notes: userNote.notes
        }
        return successResponse(res, resData, 'Note fetch successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while fetch user notes')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error while fetch user notes', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description check user exist with current email
 */
router.post('/get-universal-user', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        let isUniversalUserExists = await UniversalUsers.exists({ email: email })
        if (_.isEmpty(isUniversalUserExists)) {
            isUniversalUserExists = await AllWebsiteUsers.exists({ email: email })
        }
        const universalUser = _.isEmpty(isUniversalUserExists) ? false : true
        return successResponse(res, universalUser, 'Universal user fetch successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while fetch universal login user details')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in fetch universal login user details', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * Update universal and non-universal user email
 *
 * @param {string} email user new email
 * @param {string} oldEmail user old email
 * @param {string} domain user current domain
 */
router.post('/update-user-email', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const oldEmail = _.get(req, 'body.old_email', '')
        if (_.isEmpty(oldEmail)) return errorResponseWithHTTPStatus(res, {}, 'Invalid old email', HTTP_BAD_REQUEST_400)

        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid domain', HTTP_BAD_REQUEST_400)

        const role = _.get(req, 'body.role', '')
        const userName = _.get(req, 'body.name', '')
        const name = !_.isEmpty(role) ? `${userName} (${role})` : userName
        const message = `${name} changed email from ${oldEmail} to ${email} from ${domain}.`
        const notes = { note: message }

        const filter = { email: oldEmail, universal_login_merged_domains: { $in: domain } }
        const update = { $set: { email: email }, $push: { old_email: { email: oldEmail }, notes: notes } }
        const universalUser = await updateUniversalUserDetails(filter, update, domain, 'email', false)
        let universalMergeDomainUpdateEmail = []

        if (_.isEmpty(universalUser)) {
            await AllWebsiteUsers.updateOne({ email: oldEmail, domain: domain, is_blocked: { $ne: true }, is_deleted: { $ne: true } }, { $set: { email: email, old_email: oldEmail } })
            // update email on card and user wallet in current domain
            await AllWebsiteCards.updateMany({ email: oldEmail, domain: domain }, { $set: { email: email } })
            await WalletBalance.updateOne({ email: oldEmail, domain: domain }, { $set: { email: email } })
        } else {
            universalMergeDomainUpdateEmail = universalUser.universal_login_merged_domains
            // update email on user card and wallet on universal merge all domain
            await AllWebsiteCards.updateMany({ email: oldEmail, domain: { $in: universalUser.universal_login_merged_domains } }, { $set: { email: email } })
            await WalletBalance.updateOne({ email: oldEmail, universal_wallet: true }, { $set: { email: email } })
            await WalletTransactions.updateMany({ email: oldEmail, domain: { $in: universalUser.universal_login_merged_domains } }, { $set: { email: email } })
        }
        return successResponse(res, universalMergeDomainUpdateEmail, 'User Email update successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while update user email')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in update user email', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Update user block status
 *
 * @param {string} email user email
 * @param {boolean} blockStatus block status
 * @param {string} note note for history
 * @param {string} sourceDomain source domain
 */
router.post('/update-user-block-status', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid sourceDomain', HTTP_BAD_REQUEST_400)

        const note = _.get(req, 'body.note', '')
        if (_.isEmpty(note)) return errorResponseWithHTTPStatus(res, {}, 'Invalid note', HTTP_BAD_REQUEST_400)

        const subscriptionCancelNote = _.get(req, 'body.cancelSubscriptionNote', '')

        const blockStatus = _.get(req, 'body.blockStatus', false)

        const filter = { email }
        if (blockStatus) {
            filter.universal_login_merged_domains = { $in: sourceDomain }
        } else {
            filter.user_blocked_domains = { $in: sourceDomain }
        }

        const project = 'universal_login_merged_domains password default_payment_method payment_gateway user_blocked_domains notes name payment_gateway email source_domain card_id'
        const universalUser = await UniversalUsers.findOne(filter, project)

        let isUserConvertToNonUniversal = false
        let isConvertToUniversalUser = false
        let wallet_amount = 0
        let password = ''

        // check if universal user exist
        if (_.isEmpty(universalUser)) {
            const nonUniversalUser = await AllWebsiteUsers.findOne({ email, domain: sourceDomain })
            const isPreviouslyUniversalUser = _.get(nonUniversalUser, 'is_previously_universal_user', false)
            if (isPreviouslyUniversalUser === true) {
                isConvertToUniversalUser = true
                const universalUserWithEmail = await UniversalUsers.findOne({ email: email }, project)
                // Convert a non-universal user to a universal user if they were previously a universal user
                if (_.isEmpty(universalUserWithEmail) === true) {
                    let userInfo = {
                        name: nonUniversalUser.name,
                        email: nonUniversalUser.email,
                        password: nonUniversalUser.password,
                        sourceDomain: nonUniversalUser.domain,
                        universal_login_merged_domains: [nonUniversalUser.domain],
                        default_payment_method: nonUniversalUser.default_payment_method
                    }
                    const createUniversalUser = new UniversalUsers(userInfo)
                    await createUniversalUser.save()
                    const walletAmount = await updateWalletAmount(email, sourceDomain)
                    wallet_amount = walletAmount
                } else {
                    universalUserWithEmail.universal_login_merged_domains.push(nonUniversalUser.domain)
                    await universalUserWithEmail.save()
                    const walletAmount = await updateWalletAmount(email, sourceDomain)
                    wallet_amount = walletAmount
                    password = universalUserWithEmail.password
                    const filterQuery = { email, universal_login_merged_domains: { $in: sourceDomain } }
                    const update = { wallet_amount: walletAmount }
                    // update primary card when unblock user if universal user exist with current email
                    if (_.isEmpty(universalUserWithEmail.card_id) === false) {
                        await removeUserPrimaryCards(email, universalUserWithEmail.universal_login_merged_domains)
                        await AllWebsiteCards.updateOne({ email, card_id: universalUserWithEmail.card_id, domain: { $in: universalUserWithEmail.universal_login_merged_domains } }, { $set: { is_primary: true } })
                    }
                    await updateUniversalUserDetails(filterQuery, update, sourceDomain)
                }
                nonUniversalUser.deleteOne()
            } else {
                nonUniversalUser.is_blocked = blockStatus
                nonUniversalUser.save()
            }
        } else {
            if (blockStatus) {
                // block single universal user
                if (universalUser.universal_login_merged_domains.length === 1 && universalUser.user_blocked_domains.length === 0) {
                    const userDetails = {
                        password: universalUser.password,
                        default_payment_method: universalUser.default_payment_method,
                        payment_gateway: universalUser.payment_gateway,
                        is_blocked: true,
                        is_previously_universal_user: true
                    }
                    await AllWebsiteUsers.updateOne({ email, domain: sourceDomain }, { $set: userDetails }, { upsert: true })
                    await universalUser.deleteOne()
                    // remove wallet when block single user
                    await WalletBalance.updateOne({ email: email, universal_wallet: true }, { $set: { domain: sourceDomain, universal_wallet: false } })
                    isUserConvertToNonUniversal = true
                } else {
                    if (_.isEmpty(subscriptionCancelNote) === false) {
                        universalUser.notes.push({ note: `${subscriptionCancelNote} from ${sourceDomain}` })
                    }
                    universalUser.universal_login_merged_domains = universalUser.universal_login_merged_domains.filter((domain) => domain !== sourceDomain)
                    universalUser.user_blocked_domains.push(sourceDomain)
                    universalUser.notes.push({ note: `${note} from ${sourceDomain}` })
                    if (universalUser.universal_login_merged_domains.length === 0) {
                        isUserConvertToNonUniversal = true
                        for (const domain of universalUser.user_blocked_domains) {
                            const userDetails = {
                                password: universalUser.password,
                                default_payment_method: universalUser.default_payment_method,
                                payment_gateway: universalUser.payment_gateway,
                                is_blocked: true,
                                name: universalUser.name,
                                domain: domain,
                                email: universalUser.email,
                                is_previously_universal_user: true
                            }
                            const allWebsiteUser = new AllWebsiteUsers(userDetails)
                            await allWebsiteUser.save()
                        }
                        await WalletBalance.updateOne({ email, universal_wallet: true }, { $set: { amount: 0, domain: universalUser.source_domain, universal_wallet: false } })
                        await universalUser.deleteOne()
                    } else {
                        await universalUser.save()
                    }
                }
            } else {
                if (_.isEmpty(subscriptionCancelNote) === false) {
                    universalUser.notes.push({ note: `${subscriptionCancelNote} from ${sourceDomain}` })
                }
                universalUser.user_blocked_domains = universalUser.user_blocked_domains.filter((domain) => domain !== sourceDomain)
                universalUser.universal_login_merged_domains.push(sourceDomain)
                // While unblocking, check universal merged user cards. If no card is primary, set one card as primary.
                const userCard = await AllWebsiteCards.find({ email, domain: { $in: universalUser.universal_login_merged_domains }, is_deleted: { $ne: true } }).sort({ createdAt: -1 })
                if (!_.isEmpty(userCard)) {
                    const hasPrimary = userCard.some(card => card.is_primary)
                    if (hasPrimary === false) {
                        userCard[0].is_primary = true
                        await userCard[0].save()
                    }
                }
                password = universalUser.password
                universalUser.notes.push({ note: `${note} from ${sourceDomain}` })
                await universalUser.save()
            }
        }

        return successResponse(res, { isUserConvertToNonUniversal, isConvertToUniversalUser, wallet_amount, password }, 'User block status update successfully', 200)
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'Error in update user block status')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in update user block status', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Delete user
 *
 * @param {string} email user email
 * @param {string} deleteEmail deleted email
 * @param {string} note note for history
 * @param {string} sourceDomain source domain
 */
router.post('/delete-user', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)
        const deleteEmail = _.get(req, 'body.deleteEmail', email).toLowerCase().trim()

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid sourceDomain', HTTP_BAD_REQUEST_400)

        const note = _.get(req, 'body.note', '')
        if (_.isEmpty(note)) return errorResponseWithHTTPStatus(res, {}, 'Invalid note', HTTP_BAD_REQUEST_400)

        const subscriptionCancelMessage = _.get(req, 'body.subscriptionCancelMessage', '')

        const filter = { email, universal_login_merged_domains: { $in: sourceDomain } }
        const project = 'universal_login_merged_domains password default_payment_method payment_gateway notes user_deleted_domains'
        const universalUser = await UniversalUsers.findOne(filter, project)

        if (_.isEmpty(universalUser)) {
            await AllWebsiteUsers.updateOne(
                { email, domain: sourceDomain },
                { $set: { email: deleteEmail, is_deleted: true } }
            )
            await AllWebsiteCards.updateMany({ email, domain: sourceDomain }, { $set: { is_deleted: true } })
            await WalletTransactions.updateMany({ email, domain: sourceDomain }, { $set: { email: deleteEmail } })
            await WalletBalance.updateOne({ email, domain: sourceDomain }, { $set: { email: deleteEmail } })
        } else {
            // Check if user universal and exist in single website then remove universal account
            if (universalUser.universal_login_merged_domains.length === 1 && universalUser.user_deleted_domains.length === 0) {
                const userDetails = {
                    email: deleteEmail,
                    password: universalUser.password,
                    default_payment_method: universalUser.default_payment_method,
                    payment_gateway: universalUser.payment_gateway,
                    is_deleted: true
                }
                await AllWebsiteUsers.updateOne({ email, domain: sourceDomain }, { $set: userDetails }, { upsert: true })
                await AllWebsiteCards.updateMany({ email, domain: sourceDomain }, { $set: { is_deleted: true } })
                await WalletTransactions.updateMany({ email, domain: sourceDomain }, { $set: { email: deleteEmail } })
                await WalletBalance.updateOne({ email, universal_wallet: true }, { $set: { email: deleteEmail, universal_wallet: false } })
                await universalUser.deleteOne()
            } else {
                if (_.isEmpty(subscriptionCancelMessage) === false) {
                    universalUser.notes.push({ note: `${subscriptionCancelMessage} from ${sourceDomain}` })
                }
                universalUser.universal_login_merged_domains = universalUser.universal_login_merged_domains.filter((domain) => domain !== sourceDomain)
                universalUser.user_deleted_domains.push(sourceDomain)
                universalUser.notes.push({ note: `${note} from ${sourceDomain}` })
                if (universalUser.universal_login_merged_domains.length === 0) {
                    await AllWebsiteCards.updateMany({ email }, { $set: { is_deleted: true } })
                    await WalletTransactions.updateMany({ email }, { $set: { email: deleteEmail } })
                    await WalletBalance.updateOne({ email, universal_wallet: true }, { $set: { email: deleteEmail, universal_wallet: false } })
                    await universalUser.deleteOne()
                } else {
                    await universalUser.save()
                }
            }
        }
        return successResponse(res, {}, 'User deleted successfully', 200)
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'There was a problem in deleted user')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        console.error('Error in delete user account', error)
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in delete user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Block user universally
 *
 * @param {string} email user email
 * @param {string} note note for history
 * @param {string} sourceDomain source domain
 */
router.post('/block-user-universally', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email)) return errorResponseWithHTTPStatus(res, {}, 'Invalid email', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        if (_.isEmpty(sourceDomain)) return errorResponseWithHTTPStatus(res, {}, 'Invalid sourceDomain', HTTP_BAD_REQUEST_400)
        const note = _.get(req, 'body.note', '')

        const adminName = _.get(req, 'body.adminName', '')
        if (_.isEmpty(adminName)) return errorResponseWithHTTPStatus(res, {}, 'Invalid admin name', HTTP_BAD_REQUEST_400)

        const role = _.get(req, 'body.role', '')
        if (_.isEmpty(role)) return errorResponseWithHTTPStatus(res, {}, 'Invalid role', HTTP_BAD_REQUEST_400)

        const cancelSubscriptionStatus = _.get(req, 'body.cancelSubscriptionStatus', false)

        const website = await Website.findOne({ website_url: sourceDomain }, 'website_id')
        const blockCode = await BlockCodes.findOne({ code: 999 })

        const blockUser = new BlockedUsers({
            domain_id: 0,
            type: 0,
            field: email,
            block_code_id: blockCode._id || '',
            status: 'processed',
            source_domain: website.website_id
        })
        await blockUser.save()

        const query = { email }
        const blockNote = `${note} from ${sourceDomain}`
        const noteArray = [{ note: blockNote }]
        if (cancelSubscriptionStatus === true) {
            noteArray.push({ note: `${adminName} (${role}) cancel subscription while block user universally from ${sourceDomain}` })
        }
        const update = { $set: { is_blocked: true }, $push: { notes: { $each: noteArray } } }
        const user = await UniversalUsers.findOneAndUpdate(query, update, { new: true })
        await AllWebsiteUsers.updateMany({ email }, { $set: { is_blocked: true } })

        const universalMergedDomain = _.get(user, 'universal_login_merged_domains', [])
        const blockUserUniversally = await updateUniversallyBlockStatus(email, blockNote, adminName, role, universalMergedDomain, sourceDomain)
        return successResponse(res, blockUserUniversally, 'User block universally successfully', 200)
    } catch (error) {
        const errorMessage = _.get(error, 'message', 'There was a problem in block user universally')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        console.error('Error in block user universally', error)
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'There was a problem in block user universally', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/statistics', async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', [])
        const start_date = _.get(req, 'body.start_date', moment().subtract(6, 'days'))
        const end_date = _.get(req, 'body.end_date', moment())

        const startDate = moment(start_date, 'MM/DD/YYYY').startOf('day')
        const endDate = moment(end_date, 'MM/DD/YYYY').endOf('day')

        let matchQuery = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }

        if (_.isEmpty(domain) === false) {
            matchQuery.domain = { $in: domain }
        }

        const chartData = await UniversalLoginEventLogs.aggregate([
            {
                '$match': matchQuery
            }, {
                '$group': {
                    '_id': {
                        'date': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$createdAt'
                            }
                        }
                    },
                    'autoMerge': {
                        '$sum': {
                            '$cond': [
                                {
                                    '$in': [
                                        '$event', [LOGIN_MERGE, REGISTER]
                                    ]
                                }, 1, 0
                            ]
                        }
                    },
                    'manuallyMerge': {
                        '$sum': {
                            '$cond': [
                                {
                                    '$in': [
                                        '$event', [ADD_ACCOUNT, MERGE_ACCOUNT, MERGE_ACCOUNT_FROM_RESET_PASSWORD]
                                    ]
                                }, 1, 0
                            ]
                        }
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'date': '$_id.date',
                    'autoMerge': 1,
                    'manuallyMerge': 1
                }
            }, {
                '$sort': {
                    'date': -1
                }
            }
        ])

        const statisticsData = [['Date', 'Auto Merge', 'Manual Merge']]
        const allDates = getDatesArray(startDate, endDate)

        for (const date of allDates) {
            const formatDate = moment(date).format('DD/MM/YYYY').toString()
            const dateData = chartData.find((item) => moment(item.date).format('DD/MM/YYYY').toString() === formatDate)
            if (_.isEmpty(dateData)) {
                statisticsData.push([formatDate, 0, 0])
            } else {
                statisticsData.push([formatDate, dateData.autoMerge, dateData.manuallyMerge])
            }
        }

        const universalUsersQuery = []

        const universalUserMatchQuery = {
            $match: {
                is_blocked: { $ne: true }
            }
        }

        if (domain.length > 0) universalUserMatchQuery['$match'].source_domain = { $in: domain }
        universalUsersQuery.push(universalUserMatchQuery)


        universalUsersQuery.push(
            {
                $project: {
                    _id: 0,
                    single_site_users: {
                        $cond: {
                            if: { $eq: [{ $size: '$universal_login_merged_domains' }, 1] },
                            then: 1,
                            else: 0
                        }
                    },
                    multiple_site_users: {
                        $cond: {
                            if: { $gt: [{ $size: '$universal_login_merged_domains' }, 1] },
                            then: 1,
                            else: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: 0,
                    singleSiteUsers: { $sum: '$single_site_users' },
                    multipleSiteUsers: { $sum: '$multiple_site_users' }
                }
            }
        )

        let universalUsers = await UniversalUsers.aggregate(universalUsersQuery)
        const universalUsersCounts = universalUsers.length > 0 ? universalUsers[0] : { singleSiteUsers: 0, multipleSiteUsers: 0 }

        // let nonUniversalUsersOnMultipleSites = await AllWebsiteUsers.aggregate([
        //     {
        //         $group: {
        //             _id: '$email',
        //             count: {
        //                 $sum: 1
        //             }
        //         }
        //     },
        //     {
        //         $match: {
        //             count: {
        //                 $gt: 1
        //             }
        //         }
        //     },
        //     {
        //         $count: 'total'
        //     }
        // ])

        // nonUniversalUsersOnMultipleSites = nonUniversalUsersOnMultipleSites[0] ? nonUniversalUsersOnMultipleSites[0].total : 0

        return successResponse(res, { statisticsData, universalUsersCounts }, 'Statistics get successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponseWithHTTPStatus(res, {}, 'Error in get statistics', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

/**
 * @description Sync user subscription status
 *
 * @param {string} email user email
 */
router.post('/update-user-subscription-status', protectWebsiteRoute, async (req, res) => {
    try {
        const email = _.get(req, 'body.email', '').toLowerCase().trim()
        if (_.isEmpty(email) || Validator.isEmail(email) === false) return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)

        const sourceDomain = _.get(req, 'body.sourceDomain', '')
        const subscriptionStatus = _.get(req, 'body.subscription_status', null)
        const ccbillSubscriptionStatus = _.get(req, 'body.ccbill_subscription_status', '')
        const userId = _.get(req, 'body.user_id', '')
        if (_.isEmpty(sourceDomain) || _.isBoolean(subscriptionStatus) === false || _.isEmpty(ccbillSubscriptionStatus) || _.isEmpty(userId)) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const website = await Website.findOne({ website_url: sourceDomain }, 'website_url')
        if (_.isEmpty(website)) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const universalUser = await UniversalUsers.findOne({ email }, 'email universal_login_website_details universal_login_merged_domains user_blocked_domains')
        if (_.isEmpty(universalUser)) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        if (_.get(universalUser, 'user_blocked_domains', []).includes(sourceDomain)) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        if (_.get(universalUser, 'universal_login_merged_domains', []).includes(sourceDomain) === false) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }

        const websiteDetails = Array.isArray(universalUser.universal_login_website_details) ? universalUser.universal_login_website_details : []
        const existingIndex = websiteDetails.findIndex((detail) => detail && detail.domain === sourceDomain)

        if (existingIndex >= 0) {
            const previousDetail = websiteDetails[existingIndex]
            websiteDetails[existingIndex] = {
                domain: sourceDomain,
                subscription_status: subscriptionStatus,
                ccbill_subscription_status: ccbillSubscriptionStatus,
                is_subscribed_ever: _.get(previousDetail, 'is_subscribed_ever', false),
                user_id: _.get(previousDetail, 'user_id', userId)
            }
        } else {
            websiteDetails.push({
                domain: sourceDomain,
                subscription_status: subscriptionStatus,
                ccbill_subscription_status: ccbillSubscriptionStatus,
                is_subscribed_ever: false,
                user_id: userId
            })
        }

        universalUser.universal_login_website_details = websiteDetails
        await universalUser.save()

        return successResponse(res, {}, 'User subscription status updated successfully', 200)
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while update subscription status')
        const errorName = _.get(error, 'name', '')
        const errorStack = _.get(error, 'stack', {})
        return errorResponseWithHTTPStatus(res, { message: errorMessage, name: errorName, stack: errorStack }, 'Error in update subscription status', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

router.post('/create-user', protectWebsiteRoute, async (req, res) => {

    try {
        const { email, domain } = req.body
        if (!email || !domain) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }
        const universalUser = await UniversalUsers.findOne({
            email
        }, 'email password name universal_login_merged_domains user_blocked_domains')

        if (universalUser.user_blocked_domains.includes(domain)) {
            return errorResponseWithHTTPStatus(res, {}, 'Invalid request', HTTP_BAD_REQUEST_400)
        }
        const data = {
            email,
            password: universalUser.password,
            name: universalUser.name,
            sourceDomain: domain
        }
        await registerUserInWebsite(data)
        universalUser.universal_login_merged_domains.push(domain)
        await universalUser.save()
        return successResponse(res, universalUser, 'User created successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponseWithHTTPStatus(res, {}, 'Error in create user', HTTP_INTERNAL_SERVER_ERROR_500)
    }
})

module.exports = router
