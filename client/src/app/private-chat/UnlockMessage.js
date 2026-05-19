
import React, { useEffect, useState } from 'react'
import Button from '../../components/common/Button'
import _ from 'lodash'
import { googleAnalyticsTrackEvent } from '../../lib/google-analytics-event'
// import { chatPurchasePayment } from '../../app/actions/hybridPaymentAction'
// import { purchaseFromWallet, updateWalletAmount } from '../../actions/cryptoPaymentActions'
// import { setSweetAlert, setConfirmSweetAlert, setAlertLoader, removeConfirmSweetAlert, setShowAlertOnPageWrapper } from '../../actions/sweetAlertActions'
// import { unlockContentDetail, setShowAddFundPopup, setUnlockData, setRemainAmount } from './../../actions/chatActions'
import { unlockContentDetail, setUnlockData, isChatScrollToBottom, setShowAddFundPopup, setRemainAmount } from '../../../store/slices/chatSlice'
import { setConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from '../../../store/slices/sweetAlertSlice'
import { useDispatch, useSelector } from 'react-redux'
import { purchaseFromWallet } from '../../action/crypto-payment.action'
import { updateWalletAmount } from '../../../store/slices/authSlice'
import { chatPurchasePayment } from '../../action/hybrid-payment.action'

export default function UnlockMessage(props) {
    const chat = useSelector((state) => state.chat)
    const auth = useSelector((state) => state.auth)
    const promotion = useSelector((state) => state.promotion)
    const ccbill = useSelector((state) => state.ccbill)
    const sweetAlert = useSelector((state) => state.sweetAlert)
    const { userList, selectedUserId, unlockPaymentData, updatedBalance, unlockData, promotionDetails } = chat
    const [productName, setProductName] = useState('unlock chat')
    const [productSKU, setProductSKU] = useState('chat')
    const [title, setTitle] = useState('chat')
    const { message, userSubscriptionStatus } = props
    const { amount, type, _id, massMessageType, isMassMessage } = message
    const { lockedContentPromotion } = promotion
    const { enable_promotion, promotion_settings, currency_symbol } = auth.appSettings
    const { isLoading } = ccbill
    const isMassMessagePromotionActive = enable_promotion && lockedContentPromotion && ['LOCKED_CONTENT', 'EXCLUSIVE_CONTENT_AND_MASS_MESSAGE', 'MASS_MESSAGE'].includes(lockedContentPromotion.type) ? true : false

    const dispatch = useDispatch()

    const getPromotionPercentage = () => {
        let promotionPercentage = 0
        if (isMassMessagePromotionActive) {
            promotionPercentage = lockedContentPromotion.discount_percentage
        }
        return promotionPercentage
    }

    const getAmount = (amount) => {
        if (!message.isMassMessage) {
            return <>Unlock for  {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{amount}</>
        }
        let isModelFromOtherSite = false
        const modelInfo = userList.find(user => user._id === selectedUserId)
        if (modelInfo && modelInfo.domain !== auth.user.domain) {
            isModelFromOtherSite = true
        }
        const promotionPercentage = isModelFromOtherSite ? (promotionDetails[selectedUserId] ? promotionDetails[selectedUserId].promotionPercentage : 0) : getPromotionPercentage()
        if (promotionPercentage === 0) {
            return <>Unlock for  {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{amount}</>
        }

        const amountWithPromotionApplied = Math.ceil(amount * (100 - promotionPercentage) / 100)
        return <>
            Unlock for&nbsp;
            <span style={{ textDecoration: 'line-through', textDecorationColor: promotion_settings.price_strike_through_color, textDecorationThickness: '2px' }}>
                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{amount}
            </span>
            &nbsp;{_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{amountWithPromotionApplied}
        </>
    }

    const promotionAmount = (amount) => {
        let isModelFromOtherSite = false
        const modelInfo = userList.find(user => user._id === selectedUserId)
        if (modelInfo && modelInfo.domain !== auth.user.domain) {
            isModelFromOtherSite = true
        }
        if (!message.isMassMessage) {
            return amount
        }

        if (isMassMessage && isMassMessagePromotionActive === false && !isModelFromOtherSite) {
            return amount
        }

        const promotionPercentage = isModelFromOtherSite ? (promotionDetails[selectedUserId] ? promotionDetails[selectedUserId].promotionPercentage : 0) : getPromotionPercentage()
        if (promotionPercentage === 0) {
            return amount
        }

        const amountWithPromotionApplied = Math.ceil(amount * (100 - promotionPercentage) / 100)

        return amountWithPromotionApplied
    }

    const unlockUsingCrypto = async (messageData) => {
        let userWalletAmount = auth.user.wallet_amount
        let showDefaultAlert = true
        if (_.isNumber(messageData) === true) {
            userWalletAmount = messageData
            messageData = unlockData
            showDefaultAlert = false
        }
        const messageAmount = Number(parseFloat(messageData.amount).toFixed(2))
        const data = {
            payment_for: 'chat',
            content_id: messageData.messageId,
            userId: auth.user._id
        }
        if (_.get(messageData, 'promotion_id', false) !== false) {
            data.promotion_id = messageData.promotion_id
            data.is_promotion_applied = messageData.is_promotion_applied
        }
        if (auth.user.isAdmin === false) {
            const userDomain = userList.find(obj => obj._id === selectedUserId)
            data.domain = userDomain.domain
            data.email = auth.user.email
        }
        if (userWalletAmount >= messageAmount) {
            const res = await purchaseFromWallet(auth.user.domain, data, dispatch)
            if (res.success === 1) {
                dispatch(updateWalletAmount(res.data.wallet_balance))
                dispatch(setUnlockData({}))
                if (showDefaultAlert || res.data.wallet_balance === 0) {
                    dispatch(setSweetAlert({ description: res.data.message }))
                } else {
                    dispatch(setSweetAlert({ description: `The payment of $${res.data.transaction_amount} was successful. Your content was unlocked. The remainder of your crypto deposit is stored in your wallet and can be used for future transactions.` }))
                }
            } else {
                const message = _.get(res, 'message', 'Payment failed.')
                dispatch(setSweetAlert({ description: message }))
            }
            return
        } else {
            if (userWalletAmount === 0.00) {
                dispatch(setRemainAmount(0))
                dispatch(setShowAddFundPopup(true))
            } else {
                const remainAmount = Math.ceil(messageAmount - userWalletAmount)
                dispatch(setRemainAmount(remainAmount))
                dispatch(setShowAddFundPopup(true))
            }
            dispatch(unlockContentDetail({ messageId: _id, isUnlockPayment: false, type: 'unlock' }))
        }
    }

    useEffect(() => {
        if (sweetAlert.showConfirmAlertInPageWrapper && unlockPaymentData.messageId === _id) {
            unlockContent()
        }
    }, [sweetAlert.showConfirmAlertInPageWrapper])

    useEffect(() => {
        if (unlockPaymentData.isUnlockPayment && unlockPaymentData.messageId === _id) {
            unlockContentUsingPaymentMethod()
        }
    }, [unlockPaymentData])

    useEffect(() => {
        if (updatedBalance.isUpdateBalance && unlockPaymentData.messageId === _id) {
            unlockUsingCrypto(updatedBalance.updatedBalance)
        }
    }, [updatedBalance.isUpdateBalance])

    const unlockContent = async () => {
        dispatch(setShowAlertOnPageWrapper(false))
        setTitle(message.message)
        const messageType = type
        const isMassMessage = message.isMassMessage
        let unlockAmount = amount
        if (isMassMessage === true) {
            unlockAmount = promotionAmount(amount)
        }

        setProductSKU(messageType)
        if (messageType === 'photo') {
            setProductSKU('image')
        }

        setProductName('unlock chat')
        if (isMassMessage) {
            setProductName('unlock mass')
        }
        const massMessageType2 = massMessageType || ''
        const massMessageTypes = ['WELCOME', 'STAGGER', 'DELAYED', 'RESENT', 'PREVIOUS']
        if (isMassMessage === true && massMessageTypes.includes(massMessageType2)) {
            switch (massMessageType2) {
                case 'WELCOME':
                    setProductName('unlock welcome message')
                    break
                case 'STAGGER':
                    setProductName('unlock mass stagger')
                    break
                case 'DELAYED':
                    setProductName('unlock mass delayed')
                    break
                case 'RESENT':
                    setProductName('unlock mass resend')
                    break
                case 'PREVIOUS':
                    setProductName('unlock mass previous')
                    break
                default:
                    setProductName('unlock mass')
                    break
            }
        }
        // Set google analytics add_to_cart event for unlock mass or unlock chat
        const userDomain = userList.find(obj => obj._id === selectedUserId)?.domain
        if (userDomain && userDomain === auth.user.domain) {
            googleAnalyticsTrackEvent('add_to_cart', '', unlockAmount, productSKU, productName, title)
        }

        let confirmationMessage = `Please Confirm Your Purchase of  ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${unlockAmount}.`
        if (auth.user.default_payment_method === 'crypto_currency') {
            confirmationMessage += `You currently have ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${auth.user.wallet_amount} in your wallet. Amount will be debited from your wallet balance.`
        }
        const isCryptoPayment = auth.user.default_payment_method === 'crypto_currency'
        const hasSufficientFunds = auth.user.wallet_amount >= parseFloat(unlockAmount)
        if (isCryptoPayment && !hasSufficientFunds) {
            unlockContentUsingPaymentMethod()
        } else {
            dispatch(setShowAlertOnPageWrapper(true))
            dispatch(setConfirmSweetAlert({ description: confirmationMessage }))
        }
    }

    const unlockContentUsingPaymentMethod = async () => {
        dispatch(unlockContentDetail({ messageId: '', isUnlockPayment: false, type: '' }))
        let isPromotionApplied = message.isMassMessage && isMassMessagePromotionActive
        const id = _id
        const unlockAmount = message.isMassMessage === true ? promotionAmount(amount) : amount
        const { enable_promotion } = auth.appSettings
        const { lockedContentPromotion } = promotion
        let promotionId = false
        if (enable_promotion && lockedContentPromotion !== false && isPromotionApplied === true && message.isMassMessage === true) {
            promotionId = _.get(lockedContentPromotion, '_id', false)
        }
        let isModelFromOtherSite = false
        const modelInfo = userList.find(user => user._id === selectedUserId)
        if (modelInfo && modelInfo.domain !== auth.user.domain) {
            isModelFromOtherSite = true
        }
        if (isModelFromOtherSite) {
            promotionId = false
            isPromotionApplied = false
            const modelPromotionDetails = promotionDetails[selectedUserId] ? promotionDetails[selectedUserId] : []
            if (_.isEmpty(modelPromotionDetails) === false) {
                if (modelPromotionDetails.promotionId) {
                    promotionId = modelPromotionDetails.promotionId
                    isPromotionApplied = true
                } else {
                    return dispatch(setSweetAlert({ description: 'Sorry promotion expired.' }))
                }
            }
        }

        if (isPromotionApplied === true && promotionId === false && !isModelFromOtherSite) {
            return dispatch(setSweetAlert({ description: 'Sorry promotion expired.' }))
        }
        let data = {
            messageId: id,
            amount: unlockAmount,
            recurring: false,
            email: auth.user.email,
            action: 'chat',
            productName: productName,
            productSKU: productSKU,
            productCategory: title,
            promotion_id: message.isMassMessage === true ? promotionId : false,
            is_promotion_applied: message.isMassMessage === true ? isPromotionApplied : false,
            userId: auth.user._id,
            domain: auth.user.domain
        }
        // continue from here...
        if (promotionId !== false && isPromotionApplied === true) {
            data.ribbon_text = lockedContentPromotion.ribbon_text
        }

        if (auth.user.isAdmin === false) {
            const userDomain = userList.find(obj => obj._id === selectedUserId)
            data.domain = userDomain.domain
            data.isUniversalChat = userDomain.domain === auth.user.domain ? false : true
        }
        dispatch(isChatScrollToBottom(false))
        if (auth.user.default_payment_method === 'crypto_currency') {
            dispatch(setUnlockData(data))
            unlockUsingCrypto(data)
            return
        } else {
            await chatPurchasePayment(data, dispatch)
        }
    }

    return (
        <>
            <div className='absolute top-2 right-2'>
                <div className='flex items-center gap-1 px-0 py-1 text-xs text-white font-semibold openSans'>
                    <div className='rounded-xl bg-[#fff]/20 px-2 py-0.5 text-xs text-white'>Locked</div>
                    <div className='rounded-xl bg-[#fff]/20 px-2 py-0.5 text-xs text-white'>
                        {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                        {promotionAmount(amount)}
                    </div>
                </div>
            </div>
            <div className='flex flex-col gap-2 items-center openSans'>
                <svg
                    width='38'
                    height='38'
                    viewBox='0 0 32 32'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                >
                    <rect
                        x='2'
                        y='2'
                        width='28'
                        height='28'
                        rx='8'
                        fill='#fff'
                        opacity='0.2'
                    />
                    <path
                        d='M9.5 10.5C9.5 7.8 13 6.2 16 6.2C19 6.2 22.5 7.8 22.5 10.5'
                        stroke='white'
                        strokeWidth='1'
                        strokeLinecap='round'
                    />
                    <rect
                        x='9'
                        y='16'
                        width='14'
                        height='9'
                        rx='2'
                        stroke='white'
                        strokeWidth='1'
                        fill='none'
                    />
                    <line
                        x1='16'
                        y1='18'
                        x2='16'
                        y2='22'
                        stroke='white'
                        strokeWidth='1'
                        strokeLinecap='round'
                    />
                </svg>
                <p className='text-xs text-[#fff] font-bold leading-1'>Unlock this {type}</p>
                <p className='text-xs text-[#fff]/80 '>Instant access. One-time purchase.</p>
                <Button
                    loading={isLoading}
                    type='button'
                    onClick={() => {
                        dispatch(setShowAlertOnPageWrapper(true))
                        dispatch(unlockContentDetail({ messageId: _id, isUnlockPayment: false, type: 'unlock' }))
                    }}
                    classes={`flex justify-center items-center px-8 py-2 m-0 text-xs w-max-content sm:max-w-full bg-[#000]/80 text-white rounded-lg font-bold ${userSubscriptionStatus === '0' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                >
                    {getAmount(amount)}
                </Button>
                <div className='mb-1 text-xs text-[#fff]/80 openSans'>
                    {auth.user.default_payment_method === 'crypto_currency' ?
                        <>
                            {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{promotionAmount(amount)} will be debited from wallet balance.
                        </>
                        :
                        <>
                            {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{promotionAmount(amount)} will be debited from your selected card.
                        </>
                    }
                </div>
            </div>
        </>
    )
}
