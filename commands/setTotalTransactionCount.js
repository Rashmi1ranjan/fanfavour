const StickyIoTransactionsReport = require('./../models/StickyIoTransactionReport')
const WebsiteEarningReports = require('./../models/WebsiteDailyEarningReport')

/**
 * @description Set Total Transaction count in website daily earning reports
 */
async function setTotalTransactionCount() {
    const transactions = await StickyIoTransactionsReport.aggregate([
        {
            $group: {
                _id: {
                    website_url: '$website_url',
                    transaction_date: '$transaction_date',
                    campaign_id: '$campaign_id',
                    transaction_payment_gateway: '$transaction_payment_gateway'
                },
                count: { $sum: 1 }
            }
        }
    ])

    if (transactions.length > 0) {
        for (const transaction of transactions) {
            const { website_url, transaction_date, campaign_id, transaction_payment_gateway } = transaction._id

            const query = {
                payment_gateway: 'sticky.io',
                sticky_io_payment_gateway: transaction_payment_gateway,
                domain: website_url,
                target_date: new Date(transaction_date),
                sticky_io_campaign_id: campaign_id
            }

            const earning = await WebsiteEarningReports.findOne(query)
            if (earning !== null) {
                earning.total_transaction_count = transaction.count
                earning.sticky_io_transaction_cost = Number((transaction.count * earning.sticky_io_transaction_charge).toFixed(2))
                await earning.save()
            }
        }
    }
}

module.exports = { setTotalTransactionCount }
