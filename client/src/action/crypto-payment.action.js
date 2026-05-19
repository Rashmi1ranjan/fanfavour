import _ from 'lodash'
import { updateAggregatedFeed, updateBlogData } from '../../store/slices/blogSlice'
import { blogUnlockPaymentProcessing, paymentProcessing } from '../../store/slices/ccbillSlice'
import { updateChatMessage, updateMessageAction } from '../../store/slices/chatSlice'
import { removeConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { googleAnalyticsTrackEvent, setPromotionGoogleAnalyticsEvent } from '../lib/google-analytics-event'
import { api } from './base-url'
import { updateWebsiteBlogData } from '../../store/slices/websiteBlogSlice'

/**
 * Get the list of crypto currency
 * 
 * @param {string} domain current domain
 * @param {string} requestFrom blog | chat | tips
 * @returns error/success response of api
 */
export const getCryptoCurrencyList = async (domain, requestFrom, dispatch) => {
    try {
        const params = {
            domain: domain
        }

        const res = await api.get(`/v1/crypto/currency-list`, { params })
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while fetch currency list')
        if (requestFrom !== undefined && requestFrom === 'live-stream') {
            dispatch(setSweetAlert({ description: errorMessage }))
        } else {
            const payload = {
                description: error.response.data.message
            }
            dispatch(setSweetAlert(payload))
        }
        return false
    }
}

/**
 * Start crypto payment
 * 
 * @param {object} data payment data
 * @returns error/success response
 */
export const startNewPayment = (data) => async () => {
    const { url, ...reqData } = data
    try {
        const res = await api.post(`/v1/crypto/${url}`, reqData)
        return res.data
    } catch (error) {
        return false
    }
}

/**
 * Check transaction of crypto add fund
 * 
 * @param {string} domain current domain 
 * @param {object} data fund transaction data 
 * @returns error/success response
 */
export const checkTransactionForAddFund = async (domain, data) => {
    try {
        const res = await api.post(`/v1/crypto/get-transaction-status`, { data, domain })
        return res.data
    } catch (error) {
        return false
    }
}

/**
 * Get the crypto transaction data for blog | chat | tips
 * 
 * @param {string} domain current domain 
 * @param {object} data transaction data 
 * @returns error/success response
 */
export const getTransactionData = (domain, data) => async (dispatch) => {
    try {
        const { type, userId, ...reqData } = data
        if (type === 'blog') {
            dispatch(blogUnlockPaymentProcessing(true))
        } else if (['tips', 'message'].includes(type)) {
            dispatch(paymentProcessing(true))
        }
        const res = await api.post(`/v1/crypto/get-transaction-info`, { reqData, domain })
        const response = res.data

        if (type === 'blog') {
            dispatch(blogUnlockPaymentResponseReceived(false))
            if (response.data.success === 0) {
                dispatch(setSweetAlert({ description: response.data.message }))
                return response.data
            }

            dispatch(updateBlogData(response.data.blogData))

            const isRePost = _.get(res, 'data.blogData.udid', '').length > 1
            const blogType = _.get(res, 'data.blogData.blogType', '')
            const title = _.get(res, 'data.blogData.title', '')
            const amount = _.get(res, 'data.blogData.amount', '')
            const transactionId = userId ? `${response.data.transactionId}-${userId}` : response.data.transactionId
            const productSKU = blogType === 'photo' ? 'image' : blogType
            const productCategory = isRePost === true ? 'unlock reuse feed' : 'unlock feed'
            // Set google analytics event for unlock feed
            googleAnalyticsTrackEvent('purchase', transactionId, amount, productSKU, productCategory, title)

            if (data.is_promotion_applied === true && data.promotion_id !== false) {
                setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
            }
        } else if (type === 'tips') {
            dispatch(paymentResponseReceived(false))
            const transactionId = userId !== undefined ? `${res.data.transactionId}-${userId}` : res.data.transactionId
            const productSKU = data.tipFrom
            const product = data.tipFrom === 'go live stream' ? 'go live tip' : 'tip'
            // Set google analytics event for tip
            googleAnalyticsTrackEvent('purchase', transactionId, data.amount, productSKU, product, '')
        } else if (type === 'message') {
            dispatch(paymentResponseReceived(false))
            dispatch(updateChatMessage(response.data.messageObject, userId))

            const transactionId = userId !== undefined ? `${response.data.transactionId}-${userId}` : response.data.transactionId
            // Set google analytics event for unlock chat
            googleAnalyticsTrackEvent('purchase', transactionId, data.amount, data.productSKU, data.productName, data.productCategory)

            if (data.promotion_id !== false) {
                setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
            }
        }
        return res.data
    } catch (error) {
        return false
    }
}

/**
 * Add crypto fund
 * 
 * @param {string} domain current domain 
 * @param {object} data add crypto fund data 
 * @returns error/success response
 */
export const addFund = async (domain, data) => {
    try {
        const res = await api.post(`/v1/crypto/add-fund-and-payment`, { domain, data })
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while add crypto fund')
        return errorMessage
    }
}

/**
 * Generate crypto payment id
 * 
 * @param {string} domain current domain
 * @param {object} data generate crypto payment id data 
 * @returns error/success response
 */
export const generatePaymentId = async (domain, data) => {
    try {
        const res = await api.post(`/v1/crypto/generate-payment-id`, { domain, data })
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data', 'Error while generate payment id')
        return errorMessage
    }
}

export const purchaseFromWallet = async (domain, data, dispatch, isUpdateSingleWebsite = false) => {
    try {
        const { userId, ...reqData } = data
        if (data.payment_for === 'blog') {
            dispatch(blogUnlockPaymentProcessing(true))
        } else if (data.payment_for === 'chat' || data.payment_for === 'tips') {
            dispatch(paymentProcessing(true))
        }
        let url = `/v1/crypto/purchase-from-wallet`
        const tipFrom = _.get(data, 'tip_from', '')
        if (domain !== data.domain && tipFrom !== 'menu' && (data.payment_for === 'tips' || data.payment_for === 'chat')) {
            reqData.isUniversalChat = true
        }
        const res = await api.post(url, { reqData, domain })
        const response = res.data
        dispatch(removeConfirmSweetAlert())
        if (data.payment_for === 'blog') {
            dispatch(blogUnlockPaymentProcessing(false))
            dispatch(updateBlogData(response.data.blogData))
            dispatch(updateAggregatedFeed(response.data.blogData))
            dispatch(updateWebsiteBlogData({ domain, blog: response.data.blogData }))

            const isRePost = _.get(res, 'data.blogData.udid', '').length > 1
            const blogType = _.get(res, 'data.blogData.blogType', '')
            const title = _.get(res, 'data.blogData.title', '')
            const amount = _.get(res, 'data.blogData.amount', '')
            const transactionId = userId ? `${response.data.transactionId}-${userId}` : response.data.transactionId
            const productSKU = blogType === 'photo' ? 'image' : blogType
            const productCategory = isRePost === true ? 'unlock reuse feed' : 'unlock feed'
            // Set google analytics event for unlock feed
            googleAnalyticsTrackEvent('purchase', transactionId, amount, productSKU, productCategory, title)

            if (data.is_promotion_applied === true && data.promotion_id !== false) {
                setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
            }
        } else if (data.payment_for === 'chat') {
            dispatch(paymentProcessing(false))
            let senderId = response.data.messageObject.senderId
            dispatch(updateMessageAction({ data: response.data.messageObject, user_id: senderId }))

            const transactionId = userId !== undefined ? `${response.data.transactionId}-${userId}` : response.data.transactionId
            // Set google analytics event for unlock chat
            if (domain === data.domain) {
                googleAnalyticsTrackEvent('purchase', transactionId, data.amount, data.productSKU, data.productName, data.productCategory)
            }

            if (data.promotion_id !== false) {
                setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
            }
        } else if (data.payment_for === 'tips') {
            dispatch(paymentProcessing(false))
        }
        dispatch(setShowAlertOnPageWrapper(false))
        return res.data
    } catch (error) {
        if (data.payment_for === 'blog') {
            dispatch(blogUnlockPaymentProcessing(false))
        } else if (data.payment_for === 'chat') {
            dispatch(paymentProcessing(false))
        }
        // dispatch(setShowAlertOnPageWrapper(false))
        dispatch(removeConfirmSweetAlert())
        return error.response.data
    }
}

export const getWalletHistory = async (domain, data) => {
    try {
        const res = await api.post(`/v1/crypto/wallet-history`, { data, domain })
        return res.data
    } catch (error) {
        return error.response.data
    }
}


