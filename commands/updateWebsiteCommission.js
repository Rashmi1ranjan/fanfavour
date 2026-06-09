const WebsiteCommission = require('./../models/WebsiteCommission')
const Website = require('./../models/Website')
const moment = require('moment')
const defaultCommission = {
    platform_commission: 20,
    ccbill_fees: 6.95,
    sticky_io_charges: [
        {
            'payment_gateway': 'ecsuite',
            'model_per_transaction_fixed_charge': '0',
            'model_per_transaction_percentage_charge': '6.95',
            'new_per_transaction_fixed_charge': '0.36',
            'new_per_transaction_percentage_charge': '4.35',
            'void_per_transaction_fixed_charge': '0.06',
            'void_per_transaction_percentage_charge': '0',
            'refund_per_transaction_fixed_charge': '0.06',
            'refund_per_transaction_percentage_charge': '0',
            'declined_per_transaction_fixed_charge': '0',
            'declined_per_transaction_percentage_charge': '0',
            'chargeback_penalty': '25',
            'notes': ''
        },
        {
            'payment_gateway': 'spoton',
            'model_per_transaction_fixed_charge': '0',
            'model_per_transaction_percentage_charge': '6.95',
            'new_per_transaction_fixed_charge': '0.20',
            'new_per_transaction_percentage_charge': '6.15',
            'void_per_transaction_fixed_charge': '0',
            'void_per_transaction_percentage_charge': '-6.15',
            'refund_per_transaction_fixed_charge': '0',
            'refund_per_transaction_percentage_charge': '0',
            'declined_per_transaction_fixed_charge': '0',
            'declined_per_transaction_percentage_charge': '0',
            'chargeback_penalty': '20',
            'notes': 'New Transaction Charge: Authorize.net $0.05 + SpotOn: 0.15 = 0.20'
        }
    ],
    sticky_io_transaction_charge: '0.25'
}

/**
 * @description update website commissions
 */
async function updateWebsiteCommission() {
    try {
        const websites = await Website.find({}, 'website_url')
        if (websites.length > 0) {
            for (const website of websites) {
                const commissions = await updateWebsiteCommissionDetails(website.website_url)
            }
        }
    } catch (error) {
        console.log('Error in Command Process', error)
    }
}

/**
 * @description Get website recent Commission
 * @param {string} domain Website domain
 */
async function updateWebsiteCommissionDetails(domain) {
    try {
        const commissionQuery = { domain: domain }
        const commissions = await WebsiteCommission.find(commissionQuery).sort({ target_date: -1 })

        if (commissions.length > 0) {
            let recentCommission = commissions[0]
            for (const commission of commissions) {
                if (
                    commission.ccbill_fees === '' ||
                    commission.ccbill_fees === undefined
                ) {
                    commission.ccbill_fees = recentCommission.ccbill_fees || defaultCommission.ccbill_fees
                } else {
                    recentCommission.ccbill_fees = commission.ccbill_fees
                }

                if (commission.sticky_io_charges.length === 0) {
                    if (recentCommission.sticky_io_charges.length > 0) {
                        commission.sticky_io_charges = recentCommission.sticky_io_charges
                    } else {
                        commission.sticky_io_charges = defaultCommission.sticky_io_charges
                    }
                } else {
                    recentCommission.sticky_io_charges = commission.sticky_io_charges
                }

                if (
                    commission.sticky_io_transaction_charge === '' ||
                    commission.sticky_io_transaction_charge === undefined
                ) {
                    commission.sticky_io_transaction_charge = recentCommission.sticky_io_transaction_charge || defaultCommission.sticky_io_transaction_charge
                } else {
                    recentCommission.sticky_io_transaction_charge = commission.sticky_io_transaction_charge
                }

                await WebsiteCommission.findByIdAndUpdate(commission._id, commission)
            }
        } else {
            const websiteCommissionData = {
                domain: domain,
                ccbill_fees: defaultCommission.ccbill_fees,
                platform_commission: defaultCommission.platform_commission,
                sticky_io_charges: defaultCommission.sticky_io_charges,
                sticky_io_transaction_charge: defaultCommission.sticky_io_transaction_charge,
                target_date: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
                payment_gateway: 'sticky.io'
            }
            const commission = new WebsiteCommission(websiteCommissionData)
            await commission.save()
        }
    } catch (error) {
        console.log('Error in get Website Commission')
    }
}

module.exports = { updateWebsiteCommission }
