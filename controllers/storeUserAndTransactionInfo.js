const AllWebsiteCards = require('../models/AllWebsiteCards')
const UsersCard = require('../models/usersCard')
const UsersTransaction = require('../models/usersTransaction')
const WebsiteUsers = require('../models/websiteUsers')
const UnsubscribedUserDump = require('../models/UnsubscribedUserDump')
const stickyIoTransactionReports = require('../models/StickyIoTransactionReport')
const { successResponse } = require('../utils')
const express = require('express')
const router = express.Router()

router.post('/store-user-info-and-transaction', async (req, res) => {
    try {
        const { userData, transactions } = req.body
        const totalUserCardCount = await AllWebsiteCards.countDocuments({ user_id: userData._id })
        userData.totalCardAdded = totalUserCardCount

        const totalUserCard = await AllWebsiteCards.find({ user_id: userData._id }, 'card_holder_name card_last_four_digits card_expiration_month_year card_type card_id createdAt ip')

        const userCardData = totalUserCard.map((card) => {
            return {
                name: card.card_holder_name,
                last_4_digit: card.card_last_four_digits,
                expiry_date: card.card_expiration_month_year,
                card_type: card.card_type,
                card_id: card.card_id,
                date_added: card.createdAt,
                ip: card.ip
            }
        })
        await UsersCard.insertMany(userCardData)

        const stickyIoTransaction = await stickyIoTransactionReports.findOne({ pcp_user_id: userData._id, transaction_type: 'REBILL' }, 'transaction_type amount transaction_date pcp_user_id')
        if (stickyIoTransaction !== null) {
            transactions.push({
                transaction_type: stickyIoTransaction.transaction_type,
                amount: stickyIoTransaction.amount,
                transaction_date: stickyIoTransaction.transaction_date,
                payment_gateway: 'sticky.io',
                description: '',
                user_id: stickyIoTransaction.user_id
            })
        }

        const userTransactionData = transactions.map((transaction) => {
            return {
                transaction_for: transaction.transaction_type,
                amount: transaction.amount,
                transaction_date: transaction.transaction_date,
                payment_gateway: transaction.payment_gateway,
                description: transaction.description,
                user_ip: transaction.ip_address,
                user_id: transaction.user_id
            }
        })

        await UsersTransaction.insertMany(userTransactionData)

        const userInfo = {
            user_id: userData._id,
            email: userData.email,
            domain: userData.domain,
            amount_spent: userData.total_amount_spent,
            name: userData.name,
            country: userData.country,
            registration_date: userData.registration_date,
            date_subscribed: userData.date_subscribed,
            total_card_added: userData.totalCardAdded
        }
        await WebsiteUsers.create(userInfo)
        return successResponse(res, {}, 'Store user data successfully', 200)
    } catch (error) {
        console.log('Error while store using info and transaction data', error)
    }
})

router.post('/store-non-subscribed-user-info', async (req, res) => {
    try {
        const { userData } = req.body
        const totalUserCardCount = await AllWebsiteCards.countDocuments({ user_id: userData._id })
        const userInfo = {
            user_id: userData._id,
            email: userData.email,
            domain: userData.domain,
            amount_spent: userData.total_amount_spent,
            name: userData.name,
            country: userData.country,
            registration_date: userData.createdAt,
            date_subscribed: userData.date_subscribed,
            total_card_added: totalUserCardCount
        }
        await UnsubscribedUserDump.create(userInfo)
        return successResponse(res, {}, 'Store user data successfully', 200)
    } catch (error) {
        console.log('Error while store using info and transaction data', error)
    }
})

module.exports = router