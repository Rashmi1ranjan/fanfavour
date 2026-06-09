const _ = require('lodash')
const axios = require('axios')
const AllWebsiteCards = require('../models/AllWebsiteCards')
const AllWebsiteUsers = require('../models/AllWebsiteUsers')
const Website = require('../models/Website')
const UniversalUsers = require('../models/UniversalUsers')
const bcrypt = require('bcryptjs')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { addUniversalLog } = require('./universalLoginLogger')
const { UPDATE_USER_DETAILS_IN_WEBSITE_ERROR, restrictedDomains } = require('./universalLoginConstant')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * @description Remove user primary cards
 *
 * @param {string} email user email
 * @param {string} domainList domain list
 */
async function removeUserPrimaryCards(email, domainList) {
    await AllWebsiteCards.updateMany({ email, domain: { $in: domainList } }, { $set: { is_primary: false } })
}

/**
 * @description Update user details in all merged domains
 *
 * @param {string} filter user email
 * @param {string} update user email
 * @param {string} currentDomain user current domain
 * @param {string} updatedField updated field
 * @param {boolean} upSert add if document is not exist
 * @returns {object} return user details
 */
async function updateUniversalUserDetails(filter, update, currentDomain = '', updatedField = '', upSert = false) {
    const select = {
        _id: 0,
        email: 1,
        password: 1,
        universal_login_merged_domains: 1,
        wallet_amount: 1,
        default_payment_method: 1,
        card_id: 1,
        last_used_crypto_currency: 1,
        name: 1,
        old_email: 1,
        notes: 1,
        user_blocked_domains: 1,
        user_deleted_domains: 1
    }
    const user = await UniversalUsers.findOneAndUpdate(filter, update, { select: select, new: true, upsert: upSert })
    if (_.isEmpty(user)) return {}

    const userObject = _.pick(user, ['email', 'password', 'wallet_amount', 'default_payment_method', 'card_id', 'last_used_crypto_currency', 'old_email', 'notes'])

    let mergedDomains = _.get(user, 'universal_login_merged_domains', [])
    const blockDomain = _.get(user, 'user_blocked_domains', [])

    if (updatedField === 'email' && blockDomain.length > 0) {
        mergedDomains = mergedDomains.concat(blockDomain)
    }

    let existNonUniversalUser = false
    if (updatedField === 'card') {
        const nonUniversalUser = await AllWebsiteUsers.find({ email: filter.email, is_previously_universal_user: true, is_blocked: true, is_deleted: { $ne: true } }, 'domain')
        if (nonUniversalUser.length > 0) {
            const fieldValues = _.map(nonUniversalUser, 'domain')
            mergedDomains = mergedDomains.concat(fieldValues)
            existNonUniversalUser = true
        }
    }

    if (mergedDomains.length < 2) return user

    for (const domain of mergedDomains) {
        if (domain !== currentDomain) {
            const baseUrl = getWebsiteDomain(domain)
            const apiUrl = `${baseUrl}/api/universal-login/update-user-details`
            const data = {
                userDetails: userObject,
                updatedField: updatedField,
                isExistNonUniversalUser: existNonUniversalUser
            }
            axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
                .catch(function (error) {
                    const errorData = _.get(error, 'response.data', error)
                    const loggerMeta = {
                        errorData,
                        filter: JSON.stringify(filter),
                        update: JSON.stringify(update),
                        updatedField
                    }
                    addUniversalLog(user.email, UPDATE_USER_DETAILS_IN_WEBSITE_ERROR, domain, loggerMeta)
                })
        }
    }

    return user
}

/**
 * Update Universal User Details
 *
 * @param {string} currentDomain For ignore to update user details
 * @param {object} query for find user data
 * @param {object} update Update User values
 *
 * @returns {object} return after success or error response
 */
async function updateUniversalUserPassword(currentDomain, query, update) {
    try {
        const project = {
            _id: 0,
            email: 1,
            password: 1,
            universal_login_merged_domains: 1,
            user_blocked_domains: 1,
            user_deleted_domains: 1
        }
        const universalUser = await UniversalUsers.findOneAndUpdate(query, update, { select: project, new: true })

        if (_.isEmpty(universalUser)) return {}
        let universalMergeDomain = _.get(universalUser, 'universal_login_merged_domains', [])

        const universalBlockDomain = _.get(universalUser, 'user_blocked_domains', [])
        if (universalBlockDomain.length > 0) {
            universalMergeDomain = universalUser.universal_login_merged_domains.concat(universalBlockDomain)
        }

        universalMergeDomain.map(async (domain) => {
            if (domain !== currentDomain) {
                const baseUrl = getWebsiteDomain(domain)
                const apiUrl = `${baseUrl}/api/universal-login/update-user-password`
                const data = {
                    password: universalUser.password,
                    email: universalUser.email
                }
                await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
            }
        })
        return universalUser
    } catch (error) {
        console.log(error)
        return {}
    }
}

/**
 * Function to hash password
 *
 * @param {string} password hash password
 * @returns {string} return hash password
 *
 */
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

/**
 * @description Find high used payment method of user while merge old user
 *
 * @param {string} email user email
 * @param {Array} mergedDomains list of merge domain
 * @returns {object} default_payment_method and card id
 */
async function getOldUserPaymentMethodOnMergeAccount(email, mergedDomains) {
    try {
        const userAccounts = await AllWebsiteUsers.find({ email, domain: { $in: mergedDomains } }, 'domain default_payment_method total_amount_spent')
        if (_.isEmpty(userAccounts)) {
            return { default_payment_method: 'credit_card' }
        }
        userAccounts.sort((a, b) => b.total_amount_spent - a.total_amount_spent)
        const highestSpentAccount = userAccounts[0]
        const highestSpentAccountDomain = highestSpentAccount.domain
        let paymentDetails = {
            default_payment_method: highestSpentAccount.default_payment_method === 'crypto_currency' ? 'crypto_currency' : 'credit_card'
        }
        const userCards = await AllWebsiteCards.find({ email, domain: { $in: mergedDomains } }, 'domain card_id is_primary').sort({ createdAt: -1 })


        if (_.isEmpty(userCards) === false) {
            if (userCards.length === 1) {
                paymentDetails.card_id = userCards[0].card_id
            } else {
                const userPrimaryCards = userCards.filter(card => card.is_primary === true)
                if (_.isEmpty(userPrimaryCards)) {
                    paymentDetails.card_id = userCards[0].card_id
                } else {
                    if (userPrimaryCards.length === 1) {
                        paymentDetails.card_id = userPrimaryCards[0].card_id
                    } else {
                        paymentDetails.card_id = userPrimaryCards.find(card => card.domain === highestSpentAccountDomain).card_id
                    }
                }
            }
        }

        return paymentDetails
    } catch (error) {
        console.log(error)
    }

}

/**
 * @description Get all websites user details and card details
 *
 * @param {string} skip skip website count
 * @param {string} limit limit of website to process
 */
async function getAllWebsitesUsersAndCards(skip = 0, limit = 500) {
    let skipNum = parseInt(skip, 10)
    if (_.isNaN(skipNum)) {
        skipNum = 0
    }

    let limitNum = parseInt(limit, 10)
    if (_.isNaN(limitNum)) {
        limitNum = 500
    }

    console.time('Total Time')
    const query = { website_url: { $nin: restrictedDomains }, status: { $in: ['live', 'published'] } }
    const totalWebsites = await Website.find(query).skip(skipNum).limit(limitNum).countDocuments()
    console.log(`The total count of websites ready for processing is ${totalWebsites}.`)

    if (totalWebsites > 0) {
        let processCompletedWebsites = 0

        for await (const website of Website.find(query, { website_url: 1 }).sort({ _id: -1 }).skip(skipNum).limit(limitNum).cursor()) {
            console.time(website.website_url)
            const domainUrl = getWebsiteDomain(website.website_url)

            console.log(`Start process to get ${website.website_url} users`)
            const userRes = await getWebsiteUsers(domainUrl)
            console.log(`Start process to get ${website.website_url} cards`)
            const cardRes = await getWebsiteUsersCards(domainUrl)

            if (userRes.success && cardRes.success) {
                console.table({
                    website: website.website_url,
                    'Total User': userRes.totalUser,
                    'Added User': userRes.addedUsers,
                    'Cards Count': cardRes.totalCards,
                    'Added Cards': cardRes.addedCards
                })
            }

            console.timeEnd(website.website_url)
            processCompletedWebsites++
            console.log(`Completed ${processCompletedWebsites} out of ${totalWebsites} websites data process`)
        }
    }
    console.timeEnd('Total Time')
}

/**
 * @description Get Single website user and card details
 *
 * @param {string} websiteUrl website url without https
 */
async function getWebsiteUserAndCardDetails(websiteUrl) {
    console.time('Total Time: ')
    const isSiteExist = await Website.exists({ website_url: websiteUrl, status: { $in: ['live', 'published'] } })
    if (_.isEmpty(isSiteExist)) {
        console.log(`${websiteUrl} site is not exist`)
        return
    }
    const domainUrl = getWebsiteDomain(websiteUrl)
    const userRes = await getWebsiteUsers(domainUrl)
    const cardRes = await getWebsiteUsersCards(domainUrl)
    if (userRes.success && cardRes.success) {
        console.table({
            website: websiteUrl,
            'Total User': userRes.totalUser,
            'Added User': userRes.addedUsers,
            'Cards Count': cardRes.totalCards,
            'Added Cards': cardRes.addedCards
        })
    }
    console.timeEnd('Total Time: ')
}

/**
 * Get Website Users Details
 *
 * @param {string} domainUrl WebSite domain url
 * @returns {object} Total users
 */
async function getWebsiteUsers(domainUrl) {
    let offset = 0
    let totalUser = 0
    let addedUsers = 0
    let limit = 500

    try {
        const apiUrl = `${domainUrl}/api/get-all-user-details`

        do {
            const response = await axios.post(apiUrl, { offset, limit }, { headers: { token: API_STATIC_AUTH_TOKEN } })
            const users = _.get(response, 'data.data.users', [])
            totalUser = _.get(response, 'data.data.totalUser', 0)

            if (_.isEmpty(users) === false) {
                for (const user of users) {
                    const isUserExist = await UniversalUsers.exists({ email: user.email, universal_login_merged_domains: { $in: user.domain } })
                    if (_.isEmpty(isUserExist)) {
                        const query = { email: user.email, domain: user.domain }
                        const update = _.pick(user, ['name', 'password', 'total_amount_spent', 'is_blocked', 'is_deleted'])
                        update.default_payment_method = user.default_payment_method === 'crypto_currency' ? 'crypto_currency' : 'credit_card'
                        update.total_amount_spent = update.total_amount_spent ? update.total_amount_spent : 0
                        const res = await AllWebsiteUsers.updateOne(query, update, { upsert: true })
                        if (res.upsertedCount === 1) {
                            addedUsers++
                        }
                    }
                }
                offset += users.length
            }
            console.log(`Get ${offset} users out of ${totalUser} users`)
        } while (totalUser !== offset)

        return { totalUser, addedUsers, success: true }
    } catch (error) {
        console.log(`Error in get ${domainUrl} all users. Get user ${offset} out of  ${totalUser}`)
        const errorData = _.get(error, 'response.data', error)
        console.log(errorData)
        return { totalUser, addedUsers, success: false }
    }
}

/**
 * Get Website Users Card Details
 *
 * @param {string} domainUrl WebSite URL
 * @returns {object} Total cards, Status
 */
async function getWebsiteUsersCards(domainUrl) {
    let offset = 0
    let totalCards = 0
    let addedCards = 0
    let limit = 500

    try {
        const apiUrl = `${domainUrl}/api/get-all-user-card-details`

        do {
            const response = await axios.post(apiUrl, { offset, limit }, { headers: { token: API_STATIC_AUTH_TOKEN } })
            const cards = _.get(response, 'data.data.cards', [])
            totalCards = _.get(response, 'data.data.totalCards', 0)
            if (_.isEmpty(cards) === false) {
                for (const card of cards) {
                    const isCardExist = await AllWebsiteCards.exists({ card_id: card.card_id, email: card.email, domain: card.domain })
                    if (_.isEmpty(isCardExist)) {
                        const newCard = new AllWebsiteCards(card)
                        await newCard.save()
                        addedCards++
                    }
                }
                offset += cards.length
            }
            console.log(`Get ${offset} cards out of ${totalCards} cards`)
        } while (totalCards !== offset)
        return { totalCards, addedCards, success: true }
    } catch (error) {
        console.log(`Error in get ${domainUrl} all card. Get cards ${offset} out of ${totalCards}`)
        const errorData = _.get(error, 'response.data', error)
        console.log(errorData)
        return { totalCards, addedCards, success: false }
    }
}

/**
 *
 * @param {email} email current user email
 * @param {object} note user note
 * @param {string} adminName admin user name
 * @param {string} adminRole admin user role
 * @param {Array} universalMergeDomain universalMergeDomain
 * @param {string} sourceDomain user source domain
 * @returns {object} none universal user
 */
async function updateUniversallyBlockStatus(email, note, adminName, adminRole, universalMergeDomain, sourceDomain) {
    const nonUniversalUser = await AllWebsiteUsers.find({ email: email }, 'domain')

    const nonUniversalUserDomain = nonUniversalUser.map(nonUniversalUser => nonUniversalUser.domain)
    universalMergeDomain.push(...nonUniversalUserDomain)

    if (universalMergeDomain.length < 2) return universalMergeDomain
    const removeDomain = []

    for (const domain of universalMergeDomain) {
        if (domain !== sourceDomain) {
            const baseUrl = getWebsiteDomain(domain)
            const apiUrl = `${baseUrl}/api/universal-login/update-universally-block-user-status`
            const data = {
                email: email,
                note: note,
                adminName: adminName,
                adminRole: adminRole,
                sourceDomain: sourceDomain
            }
            await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
                .catch(function (error) {
                    removeDomain.push(domain)
                    const errorData = _.get(error, 'response.data', error)
                    const loggerMeta = {
                        errorData,
                        universalBlock: 'universallyBlock'
                    }
                    addUniversalLog(email, UPDATE_USER_DETAILS_IN_WEBSITE_ERROR, domain, loggerMeta)
                })
        }
    }
    const filterDomain = universalMergeDomain.filter(domain => !removeDomain.includes(domain))
    return filterDomain
}

/**
 * Update remove status of card on merged websites
 *
 * @param {string} cardId Card Hash
 * @param {Array} websiteList Merged websites list
 * @param {string} domain Current domain
 */
async function updateCardDetailsOnWebsites(cardId, websiteList, domain) {
    for (let index = 0; index < websiteList.length; index++) {
        const website = websiteList[index]

        if (website === domain) {
            continue
        }

        const baseUrl = getWebsiteDomain(website)
        const apiUrl = `${baseUrl}/api/universal-login/mark-card-as-deleted`
        const data = {
            card_id: cardId
        }
        await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
    }
}

/**
 * @description Register user in website
 * @param {object} data user data
 * @returns {object} success status and message
 */
async function registerUserInWebsite(data) {
    try {
        const baseUrl = getWebsiteDomain(data.sourceDomain)

        const apiUrl = `${baseUrl}/api/users/register-user`
        const response = await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN } })
        return response.data
    } catch (error) {
        console.log('Error while register user')
        const errorData = _.get(error, 'response.data', error)
        console.log(errorData)
        return { errorData, success: false }
    }
}

/**
 * @description Sync single user's subscription and avatar
 * @param {string} email user email
 * @returns {object} success status and message
 */
async function syncSingleUserSubscription(email) {
    try {
        const user = await UniversalUsers.findOne({ email: email }, { email: 1, universal_login_merged_domains: 1, universal_login_website_details: 1, avatar_url: 1 })
        if (_.isEmpty(user)) return { success: false, message: 'User not found' }

        const activeWebsites = await Website.find({ status: { $in: ['live', 'published'] } }, { website_url: 1 }).lean()
        const activeWebsitesSet = new Set(activeWebsites.map((website) => website.website_url))
        const previousWebsiteDetailsMap = new Map(
            (_.get(user, 'universal_login_website_details', []) || [])
                .filter((detail) => detail && detail.domain)
                .map((detail) => [detail.domain, detail])
        )

        const universalLoginMergedDomains = []
        const universalLoginWebsiteDetails = []
        let avatarUrl = _.get(user, 'avatar_url', '')

        if (!_.isEmpty(user.universal_login_merged_domains)) {
            const domainResults = await Promise.all(user.universal_login_merged_domains.map(async (domain) => {
                if (!activeWebsitesSet.has(domain)) {
                    return null
                }

                try {
                    const baseUrl = getWebsiteDomain(domain)
                    const apiUrl = `${baseUrl}/api/universal-login/get-user-subscription-status-and-avatar`
                    const data = { email: user.email }
                    const response = await axios.post(apiUrl, data, { headers: { token: API_STATIC_AUTH_TOKEN }, timeout: 5000 })
                    const resData = _.get(response, 'data.data', {})

                    return {
                        domain,
                        subscription_status: _.get(resData, 'subscription_status', false),
                        ccbill_subscription_status: _.get(resData, 'ccbill_subscription_status', '0'),
                        is_subscribed_ever: _.get(resData, 'is_subscribed_ever', false),
                        avatar_url: _.get(resData, 'avatar_url', ''),
                        user_id: _.get(resData, 'user_id', '')
                    }
                } catch (error) {
                    console.log(`Error in get user details from ${domain} for user ${user.email}`)
                    const previousWebsiteDetail = previousWebsiteDetailsMap.get(domain)
                    return previousWebsiteDetail || {
                        domain: domain,
                        subscription_status: false,
                        ccbill_subscription_status: '0',
                        is_subscribed_ever: false,
                        avatar_url: ''
                    }
                }
            }))

            for (const domainResult of domainResults) {
                if (_.isEmpty(domainResult)) {
                    continue
                }

                const { avatar_url: domainAvatarUrl, ...websiteDetail } = domainResult
                universalLoginMergedDomains.push(domainResult.domain)
                universalLoginWebsiteDetails.push(websiteDetail)

                if (!_.isEmpty(domainAvatarUrl)) {
                    avatarUrl = domainAvatarUrl
                }
            }
        }

        await UniversalUsers.updateOne({ _id: user._id }, { $set: { universal_login_merged_domains: universalLoginMergedDomains, universal_login_website_details: universalLoginWebsiteDetails, avatar_url: avatarUrl } })
        return { success: true }
    } catch (error) {
        console.log('Error in sync single user subscription and avatar: ', error)
        return { success: false, message: error.message }
    }
}

/**
 * @description update universal user subscription status and avatar url
 */
async function updateUniversalUserSubscriptionAndAvatar() {
    console.time('Total Time')
    try {
        const totalUsers = await UniversalUsers.countDocuments({})
        console.log(`The total count of universal users is ${totalUsers}.`)

        if (totalUsers > 0) {
            let processCompletedUsers = 0
            const cursor = UniversalUsers.find({}, { email: 1 }).cursor()
            const userSyncConcurrency = 5
            let userSyncBatch = []

            for await (const user of cursor) {
                userSyncBatch.push(syncSingleUserSubscription(user.email))

                if (userSyncBatch.length >= userSyncConcurrency) {
                    const batchResults = await Promise.allSettled(userSyncBatch)
                    processCompletedUsers += batchResults.length
                    if (processCompletedUsers % 100 === 0) {
                        console.log(`Completed ${processCompletedUsers} out of ${totalUsers} users process`)
                    }
                    userSyncBatch = []
                }
            }

            if (userSyncBatch.length > 0) {
                const batchResults = await Promise.allSettled(userSyncBatch)
                processCompletedUsers += batchResults.length
                if (processCompletedUsers % 100 === 0 || processCompletedUsers === totalUsers) {
                    console.log(`Completed ${processCompletedUsers} out of ${totalUsers} users process`)
                }
            }
        }
    } catch (error) {
        console.log('Error in update universal user subscription and avatar: ', error)
    }
    console.timeEnd('Total Time')
}


module.exports = {
    removeUserPrimaryCards,
    updateUniversalUserPassword,
    getAllWebsitesUsersAndCards,
    getWebsiteUserAndCardDetails,
    updateUniversalUserDetails,
    hashPassword,
    getOldUserPaymentMethodOnMergeAccount,
    updateUniversallyBlockStatus,
    updateCardDetailsOnWebsites,
    registerUserInWebsite,
    updateUniversalUserSubscriptionAndAvatar,
    syncSingleUserSubscription
}
