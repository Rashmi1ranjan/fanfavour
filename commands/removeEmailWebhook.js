const WebhooksFromSendGrid = require('./../models/WebhooksFromSendGrid')
const moment = require('moment')

/**
 * @description Remove Email Webhooks
 */
async function removeEmailWebhook() {
    const targetDate = moment().subtract(7, 'days').format('YYYY-MM-DDT00:00:00')
    const emailWebhooks = await WebhooksFromSendGrid.deleteMany({ createdAt: {$lte: new Date(targetDate)} })
    console.log(emailWebhooks)
    return
}

module.exports = { removeEmailWebhook }
