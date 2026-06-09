const WebsiteDailyEarningReport = require('../models/WebsiteDailyEarningReport')
const WebsiteCommission = require('../models/WebsiteCommission')


/**
 * @description update Sticky.io real Charge with fixed charge
 */
async function updateStickyIoRealChargeWithFixedCharge() {
    const websiteEarningReport = await WebsiteDailyEarningReport.find({ payment_gateway: 'sticky.io' })
    console.log('Total Records Needs to update: ', websiteEarningReport.length)
    for (const websiteEarning of websiteEarningReport) {
        const update = {
            $set: {
                sticky_io_charge: websiteEarning.fixed_sticky_io_charge,
                model_earning: websiteEarning.fixed_model_earning,
                platform_earning: websiteEarning.fixed_platform_earning,
                referral_amount: websiteEarning.referral_amount_for_fixed_charge,
                referral_amount1: websiteEarning.referral_amount1_for_fixed_charge,
                referral_amount2: websiteEarning.referral_amount2_for_fixed_charge
            }
        }
        await WebsiteDailyEarningReport.updateOne({ _id: websiteEarning._id }, update)
    }
    console.log('Website Daily Earning Updated')
}

/**
 * @description Add CCBill Fixed Transaction Charge
 */
async function addCCBillFixedTransactionCharge() {
    await WebsiteCommission.updateMany({ $set: { ccbill_transaction_charge: '0.15' } })
    console.log('Website Commission Updated')
}

module.exports = {
    updateStickyIoRealChargeWithFixedCharge,
    addCCBillFixedTransactionCharge
}
