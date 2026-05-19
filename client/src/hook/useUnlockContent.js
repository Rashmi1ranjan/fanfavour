import { useState } from 'react'
import _ from 'lodash'

export default function useUnlockContent({
    auth,
    dispatch,
    cleanDomain,
    googleAnalyticsTrackEvent,
    setConfirmSweetAlert,
    setSweetAlert,
    setAlertLoader,
    blogPurchasePayment,
    purchaseFromWallet,
    updateWalletAmount,
    isSingleWebsiteBlogs
}) {
    const [unlockData, setUnlockData] = useState({})
    const [showAlert, setShowAlert] = useState(false)
    const [remainAmount, setRemainAmount] = useState(0)
    const [showAddFundPopup, setShowAddFundPopup] = useState(false)

    const currency = _.isEmpty(auth.appSettings.currency_symbol?.trim())
        ? '$'
        : auth.appSettings.currency_symbol.trim()

    const handleUnlockContent = (id, amount, blogType, description, isPromotionApplied, website_url) => {
        setShowAlert(true)

        const data = {
            blogId: id,
            amount,
            recurring: false,
            email: auth.user.email,
            action: 'blog',
            blogType,
            title: description,
            isPromotionApplied,
            domain: cleanDomain(website_url)
        }

        setUnlockData(data)
        requestConfirmation(data, amount, blogType, description)
    }

    const requestConfirmation = (data, amount, blogType, description) => {
        let productSKU = blogType === 'photo' ? 'image' : blogType

        googleAnalyticsTrackEvent('add_to_cart', '', amount, productSKU, 'unlock feed', description)

        let message = `Please Confirm Your Purchase of ${currency}${amount}.`

        if (auth.user.default_payment_method === 'crypto_currency') {
            message += ` You have ${currency}${auth.user.wallet_amount} in your wallet.`
        }

        if (
            auth.user.default_payment_method !== 'crypto_currency' ||
            auth.user.wallet_amount >= parseFloat(amount)
        ) {
            dispatch(setConfirmSweetAlert({ description: message }))
        } else {
            sendUnlockContentRequest(data)
        }
    }

    const sendUnlockContentRequest = async (data) => {
        if (!data) return
        // Promotions are disabled, so do not attach promotion metadata to the purchase.
        let blogData = {
            blogId: data.blogId,
            amount: data.amount,
            recurring: false,
            email: auth.user.email,
            action: 'blog',
            blogType: data.blogType,
            title: data.title,
            domain: data.domain
        }

        if (auth.user.default_payment_method === 'crypto_currency') {
            setUnlockData(blogData)
            unlockBlogUsingCrypto(blogData)
        } else {
            dispatch(setAlertLoader(true))
            await blogPurchasePayment(data.domain, blogData, isSingleWebsiteBlogs, dispatch)
            setUnlockData({})
            setShowAlert(false)
        }
    }

    const unlockBlogUsingCrypto = async (feedData) => {
        let userWalletAmount = auth.user.wallet_amount
        let showDefaultAlert = true
        if (_.isNumber(feedData) === true) {
            userWalletAmount = feedData
            feedData = unlockData
            showDefaultAlert = false
        }

        const feedAmount = Number(parseFloat(feedData.amount).toFixed(2))
        const data = {
            payment_for: 'blog',
            content_id: feedData.blogId,
            userId: auth.user._id,
            domain: feedData.domain
        }

        if (_.get(feedData, 'promotion_id', false) !== false) {
            data.promotion_id = feedData.promotion_id
            data.is_promotion_applied = feedData.is_promotion_applied
        }

        if (userWalletAmount >= feedAmount) {
            dispatch(setAlertLoader(true))
            const res = await purchaseFromWallet(feedData.domain, data, dispatch, isSingleWebsiteBlogs)
            if (res.success === 1) {
                dispatch(updateWalletAmount(res.data.wallet_balance))
                setUnlockData({})
                if (showDefaultAlert || res.data.wallet_balance === 0) {
                    dispatch(setSweetAlert({ description: res.data.message }))
                } else {
                    const message = `The payment of ${_.isEmpty(auth.appSettings.currency_symbol.trim()) ? '$' : auth.appSettings.currency_symbol.trim()}${res.data.transaction_amount} was successful. Your content was unlocked. The remainder of your crypto deposit is stored in your wallet and can be used for future transactions.`
                    dispatch(setSweetAlert({ description: message }))
                }
            } else {
                dispatch(setSweetAlert({ description: res.message || 'Payment failed.' }))
            }
            setShowAlert(false)
            return
        } else {
            if (userWalletAmount === 0.00) {
                setRemainAmount(0)
                setShowAddFundPopup(true)
            } else {
                const remainingAmount = Math.ceil(feedAmount - userWalletAmount)
                setRemainAmount(remainingAmount)
                setShowAddFundPopup(true)
            }
        }
    }

    return {
        handleUnlockContent,
        unlockData,
        showAlert,
        remainAmount,
        showAddFundPopup,
        setShowAddFundPopup,
        setShowAlert,
        sendUnlockContentRequest,
        unlockBlogUsingCrypto
    }
}
