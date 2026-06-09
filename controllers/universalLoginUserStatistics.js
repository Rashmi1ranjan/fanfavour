const express = require('express')
const router = express.Router()
const WebsiteUser = require('./../models/WebsiteUser')
const WebsiteUserCards = require('./../models/WebsiteUserCards')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { errorResponse, successResponse } = require('../utils')
const _ = require('lodash')

router.post('/', async(req, res) => {
    try {
        const token = req.query.token
        if (token !== API_STATIC_AUTH_TOKEN) {
            return errorResponse(res, {}, 'You are not authorized', 401)
        }

        const user = _.get(req.body, 'users', {})
        const card = _.get(req.body, 'cards', [])

        if (!_.isEmpty(user)) {
            const userId = user._id
            delete user._id
            const userObj = {
                ...user,
                user_id: userId,
                domain: req.body.domain
            }
            const websiteUser = await WebsiteUser.findOne({ user_id: userId, domain: req.body.domain })
            if (websiteUser === null) {
                const userData = new WebsiteUser(userObj)
                await userData.save()
            }
        }

        if (card.length > 0) {
            for (const data of card) {
                const cardObj = {
                    ...data,
                    domain: req.body.domain
                }

                const websiteUserCard = await WebsiteUserCards.findOne({ user_id: data.user_id, domain: req.body.domain, card_id: data.card_id })
                if (websiteUserCard === null) {
                    const userCardData = new WebsiteUserCards(cardObj)
                    await userCardData.save()
                }
            }
        }

        return successResponse(res, {}, 'Get User and User Card Data', 200)
    } catch (err) {
        return errorResponse(res, err, 'Invalid Request', 500)
    }
})

module.exports = router
