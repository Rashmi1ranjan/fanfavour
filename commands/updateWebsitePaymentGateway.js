const Website = require('./../models/Website')
const WebsiteEarningReports = require('./../models/WebsiteDailyEarningReport')
const WebsiteCommission = require('./../models/WebsiteCommission')

/**
 * @description assign ccbill payment gateway to existing websites
 */
async function updateWebsitePaymentGateway() {
    console.log('Command execution started')
    await Website.updateMany({ payment_gateway: { $exists: false } }, { $set: { payment_gateway: 'ccbill' } }, { multi: true })
    console.log('Payment Gateway updated in Website collection')
    await WebsiteEarningReports.updateMany({ payment_gateway: { $exists: false } }, { $set: { payment_gateway: 'ccbill' } }, { multi: true })
    console.log('Payment Gateway updated in WebsiteEarningReports collection')
    await WebsiteCommission.updateMany({ payment_gateway: { $exists: false } }, { $set: { payment_gateway: 'ccbill' } }, { multi: true })
    console.log('Payment Gateway updated in WebsiteCommission collection')
    console.log('Command execution Completed')
}

module.exports = {
    updateWebsitePaymentGateway
}
