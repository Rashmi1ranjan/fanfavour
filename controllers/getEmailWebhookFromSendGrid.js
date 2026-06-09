const express = require('express')
const router = express.Router()
const WebhookFromSendGrid = require('./../models/WebhooksFromSendGrid')
const SendGridWebhooksCount = require('./../models/sendGridWebhooksCount')
const { BOUNCE, OPEN, CLICK, SPAMREPORT, DROPPED, PROCESSED, DELIVERED } = require('./../constants')
const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')

router.post('/get_webhook_of_email_from_send_grid', async (req, res) => {
    const body = req.body

    if (body.length > 0) {
        for (let element of body) {
            const event = element.event

            if (!['change_email', 'opt_in_email', 'forgot_password', 'send_private_message', 'send_mass_message', 'go_live_stream'].includes(element.type)) {
                return res.send({ message: 'get webhook successfully' })
            }
            if (!['noreply@themccandlessgroup.com', 'noreply@mccandlessgroupalerts.com'].includes(element.emailFrom)) {
                return res.send({ message: 'get webhook successfully' })
            }

            if (![OPEN, CLICK, BOUNCE, SPAMREPORT, DROPPED, PROCESSED, DELIVERED].includes(event)) {
                return res.send({ message: 'get webhook successfully' })
            }

            const condition = {
                sg_message_id: element.sg_message_id,
                domain: element.platformDomainName,
                event: event
            }
            const checkWebhookData = await WebhookFromSendGrid.findOne(condition)
            if (checkWebhookData !== null) {
                return res.send({ message: 'get webhook successfully' })
            }
            let webhookData = new WebhookFromSendGrid()
            webhookData.webhook = element
            webhookData.email = element.email
            webhookData.domain = element.platformDomainName
            webhookData.emailFrom = element.emailFrom
            webhookData.event = event
            webhookData.sg_message_id = element.sg_message_id
            webhookData.createdAt = new Date()
            await webhookData.save()

            incrementSendGridWebhookEventCount(event, element.emailFrom, element.platformDomainName, element.type)
            if ([OPEN, CLICK, BOUNCE, SPAMREPORT, DROPPED].includes(event)) {
                const data = {
                    email: element.email,
                    event: event === DROPPED ? BOUNCE : element.event
                }
                try {
                    const url = _.replace(element.platformDomainName, 'https://', 'https://api.')
                    const apiUrl = url + '/api/process_email_event'
                    processEmailEvent(apiUrl, data)
                } catch (error) {
                    console.log(error)
                }
            }
        }
    }
    return res.send({ message: 'get webhook successfully' })
})

/**
 *
 * @param {string} apiUrl apiUrl
 * @param {object} data data
 */
async function processEmailEvent(apiUrl, data) {
    try {
        await axios.post(apiUrl, data)
    } catch (error) {
        const errorResponse = _.get(error, 'response.data', error)
        console.log(errorResponse)
    }
}

/**
 * 
 * @param {string} event event possible values are dropped, bounce, open, click, spamreport, processed, delivered
 * @param {string} email email
 * @param {string} domain domain
 * @param {string} type type possible values are change_email, opt_in_email, forgot_password, send_private_message, send_mass_message, go_live_stream
 * @returns {boolean} true false
 */
async function incrementSendGridWebhookEventCount(event, email, domain, type) {

    let eventDetailsOfDomain = await getDefaultEmailWebhookCountObject()

    const currentDate = moment().format('YYYY-MM-DDT00:00:00')
    const currentEndDate = moment().format('YYYY-MM-DDT23:59:59')

    let sendGridWebhooksCountData = await SendGridWebhooksCount.findOne({ domain: 'all', createdAt: { $gte: new Date(currentDate), $lte: new Date(currentEndDate) } })

    if (sendGridWebhooksCountData === null) {
        let index
        if (email === 'noreply@themccandlessgroup.com') {
            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'themccandlessgroup', type)
            eventDetailsOfDomain['themccandlessgroup'][index][event] = 1

            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'themccandlessgroup', 'all')
            eventDetailsOfDomain['themccandlessgroup'][index][event] = 1
        } else {
            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'mccandlessgroupalerts', type)
            eventDetailsOfDomain['mccandlessgroupalerts'][index][event] = 1

            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'mccandlessgroupalerts', 'all')
            eventDetailsOfDomain['mccandlessgroupalerts'][index][event] = 1
        }
        let webhookCountData = new SendGridWebhooksCount()
        webhookCountData.webhookCountDetail = eventDetailsOfDomain
        webhookCountData.domain = 'all'
        await webhookCountData.save()
    }

    let sendGridWebhooksCountsOfDomain = await SendGridWebhooksCount.findOne({ domain: domain, createdAt: { $gte: new Date(currentDate), $lte: new Date(currentEndDate) } })
    if (sendGridWebhooksCountsOfDomain === null) {
        let index
        if (email === 'noreply@themccandlessgroup.com') {
            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'themccandlessgroup', type)
            eventDetailsOfDomain['themccandlessgroup'][index][event] = 1
        } else {
            index = await getEventDetailDomainIndex(eventDetailsOfDomain, 'mccandlessgroupalerts', type)
            eventDetailsOfDomain['mccandlessgroupalerts'][index][event] = 1
        }
        let webhookCountData = new SendGridWebhooksCount()
        webhookCountData.webhookCountDetail = eventDetailsOfDomain
        webhookCountData.domain = domain
        await webhookCountData.save()
    }

    let incData = ''
    let condition = ''
    if (email === 'noreply@themccandlessgroup.com') {
        incData = 'webhookCountDetail.themccandlessgroup.$.' + event
        condition = 'webhookCountDetail.themccandlessgroup.type'
    } else {
        incData = 'webhookCountDetail.mccandlessgroupalerts.$.' + event
        condition = 'webhookCountDetail.mccandlessgroupalerts.type'
    }

    try {
        if (sendGridWebhooksCountData !== null) {
            const query = { _id: sendGridWebhooksCountData._id }
            query[condition] = type
            await SendGridWebhooksCount.updateOne(query, { $inc: { [incData]: 1 } })

            query[condition] = 'all'
            await SendGridWebhooksCount.updateOne(query, { $inc: { [incData]: 1 } })
        }

        if (sendGridWebhooksCountsOfDomain !== null) {
            const query = { _id: sendGridWebhooksCountsOfDomain._id }
            query[condition] = type
            await SendGridWebhooksCount.updateOne(query, { $inc: { [incData]: 1 } })

            query[condition] = 'all'
            await SendGridWebhooksCount.updateOne(query, { $inc: { [incData]: 1 } })
        }
    } catch (error) {
        console.log(error.message)
        return false
    }
    return true
}

/**
 *
 * @param {object} eventDetailsArray eventDetailsArray
 * @param {string} emailDomain emailDomain
 * @param {string} type type
 * @returns {number} array index
 */
async function getEventDetailDomainIndex(eventDetailsArray, emailDomain, type) {
    let index = _.findIndex(eventDetailsArray[emailDomain], (n) => {
        return n.type === type
    })
    return index
}

/**
 *
 * @returns {object} common object for webhook count
 */
async function getDefaultEmailWebhookCountObject() {
    const eventTypeArray = ['change_email', 'opt_in_email', 'forgot_password', 'send_private_message', 'send_mass_message', 'go_live_stream', 'all']
    let array = []
    for (let element of eventTypeArray) {
        const eventDetails = {
            dropped: 0,
            bounce: 0,
            open: 0,
            click: 0,
            spamreport: 0,
            processed: 0,
            delivered: 0,
            type: element
        }
        array.push({ ...eventDetails })
    }

    let eventDetailsOfEmailDomain = {
        'themccandlessgroup': JSON.parse(JSON.stringify(array)),
        'mccandlessgroupalerts': JSON.parse(JSON.stringify(array))
    }

    return eventDetailsOfEmailDomain
}

router.post('/get_email_webhook_data', async (req, res) => {
    const domain = _.get(req, 'body.domain', '')
    const startDate = _.get(req, 'body.startDate', '')
    const endDate = _.get(req, 'body.endDate', '')
    const newDomain = _.get(req, 'body.newDomain', '')
    const query = {}
    if (domain !== '') {
        query.domain = 'https://' + domain
    } else {
        query.domain = domain
    }

    if (!_.isEmpty(startDate) && !_.isEmpty(endDate)) {
        let targetStartDate = moment(startDate).format('YYYY-MM-DDT00:00:00')
        let targetEndDate = moment(endDate).format('YYYY-MM-DDT23:59:59')
        query.createdAt = {
            $gte: new Date(targetStartDate),
            $lte: new Date(targetEndDate)
        }
    }

    const eventCount = await getAggregateWithEventType(query, newDomain)

    return res.send({
        eventCount
    })
})

/**
 * get aggregate amount with specific event type
 *
 * @param {object} query query
 * @param {string} newDomain possible values are all themccandlessgroup mccandlessgroupalerts
 * @returns {number} count
 */
async function getAggregateWithEventType(query, newDomain) {
    let rows = []

    rows = await SendGridWebhooksCount.aggregate([{
        $match: query
    }
    ])

    const themccandlessgroupEmailEventsArray = _.map(rows, (n) => {
        return n.webhookCountDetail.themccandlessgroup
    })

    const mccandlessgroupalertsEmailEventsArray = _.map(rows, (n) => {
        return n.webhookCountDetail.mccandlessgroupalerts
    })

    let themccandlessgroupEmailEventDetails = []
    if (['all', 'themccandlessgroup'].includes(newDomain)) {
        themccandlessgroupEmailEventDetails = await getEmailEventDetailsByEmailDomain(themccandlessgroupEmailEventsArray)
    }

    let mccandlessgroupalertsEmailEventDetails = []
    if (['all', 'mccandlessgroupalerts'].includes(newDomain)) {
        mccandlessgroupalertsEmailEventDetails = await getEmailEventDetailsByEmailDomain(mccandlessgroupalertsEmailEventsArray)
    }

    let webhookCountDetails = []
    if (newDomain === 'all') {
        for (let i = 0; i < themccandlessgroupEmailEventDetails.length; i++) {
            webhookCountDetails.push({
                type: themccandlessgroupEmailEventDetails[i].type,
                forgotPassword: (themccandlessgroupEmailEventDetails[i].forgotPassword + mccandlessgroupalertsEmailEventDetails[i].forgotPassword).toString(),
                changeEmail: (themccandlessgroupEmailEventDetails[i].changeEmail + mccandlessgroupalertsEmailEventDetails[i].changeEmail).toString(),
                optInEmail: (themccandlessgroupEmailEventDetails[i].optInEmail + mccandlessgroupalertsEmailEventDetails[i].optInEmail).toString(),
                notification: (themccandlessgroupEmailEventDetails[i].notification + mccandlessgroupalertsEmailEventDetails[i].notification).toString(),
                all: (themccandlessgroupEmailEventDetails[i].all + mccandlessgroupalertsEmailEventDetails[i].all).toString()
            })
        }
    } else if (newDomain === 'themccandlessgroup') {
        for (let i = 0; i < themccandlessgroupEmailEventDetails.length; i++) {
            webhookCountDetails.push({
                type: themccandlessgroupEmailEventDetails[i].type,
                forgotPassword: themccandlessgroupEmailEventDetails[i].forgotPassword.toString(),
                changeEmail: themccandlessgroupEmailEventDetails[i].changeEmail.toString(),
                optInEmail: themccandlessgroupEmailEventDetails[i].optInEmail.toString(),
                notification: themccandlessgroupEmailEventDetails[i].notification.toString(),
                all: themccandlessgroupEmailEventDetails[i].all.toString()
            })
        }
    } else if (newDomain === 'mccandlessgroupalerts') {
        for (let i = 0; i < mccandlessgroupalertsEmailEventDetails.length; i++) {
            webhookCountDetails.push({
                type: mccandlessgroupalertsEmailEventDetails[i].type,
                forgotPassword: mccandlessgroupalertsEmailEventDetails[i].forgotPassword.toString(),
                changeEmail: mccandlessgroupalertsEmailEventDetails[i].changeEmail.toString(),
                optInEmail: mccandlessgroupalertsEmailEventDetails[i].optInEmail.toString(),
                notification: mccandlessgroupalertsEmailEventDetails[i].notification.toString(),
                all: mccandlessgroupalertsEmailEventDetails[i].all.toString()
            })
        }
    }
    return webhookCountDetails
}

/**
 *
 * @param {Array} emailEventsArray themccandlessgroup array
 * @returns {object} count
 */
async function getEmailEventDetailsByEmailDomain(emailEventsArray) {
    const eventTypeArray = ['change_email', 'opt_in_email', 'forgot_password', 'send_private_message', 'send_mass_message', 'go_live_stream', 'all']
    let forgotPassword = []
    let changeEmail = []
    let optInEmail = []
    let notification = []
    let all = []
    for (let eventType of eventTypeArray) {
        for (let element of emailEventsArray) {
            let data = _.filter(element, (n) => {
                return n.type === eventType
            })
            if (eventType === 'change_email') {
                changeEmail.push(data[0])
            } else if (eventType === 'opt_in_email') {
                optInEmail.push(data[0])
            } else if (eventType === 'forgot_password') {
                forgotPassword.push(data[0])
            } else if (['send_private_message', 'send_mass_message', 'go_live_stream'].includes(eventType)) {
                notification.push(data[0])
            } else if (eventType === 'all') {
                all.push(data[0])
            }
        }
    }

    const eventArray = ['processed', 'dropped', 'bounce', 'open', 'click', 'spamreport', 'delivered']
    const eventHeadingArray = ['Processed', 'Dropped', 'Bounce', 'Open', 'Click', 'Spam Report', 'Delivered']

    const object = []

    for (let i = 0; i < eventArray.length; i++) {
        const eventType = eventArray[i]
        object.push({
            type: eventHeadingArray[i],
            forgotPassword: _.sumBy(forgotPassword, (n) => { return n[eventType] }),
            changeEmail: _.sumBy(changeEmail, (n) => { return n[eventType] }),
            optInEmail: _.sumBy(optInEmail, (n) => { return n[eventType] }),
            notification: _.sumBy(notification, (n) => { return n[eventType] }),
            all: _.sumBy(all, (n) => { return n[eventType] })
        })
    }

    return object
}

module.exports = router
