import _ from 'lodash'
import { api } from './base-url'
import { removeConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { blogUnlockPaymentLoading, setLoading, updateAggregatedFeed, updateBlogData } from '../../store/slices/blogSlice'
import { googleAnalyticsTrackEvent, setGoogleAnalyticsEvent, setPromotionGoogleAnalyticsEvent } from '../lib/google-analytics-event'
import { updateMessageAction } from '../../store/slices/chatSlice'
import { paymentProcessing } from '../../store/slices/ccbillSlice'
import store from '../../store'
import { togglePaymentModal } from '../../store/slices/utilitySlice'
import { updateWebsiteBlogData } from '../../store/slices/websiteBlogSlice'


/**
 * @description subscription using card
 * @param {string} domain current domain
 * @param {object} data user address and card details
 */
export const subscriptionPayment = async (domain, data) => {
    try {
        const res = await api.post(`/v1/purchase/subscription`, { data, domain })
        return res.data
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data', 'Error while take subscription')
        return errorMessage
    }
}

/**
 * @description Add new card
 * @param {string} domain current domain
 * @param {object} data user address and card details
 */
export const addNewCardAction = async (domain, data, dispatch) => {
    try {
        const res = await api.post(`/v1/purchase/add-new-card`, { data, domain })
        return res.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while add new card')
        dispatch(setSweetAlert({ description: errorMessage }))
    }
}

/**
 * @description Subscription using old card
 * @param {string} domain current domain
 * @param {object} data user address and card details
 */
export const subscriptionPaymentByCard = async (domain, data, dispatch) => {
    const url = `/v1/purchase/subscription-with-card`
    try {
        const response = await api.post(url, { data, domain })
        // dispatch(showPushNotificationPrompt())
        dispatch(setLoading(true))
        // dispatch(getAllBlogs(false, { pageNum: 1 }, () => { }))
        return response.data
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Invalid Request')
        setGoogleAnalyticsEvent('subscription_with_old_card', 'error', errorMessage)
        return errorMessage
    }
}

/**
 * Chat Purchase
 * @param {object} data request data
 */
export const chatPurchasePayment = async (data, dispatch) => {
    const url = `/v1/purchase/chat-content-purchase`
    dispatch(paymentProcessing(true))

    try {
        const res = await api.post(url, data)
        const response = res.data
        dispatch(paymentProcessing(false))
        dispatch(setShowAlertOnPageWrapper(false))
        dispatch(updateMessageAction({ data: response.data.messageObject, user_id: response.data.messageObject.senderId }))
        if (response.success === 0) {
            dispatch(setSweetAlert({ description: response.data.message }))
            return response.data
        }

        // Fetch data from store
        const state = store.getState()
        const userId = _.get(state, 'auth.user._id', false)
        const transactionId = userId !== undefined ? `${response.data.transactionId}-${userId}` : response.data.transactionId

        // Set google analytics event for unlock chat
        if (data.isUniversalChat === false) {
            googleAnalyticsTrackEvent('purchase', transactionId, data.amount, data.productSKU, data.productName, data.productCategory)
        }

        if (data.action === 'chat' && data.promotion_id !== false) {
            setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
        }
        dispatch(setSweetAlert({ description: response.data.message }))
        return response
    } catch (error) {
        console.log(error)
        dispatch(paymentProcessing(false))
        dispatch(setShowAlertOnPageWrapper(false))
        const errorData = _.get(error, 'response.data.errors', {})
        const allowCascade = _.get(error, 'response.data.errors.allow_cascade', false)
        if (allowCascade === false) {
            const errorMessage = _.get(error, 'response.data.message', 'Invalid Request')
            dispatch(setSweetAlert({ description: errorMessage }))
            return errorData
        }
        dispatch(setSweetAlert({ description: 'There was an issue authorizing your card. Please re-enter your card details or add a new card to continue.' }))
        const payload = {
            paymentCascade: {
                error_from: errorData.error_from,
                transaction_id: errorData.transactionId
            },
            paymentRequest: data
        }
        dispatch(togglePaymentModal(payload))
        return errorData
    }
}

/**
 * Tip Payment
 * @param {object} data request object
 * @param {string} userId user id
 */
export const TipPayment = async (data, userId, dispatch) => {
    const currentUrl = window.location.hostname
    let url = '/v1/purchase/send-tip'
    // if (data.domain && currentUrl !== data.domain && reqFrom !== 'menu') {
    //     url = `${BASE_URL}/api/universal-chat/send-tip`
    // }
    dispatch(paymentProcessing(true))

    try {
        const res = await api.post(url, data)
        const response = res.data
        const transactionId = userId !== undefined ? `${res.data.transactionId}-${userId}` : res.data.transactionId
        const productSKU = data.tipFrom
        const product = data.tipFrom === 'go live stream' ? 'go live tip' : 'tip'

        dispatch(removeConfirmSweetAlert())
        // Set google analytics event for tip
        if (data.isUniversalChat === false) {
            googleAnalyticsTrackEvent('purchase', transactionId, data.amount, productSKU, product, '')
        }
        dispatch(paymentProcessing(false))
        if (response.success === 0) {
            dispatch(setSweetAlert({ description: response.data.message }))
            return response.data
        }
        dispatch(setSweetAlert({ description: response.data.message }))
        return response.data
    } catch (error) {
        dispatch(setShowAlertOnPageWrapper(false))
        dispatch(paymentProcessing(false))
        dispatch(removeConfirmSweetAlert())
        const errorResponseStatus = _.get(error, 'response.data.status', {})

        if (errorResponseStatus === 401 && router !== '') {
            return router.push('/register')
        }
        const errorData = _.get(error, 'response.data.errors', {})
        const allowCascade = _.get(error, 'response.data.errors.allow_cascade', false)
        if (allowCascade === false) {
            const errorMessage = _.get(error, 'response.data.message', 'Invalid Request')
            dispatch(setSweetAlert({ description: errorMessage }))
            return errorData
        }
        dispatch(setSweetAlert({ description: 'Problem in card authorization please re-enter your card details or add new card.' }))
        const payload = {
            paymentCascade: {
                error_from: errorData.error_from,
                transaction_id: errorData.transactionId
            },
            paymentRequest: data
        }
        dispatch(togglePaymentModal(payload))
        return errorData
    }
}

export const blogPurchasePayment = async (domain, data, isUpdateSingleWebsite, dispatch) => {
    dispatch(blogUnlockPaymentLoading(true))

    const url = `/v1/purchase/blog-content-purchase`
    try {
        const res = await api.post(url, { data, domain })
        const response = res.data

        dispatch(removeConfirmSweetAlert())
        dispatch(blogUnlockPaymentLoading(false))
        if (response.data.success === 0) {
            alert(response.data.message)
            return response.data
        }

        dispatch(updateBlogData(response.data.blogData))
        dispatch(updateAggregatedFeed(response.data.blogData))
        dispatch(updateWebsiteBlogData({ domain, blog: response.data.blogData }))

        const isRePost = _.get(res, 'data.blogData.udid', '').length > 1
        // Fetch data from store
        const state = store.getState()
        const userId = _.get(state, 'auth.user._id', false)
        const transactionId = userId ? `${response.data.transactionId}-${userId}` : response.data.transactionId
        const productSKU = (data.blogType === 'photo') ? 'image' : data.blogType
        const productCategory = isRePost === true ? 'unlock reuse feed' : 'unlock feed'
        // Set google analytics event for unlock feed
        googleAnalyticsTrackEvent('purchase', transactionId, data.amount, productSKU, productCategory, data.title)

        if (data.is_promotion_applied === true && data.promotion_id !== false) {
            setPromotionGoogleAnalyticsEvent(data.promotion_id, data.ribbon_text)
        }
        dispatch(setSweetAlert({ description: response.data.message }))
        return response
    } catch (error) {
        console.log(error)
        dispatch(blogUnlockPaymentLoading(false))
        dispatch(removeConfirmSweetAlert())
        const errorData = _.get(error, 'response.data.errors', {})
        const allowCascade = _.get(error, 'response.data.errors.allow_cascade', false)
        if (allowCascade === false) {
            const errorMessage = _.get(error, 'response.data.message', 'Invalid Request')
            dispatch(setSweetAlert({ description: errorMessage }))
            return errorData
        }
        dispatch(setSweetAlert({ description: 'Problem in card authorization please re-enter your card details or add new card.' }))
        const payload = {
            paymentCascade: {
                error_from: errorData.error_from,
                transaction_id: errorData.transactionId
            },
            paymentRequest: data
        }
        dispatch(togglePaymentModal(payload))
        return errorData
    }
}