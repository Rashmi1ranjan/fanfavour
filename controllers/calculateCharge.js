const CCBillTransactionReport = require('./../models/CCBillTransactionReports')
exports.newsalesuccess = async (request, response) => {
    let data = request.body.subscription_id_array

    let transactionReports = await CCBillTransactionReport.find({
        subscription_id: { $in: data },
        $or: [{ 'type': 'VOID' }, { 'type': 'REFUND' }]
    })

    let amount = transactionReports.map(amount => amount.accounting_amount).reduce((a, b) => a + b, 0)
    response.send({ amount: amount })
}

exports.upsalesuccess = async (request, response) => {
    let data = request.body.subscription_id_array

    let transactionReports = await CCBillTransactionReport.find({
        subscription_id: { $in: data },
        type: 'CHARGEBACK'
    })

    let amount = transactionReports.map(amount => amount.accounting_amount).reduce((a, b) => a + b, 0)
    response.send({ amount: amount })
}

module.exports = (app) => {
    app.post('/newsalesuccess', this.newsalesuccess)
    app.post('/upsalesuccess', this.upsalesuccess)
}
