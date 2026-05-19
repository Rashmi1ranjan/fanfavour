import express from 'express'
const router = express.Router()
import {
    getCryptoCurrencyList,
    getTransactionStatus,
    getTransactionData,
    addCryptoFund,
    generatePaymentId,
    purchaseFromWallet,
    getWalletHistory
} from './../controller/crypto.payment.controller.js'

// get app setting with specific key
router.get('/currency-list', getCryptoCurrencyList)
router.post('/get-transaction-status', getTransactionStatus)
router.post('/get-transaction-info', getTransactionData)
router.post('/add-fund-and-payment', addCryptoFund)
router.post('/generate-payment-id', generatePaymentId)
router.post('/purchase-from-wallet', purchaseFromWallet)
router.post('/wallet-history', getWalletHistory)

export default router