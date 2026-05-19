'use client'
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Controller, useForm } from 'react-hook-form'
import _ from 'lodash'
import { getCities, getCountries, getCountryFromIP, getStates } from '../../action/subscription.action'
import { getUsersPaymentMethod } from '../../action/payment-method.action'
import Loader from '../../components/common/Loader'
import { paymentProcessingStatus } from '../../../store/slices/paymentSlice'
import Cookies from 'universal-cookie'
import { addNewCardAction, subscriptionPayment, subscriptionPaymentByCard } from '../../action/hybrid-payment.action'
import { googleAnalyticsTrackEvent, setPromotionGoogleAnalyticsEvent } from '../../lib/google-analytics-event'
import { updateDefaultPaymentMethod, updateUserSubscriptionStatus, updateWalletAmount } from '../../../store/slices/authSlice'
import { removeConfirmSweetAlert, setAlertLoader, setConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from '../../../store/slices/sweetAlertSlice'
import AddFundPopup from '../../components/modules/crypto/AddFundPopup'
import MembershipPriceDisplay from './MembershipPriceDisplay'
import PaymentCardInfo from './PaymentCardInfo'
import { Check } from 'lucide-react'
import { purchaseFromWallet } from '../../action/crypto-payment.action'
import cleanDomain from '../../lib'
import { getUserDetails } from '../../action/users.action'
import CouponCodeInputBox from '../../components/modules/form/CouponCodeInputBox'
import Button from '../../components/common/Button'
import { ALLOW_ALL } from '@/lib/constant'
import { withPrivateRoute } from '../../components/layout/PrivateRoute'
import { resetCouponStore } from '../../action/coupon.action'
import { setLoading } from '../../../store/slices/blogSlice'
import { getCloudFrontAssetsUrl } from '../../lib/assets'
import Image from 'next/image'
import CreatableSelect from 'react-select/creatable'
import ConfirmSweetAlertsWrapper from '../../components/modals/ConfirmSweetAlertsWrapper'
import { setFeedImages } from '../../../store/slices/modelSlice'
import { getAuthImages } from '../../action/api'
import { ImageCarousel } from '../../components/gallery/ImageCarousel'


const selectStyles = {
    control: (base, state) => ({
        ...base,
        width: '100%',
        minHeight: 'unset',
        backgroundColor: '#f3f4f6', // bg-gray-100
        borderRadius: '6px',
        paddingLeft: '4px',
        paddingRight: '4px',
        fontSize: '16px',
        border: 'none',
        boxShadow: 'none',
        '&:hover': {
            border: 'none'
        }
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '12px 12px'
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
    }),
    placeholder: (base) => ({
        ...base,
        color: '#8a8a8a',
        fontSize: '14px'
    }),
    singleValue: (base) => ({
        ...base,
        color: '#000'
    }),
    indicatorSeparator: () => ({
        display: 'none'
    }),
    dropdownIndicator: () => ({
        display: 'none'
    })
}


function AddNewCard({ addCardAndSubscription }) {
    const [paymentType, setPaymentType] = useState('CARD')
    const [paymentFrom, setPaymentFrom] = useState('')
    const [cardStep, setCardStep] = useState(1)
    const [defaultCountry, setDefaultCountry] = useState('')
    const [isCountryLoading, setIsCountryLoading] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    let [isDataLoaded, setIsDataLoaded] = useState(false)
    let [countryList, setCountryList] = useState([])
    let [allCountries, setAllCountries] = useState([])
    let [stateList, setStateList] = useState([])
    let [allStates, setAllStates] = useState([])
    let [cityList, setCityList] = useState([])
    const [cardType, setCardType] = useState('')
    const [cardNumber, setCardNumber] = useState('')
    const [isInputDisabled, setIsInputDisabled] = useState(false)
    const [isPaymentInProcess, setIsPaymentInProcess] = useState(false)
    const [paymentMethods, setPaymentMethod] = useState([])
    const [addNewCard, setAddNewCard] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [cardId, setCardId] = useState('')
    const [showConfirmAlert, setConfirmAlert] = useState(false)
    const [loader, setLoader] = useState(false)
    const subscriptionData = useRef({})
    const updateWalletBalanceAmount = useRef(0)
    const cryptoPaymentConfirmation = useRef(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        clearErrors,
        setValue,
        trigger,
        control,
        reset
    } = useForm({ mode: 'onSubmit', criteriaMode: 'all', })

    const countryId = watch('country')
    const stateId = watch('state')
    const selectedCard = watch('payment_card')
    const dispatch = useDispatch()
    const auth = useSelector(state => state.auth)
    const { isPaymentProcessing } = useSelector(state => state.payment)
    const { feedImages } = useSelector((state) => state.models)
    const hasFetched = useRef(false)

    const {
        membership_price,
        recurring_membership_price,
        returning_membership_price,
        returning_recurring_membership_price,
        enable_promotion,
        is_crypto_payment_enabled,
        enable_coupons,
        currency_symbol,
        model_name
    } = auth.appSettings

    const { isSubscribedEver, isRebillFailed, cardAuthorizedByAllGateway, wallet_amount } = auth.user
    const { subscriptionPromotion } = useSelector(state => state.promotion)
    const { couponCodeDetails, couponStatus, couponCode } = useSelector(state => state.couponCode)
    const resubscriptionOffer = useSelector(state => state.resubscriptionOffer)

    let initialMembershipPrice = Number(membership_price)
    let initialPeriod = 30
    let recurringMembershipPrice = Number(recurring_membership_price)
    if (isSubscribedEver === true) {
        initialMembershipPrice = Number(returning_membership_price)
        recurringMembershipPrice = Number(returning_recurring_membership_price)
    }


    if (_.isEmpty(couponCodeDetails) === false && couponStatus === 'valid') {
        if (couponCodeDetails.discount_type === 'percentage') {
            initialMembershipPrice = Number(initialMembershipPrice) - (Number(initialMembershipPrice) * couponCodeDetails.discount_value_for_initial / 100)
            if (couponCodeDetails.discount_value_for_recurring !== 0) {
                recurringMembershipPrice = Number(recurringMembershipPrice) - (Number(recurringMembershipPrice) * couponCodeDetails.discount_value_for_recurring / 100)
            }
        } else {
            initialMembershipPrice = Number(initialMembershipPrice) - couponCodeDetails.discount_value_for_initial
            if (couponCodeDetails.discount_value_for_recurring !== 0) {
                recurringMembershipPrice = Number(recurringMembershipPrice) - couponCodeDetails.discount_value_for_recurring
            }
        }
        initialMembershipPrice = parseFloat(initialMembershipPrice.toFixed(2))
        recurringMembershipPrice = parseFloat(recurringMembershipPrice.toFixed(2))
    }

    let isPromotionApplicable = false
    if (_.isEmpty(couponCodeDetails) && enable_promotion && subscriptionPromotion !== false) {
        if (subscriptionPromotion.applicable_to === 'ALL_USERS') {
            isPromotionApplicable = true
        } else if (subscriptionPromotion.applicable_to === 'NEW_USERS' && isSubscribedEver !== true) {
            isPromotionApplicable = true
        } else if (subscriptionPromotion.applicable_to === 'OLD_USERS' && isSubscribedEver === true) {
            isPromotionApplicable = true
        }
    }

    if (_.isEmpty(couponCodeDetails) && isPromotionApplicable === true) {
        initialMembershipPrice = subscriptionPromotion.subscription_initial_amount
        recurringMembershipPrice = subscriptionPromotion.subscription_recurring_amount
    }
    if (_.isEmpty(couponCodeDetails) && resubscriptionOffer.isUserEligibleForOffer === true) {
        if (resubscriptionOffer.offer.give_free_month_subscription !== 0) {
            initialMembershipPrice = '0.00'
            initialPeriod = resubscriptionOffer.offer.give_free_month_subscription * 30
        } else {
            initialMembershipPrice = resubscriptionOffer.offer.recurring_price
        }
        recurringMembershipPrice = resubscriptionOffer.offer.recurring_price
    }

    const showDebitAmountFromWalletOption = wallet_amount !== 'NA' && Number(initialMembershipPrice) <= wallet_amount && (Number(initialMembershipPrice) !== 0 || wallet_amount > 0) ? true : false
    const [showUseWalletOption, setShowUseWalletOption] = useState(showDebitAmountFromWalletOption)

    useEffect(() => {
        if (!paymentMethods?.length) return
        if (selectedCard) return
        handlePaymentMethodChange()
    }, [cardId, selectedCard])

    useEffect(() => {
        handlePaymentMethodChange()
    }, [paymentFrom])

    const handlePaymentMethodChange = () => {
        const primary = paymentMethods.find(
            c => c.is_primary || c._id === cardId
        )

        if (primary) {
            setValue('payment_card', primary._id)
        }
    }

    const getStateListFromCountryId = async (countryId) => {
        let data = {
            countryId: countryId
        }
        setIsLoading(true)
        setCityList([])
        const response = await getStates(data)
        const stateOptions = response.data.states.map((data) => {
            return {
                label: data.name,
                value: data._id
            }
        })
        setStateList(stateOptions)
        setAllStates(response.data.states)
        setIsLoading(false)

    }

    const fetchData = async () => {
        try {
            setIsLoading(true)

            // 1️⃣ Get country from IP
            const resIP = await getCountryFromIP()
            const countryFromIP = _.get(resIP, 'data.country', '').toLowerCase()

            // 2️⃣ Get all countries
            const resCountries = await getCountries()

            const countryOptions = resCountries.map((data) => ({
                label: data.name,
                value: data._id
            }))

            setCountryList(countryOptions)
            setAllCountries(resCountries)

            // 3️⃣ Find match by ISO2
            const matchedCountry = resCountries.find(
                (data) => data.iso2.toLowerCase() === countryFromIP
            )
            if (matchedCountry) {
                setIsCountryLoading(true)
                setDefaultCountry(matchedCountry._id);
                await getStateListFromCountryId(matchedCountry._id);
                setIsCountryLoading(false)
            }

        } catch (err) {
            console.error('Error while fetching country:', err);
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (countryId !== '' && countryId !== undefined) {
            setStateList([])
            getStateListFromCountryId(countryId)
        }
    }, [countryId])

    useEffect(() => {
        const fetchCities = async () => {
            if (!stateId) return

            try {
                setIsLoading(true)
                setCityList([])

                const data = {
                    stateId,
                    countryId
                }

                const res = await getCities(data)
                const cityOptions = res.data.cities.map((data) => ({
                    label: data.name,
                    value: data._id
                }))
                setValue('city', null, {
                    shouldDirty: true,
                    shouldTouch: false,     // 🔥 key
                    shouldValidate: false   // 🔥 key
                })

                setCityList(cityOptions)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCities()
    }, [stateId])

    useEffect(() => {
        const userEmail = auth.user.email
        setValue('email', userEmail)
        setUserEmail(userEmail)
        if (addCardAndSubscription) {
            setPaymentType(auth.user.default_payment_method === 'crypto_currency' ? 'CRYPTO' : 'CARD')
        }
        fetchData()
        if (addCardAndSubscription === true) {
            getPaymentMethods()
        } else {
            setAddNewCard(true)
            setIsDataLoaded(true)
        }
    }, [])

    const getPaymentMethods = async () => {
        setIsLoading(true)
        setIsDataLoaded(false)
        const res = await getUsersPaymentMethod(auth.domain, dispatch)
        if (res.success === 1) {
            setPaymentMethod(res.data)
            setAddNewCard(res.data.length > 0 ? false : true)
            setIsLoading(false)
            setIsDataLoaded(true)
            if (auth.user.default_payment_method !== 'crypto_currency' && res.data.length > 0) {
                setPaymentFrom('EXISTING')
            }
        }
    }

    const onSubmit = (data) => {
        if (paymentType === 'CARD' || paymentFrom === 'EXISTING') {

            if (isMobile && cardStep === 1 && paymentFrom !== 'EXISTING') {
                setCardStep(2)
                return
            }

            if (cardType === 'unknown') {
                const alertMessage = 'Invalid payment card type.'
                alert(alertMessage)
                return false
            }
            const cookies = new Cookies()
            const utm_params = cookies.get('pcp_utm_params', { doNotParse: false })
            data.utm_params = utm_params
            data.addCardAndSubscription = addCardAndSubscription
            if (couponCode.couponStatus === 'valid') {
                data.couponCode = couponCode.couponCode
            }
            if (data.payment_card === undefined || addNewCard === true) {
                data.email = auth.user.email.trim()
                data.address = data.address.trim()
                data.country = data.country
                data.state = data.state
                data.city = data.city
                data.pincode = data.pincode.trim()
                data.firstName = data.firstName.trim()
                data.lastName = data.lastName.trim()
                data.cardNumber = data.cardNumber.trim()
                data.cvv = data.cvv.trim()
                data.month = data.month.trim()
                data.year = data.year.trim()
                // to save cardType (visa, mastercard etc.) in database.
                data.card_type = cardType === 'mastercard' ? 'master' : cardType.trim()
                subscriptionWithNewCard(data)
            } else {
                let confirmMessage = ''
                if (initialPeriod !== 30) {
                    confirmMessage = `Are you sure to subscribe? This will charge $${initialMembershipPrice} for ${initialPeriod} Days then $${recurringMembershipPrice} recurring every 30 days.`
                } else {
                    confirmMessage = `Are you sure to subscribe? This will charge $${initialMembershipPrice} for this month then $${recurringMembershipPrice} recurring every 30 days.`
                }
                setConfirmAlert(true)
                dispatch(setConfirmSweetAlert({
                    description: confirmMessage
                }))
                const cardData = {
                    utm_params: utm_params,
                    addCardAndSubscription: addCardAndSubscription,
                    email: auth.user.email.trim(),
                    payment_card: data.payment_card
                }
                if (couponCode.couponStatus === 'valid') {
                    cardData.couponCode = couponCode.couponCode
                }
                subscriptionData.current = cardData
            }
        }
    }

    const handleSubscription = async () => {
        dispatch(setAlertLoader(true))
        await subscriptionWithPreviouslyAddedCard(subscriptionData.current)
        setConfirmAlert(false)
        subscriptionData.current = {}
    }

    const subscriptionWithPreviouslyAddedCard = async (data) => {
        try {
            if (_.isEmpty(data.couponCode) && resubscriptionOffer.isUserEligibleForOffer === true) {
                data.offer = resubscriptionOffer.offer
            }
            changeProcessingStatus(true)
            const payment = await subscriptionPaymentByCard(auth.domain, data, dispatch)
            changeProcessingStatus(false)
            if (payment.success === 1) {
                const paymentData = payment.data
                googleAnalyticsTrackEvent(paymentData.event_action, paymentData.transaction_id, paymentData.amount, paymentData.product_sku, paymentData.product_name, paymentData.product_category)
                if (resubscriptionOffer.isUserEligibleForOffer === true) {
                    setPromotionGoogleAnalyticsEvent(resubscriptionOffer.offer._id, 'resubscription')
                } else if (subscriptionPromotion !== false) {
                    setPromotionGoogleAnalyticsEvent(subscriptionPromotion._id, subscriptionPromotion.ribbon_text)
                }
                dispatch(updateDefaultPaymentMethod({ payment_method: 'credit_card' }))
                dispatch(updateUserSubscriptionStatus())
                const alertMessage = 'Thank you for subscribing.'
                showSweetAlert(alertMessage, `/private-chat?name=${auth.domain}`)
                resetCouponStore()
                const coupon = localStorage.getItem('coupon')
                if (_.isEmpty(coupon) === false) {
                    localStorage.removeItem('coupon')
                }
                return
            }

            const error = _.get(payment, 'message', false)
            const errorMessage = error !== false ? error : payment
            showSweetAlert(errorMessage)
        } catch (error) {
            changeProcessingStatus(false)
            showSweetAlert(error)
        }
    }

    const cardRegex = /\d+/
    const regex = /^[0-9]{0,19}$/
    const onCardNumberChange = (value) => {
        const card_type = getCardType(value)
        setCardType(card_type)
        if (regex.test(value) === true) {
            setValue('cardNumber', value)
            setCardNumber(value)
            return
        }
        setValue('cardNumber', cardNumber)
    }

    function getCardType(value) {
        if (!value) return 'unknown'
        // Keep only digits
        const num = value.replace(/\D/g, '')
        // Card patterns
        const patterns = {
            jcb: /^(?:2131|1800|35)/,                    // JCB
            diners_club: /^3(?:0[0-59]|[689])/,          // Diners
            visa: /^4/,                                  // Visa
            mastercard: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/, // Mastercard
            discover: /^(6011|65|64[4-9]|622(?:12[6-9]|1[3-9]|[2-8]|9[01]|92[0-5]))/, // Discover
            maestro: /^(5[06789]|6)/                     // Maestro
        }

        // Check patterns in correct priority order
        if (patterns.jcb.test(num)) return 'jcb'
        if (patterns.diners_club.test(num)) return 'diners_club'
        if (patterns.visa.test(num)) return 'visa'
        if (patterns.mastercard.test(num)) return 'mastercard'
        if (patterns.discover.test(num)) return 'discover'

        // Maestro case (special logic: 5 → treat as Mastercard)
        if (patterns.maestro.test(num)) {
            return num.startsWith('5') ? 'mastercard' : 'maestro'
        }

        return 'unknown'
    }

    let CardMonthsOptions = [
        { value: '01', label: '01 - January' },
        { value: '02', label: '02 - February' },
        { value: '03', label: '03 - March' },
        { value: '04', label: '04 - April' },
        { value: '05', label: '05 - May' },
        { value: '06', label: '06 - June' },
        { value: '07', label: '07 - July' },
        { value: '08', label: '08 - August' },
        { value: '09', label: '09 - September' },
        { value: '10', label: '10 - October' },
        { value: '11', label: '11 - November' },
        { value: '12', label: '12 - December' }
    ]

    const CardMonths = CardMonthsOptions.map(option => (
        <option className='text-[#000]' key={option.label} value={option.value}>
            {option.label}
        </option>
    ))

    const YearsList = useMemo(() => {
        const currentYear = new Date().getFullYear()

        return Array.from({ length: 15 }, (_, i) => {
            const year = currentYear + i
            return (
                <option className='text-[#000]' key={year} value={year}>
                    {year}
                </option>
            )
        })
    }, [])

    const changeProcessingStatus = (status) => {
        setIsInputDisabled(status)
        setIsLoading(status)
        setIsPaymentInProcess(status)
        dispatch(paymentProcessingStatus(status))
    }

    const showSweetAlert = (message, redirectUrl) => {
        const payload = {
            description: message
        }

        if (redirectUrl !== undefined) {
            payload.onConfirmUrl = redirectUrl
        }
        dispatch(setSweetAlert(payload))
    }

    const subscription = async (data) => {
        changeProcessingStatus(true)
        try {
            if (_.isEmpty(data.couponCode) && resubscriptionOffer.isUserEligibleForOffer === true) {
                data.offer = resubscriptionOffer.offer
            }
            const payment = await subscriptionPayment(auth.domain, data, dispatch)
            changeProcessingStatus(false)

            if (payment.success === 1) {
                const paymentData = payment.data
                googleAnalyticsTrackEvent(paymentData.event_action, paymentData.transaction_id, paymentData.amount, paymentData.product_sku, paymentData.product_name, paymentData.product_category)
                if (resubscriptionOffer.isUserEligibleForOffer === true) {
                    setPromotionGoogleAnalyticsEvent(resubscriptionOffer.offer._id, 'resubscription')
                } else if (subscriptionPromotion !== false) {
                    setPromotionGoogleAnalyticsEvent(subscriptionPromotion._id, subscriptionPromotion.ribbon_text)
                }
                dispatch(updateDefaultPaymentMethod({ payment_method: 'credit_card' }))
                dispatch(updateUserSubscriptionStatus())
                const alertMessage = 'Thank you for subscribing.'
                showSweetAlert(alertMessage, `/private-chat?name=${auth.domain}`)
                // dispatch(showPushNotificationPrompt())
                dispatch(setLoading(true))
                // dispatch(getAllBlogs(false, { pageNum: 1 }, () => { }))
                resetCouponStore()
                const coupon = localStorage.getItem('coupon')
                if (_.isEmpty(coupon) === false) {
                    localStorage.removeItem('coupon')
                }
                return
            }
            const error = _.get(payment, 'message', false)
            const errorMessage = error !== false ? error : payment
            showSweetAlert(errorMessage)
        } catch (error) {
            changeProcessingStatus(false)
            setIsPaymentInProcess(false)
            showSweetAlert(error)
        }
    }

    const subscriptionWithNewCard = async (data) => {

        const country = allCountries.find(item => item._id === data.country)
        data.country = country?.iso2 || ''

        const state = allStates.find(item => item._id === data.state)
        data.state = state?.state_code || ''

        const city = cityList.find(item => item.value === data.city)
        data.city = city?.label || ''
        if (addCardAndSubscription === true) {
            await subscription(data)
        } else {
            await addNewPaymentMethod(data)
        }
    }

    const addNewPaymentMethod = async (data) => {
        setIsLoading(true)
        setIsPaymentInProcess(true)

        const res = await addNewCardAction(auth.domain, data, dispatch)
        if (res && res.success === 1) {
            if (auth.user.default_payment_method === 'crypto_currency') {
                const payload = {
                    payment_method: 'credit_card'
                }
                dispatch(updateDefaultPaymentMethod(payload))
                const isUserFetched = await getUserDetails(dispatch, false, auth.domain)
                if (!isUserFetched) {
                    setIsLoading(false)
                    setIsPaymentInProcess(false)
                    return
                }
            }
            const alertMessage = 'Card Successfully added.'
            showSweetAlert(alertMessage, `/profile/payment-method?name=${auth.domain}`)
            setIsLoading(false)
            setIsPaymentInProcess(false)
            return
        }
        setIsPaymentInProcess(false)
        setIsLoading(false)
        const error = _.get(res, 'data.error', false)
        const errorMessage = error !== false ? error : res
        showSweetAlert(errorMessage)
    }

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize() // run once on mount
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const subscribeUsingCrypto = async (takeConfirmation, updatedWalletBalance) => {
        dispatch(paymentProcessingStatus(true))
        setIsLoading(true)
        if (takeConfirmation) {
            let confirmMessage = ''
            if (initialPeriod !== 30) {
                confirmMessage = `Are you sure to subscribe? This will charge ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${initialMembershipPrice} for ${initialPeriod} Days then ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${recurringMembershipPrice} recurring every 30 days. You currently have ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${wallet_amount} in your wallet. Amount will be debited from your wallet balance.`
            } else {
                confirmMessage = `Are you sure to subscribe? This will charge ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${initialMembershipPrice} for this month then ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${recurringMembershipPrice} recurring every 30 days. You currently have ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${wallet_amount} in your wallet. Amount will be debited from your wallet balance.`
            }
            setConfirmAlert(true)
            dispatch(setConfirmSweetAlert({
                description: confirmMessage
            }))
        } else {
            setShowUseWalletOption(false)
            subscriptionFromWallet
        }
        updateWalletBalanceAmount.current = updatedWalletBalance
        cryptoPaymentConfirmation.current = takeConfirmation
    }

    const subscriptionFromWallet = async () => {
        dispatch(setAlertLoader(true))
        if (updateWalletBalanceAmount.current !== false) {
            dispatch(updateWalletAmount(updateWalletBalanceAmount.current))
        }
        const data = {
            payment_for: 'subscription'
        }
        if (couponStatus === 'valid') {
            data.couponCode = couponCode.couponCode
        } else if (resubscriptionOffer.isUserEligibleForOffer === true) {
            data.offer = resubscriptionOffer.offer
        }
        const res = await purchaseFromWallet(auth.domain, data, dispatch)
        if (res) {
            if (res.success === 0) {
                if (res.status !== 401) {
                    dispatch(updateWalletAmount(res.errors.wallet_balance))
                }
                const alertMessage = res.message
                dispatch(setAlertLoader(false))
                showSweetAlert(alertMessage, `/?name=${auth.domain}`)
                return
            }
            dispatch(updateWalletAmount(res.data.wallet_balance))
            const payload = {
                payment_method: 'crypto_currency'
            }
            dispatch(updateDefaultPaymentMethod(payload))
            googleAnalyticsTrackEvent('purchase', res.data.transactionId, res.data.transaction_amount, 'CRYPTO', 'subscription', 'subscription')
            if (subscriptionPromotion !== false) {
                setPromotionGoogleAnalyticsEvent(subscriptionPromotion._id, subscriptionPromotion.ribbon_text)
            }
            const isUserDetailsFetched = await getUserDetails(dispatch, false, auth.domain)
            if (isUserDetailsFetched) {
                let alertMessage = 'Thank you for subscribing. The remainder of your crypto deposit is stored in your wallet and can be used for future transactions.'
                if (cryptoPaymentConfirmation.current || res.data.wallet_balance === 0) {
                    alertMessage = 'Thank you for subscribing.'
                }
                dispatch(setAlertLoader(false))
                showSweetAlert(alertMessage, `/private-chat?name=${auth.domain}`)
                // dispatch(showPushNotificationPrompt())
                dispatch(setLoading(true))
                // dispatch(getAllBlogs(false, { pageNum: 1 }, () => { }))
                resetCouponStore()
                const coupon = localStorage.getItem('coupon')
                if (_.isEmpty(coupon) === false) {
                    localStorage.removeItem('coupon')
                }
                dispatch(paymentProcessingStatus(false))
            }
        }
        setIsLoading(false)
    }

    const handleSubscriptionPayment = () => {
        switch (paymentType || paymentFrom) {
            case 'CRYPTO':
                subscriptionFromWallet()
                break;
            case 'CARD':
            case 'EXISTING':
                handleSubscription()
                break;
            default:
                break;
        }
    }

    const onRadioBtnChange = (value) => {
        setCardId(value)
        setValue('payment_card', value)
    }

    let message = 'Please enter your existing card information again or try a new card.'
    if (cardAuthorizedByAllGateway === true) {
        message = 'Your existing card is not working, Please add new card.'
    }
    if (paymentType === 'CRYPTO') {
        message = 'Please add wallet balance.'
    }

    const handleCreateNewCity = (inputValue) => {
        const newOption = {
            label: inputValue,
            value: inputValue.trim()
        }
        cityList = [...cityList, newOption]
        setCityList(cityList)
    }

    const onCancelProcess = () => {
        setConfirmAlert(false);
        if (paymentFrom === 'EXISTING') {
            subscriptionData.current = {}
        } else if (paymentType === 'CRYPTO') {
            dispatch(paymentProcessingStatus(false))
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!auth.user.domain) return
        if (hasFetched.current) return

        const getFeedImage = async () => {
            try {
                setLoader(true)
                const response = await getAuthImages(auth.user.domain)
                dispatch(setFeedImages(response.data))
            } finally {
                setLoader(false)
            }
        }

        if (feedImages.length === 0) {
            getFeedImage()
        }
        hasFetched.current = true

    }, [auth.user.domain])

    return (
        isDataLoaded === true &&
        <>
            <div className={`min-h-[calc(100vh-var(--navbar-height))] ${addCardAndSubscription === true ? 'bg-gray-100 md:px-10' : 'bg-white'} flex justify-center`}>
                <div className={`w-full max-w-6xl bg-white md:rounded-xl overflow-hidden ${addCardAndSubscription === true ? 'md:my-10' : 'my-4'}`}>
                    {/* HEADER */}
                    {addCardAndSubscription === true &&
                        <div className='bg-[linear-gradient(135deg,#bc3fb7,#8925cb)] text-white text-center py-8 pb-16'>
                            <h2 className='text-[22px] font-normal text-[#fff] pb-3 text-center'>{model_name}</h2>
                            {
                                addCardAndSubscription === true &&
                                <div className=''>
                                    <MembershipPriceDisplay
                                        displayFreeInformativeMessage={true}
                                        isCryptoPaymentMethod={paymentType === 'CRYPTO' ? true : false}
                                    />
                                    {isRebillFailed === true &&
                                        <h4 className='text-center my-2'>I want you back! <br /> {message}</h4>
                                    }
                                </div>
                            }
                            <p className='text-[9px] font-medium tracking-wider opacity-90 text-[#fff] mt-1'>MONTHLY CHARGE</p>
                        </div>
                    }
                    {/* CONTENT */}
                    <div className={`relative bg-white p-5 rounded-t-3xl md:rounded-none -mt-8 ${addCardAndSubscription === true ? 'md:py-16 md:px-26' : ''}`}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className={`grid grid-cols-1 ${addCardAndSubscription === true ? 'lg:grid-cols-2' : 'md:grid-cols-1'} md:gap-14 gap-3`}>
                                {/* ================= BILLING DETAILS ================= */}
                                <div>
                                    {/* Payment Type + Email */}
                                    {(!isMobile || cardStep === 1) &&
                                        <div className='flex items-center justify-between mb-3 pt-3'>
                                            <p className='text-base font-normal text-black'>Payment Type</p>
                                            <span className='text-xs text-[#5958b2] truncate max-w-[200px] font-light'>{auth.user.email}</span>
                                        </div>
                                    }
                                    {/* Payment Buttons */}
                                    {(is_crypto_payment_enabled && addCardAndSubscription === true) && (!isMobile || cardStep === 1) &&
                                        <div>
                                            <div className={`grid gap-3 mb-6 w-full grid-cols-1 ${paymentMethods.length === 0 ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} xl:grid-cols-[repeat(auto-fit,minmax(0,1fr))]`}>
                                                {/* CARD */}
                                                <Button
                                                    type='button'
                                                    onClick={() => {
                                                        setPaymentType('CARD')
                                                        setPaymentFrom('')
                                                        setAddNewCard(true)
                                                    }}
                                                    loading={isPaymentProcessing}
                                                    classes={`relative flex items-center justify-between py-3 pl-4 pr-16
                                                        text-sm font-semibold rounded-sm bg-[#f8f8f8] text-[#000]
                                                        cursor-pointer flex-1 min-w-0
                                                        ${paymentType === 'CARD' && paymentFrom === '' ? 'border-2 border-[#ff1a9d]' : 'border border-transparent'}`}
                                                >
                                                    <span className='relative'>CARD</span>
                                                    <div className='absolute right-1 top-0 h-full w-12 pointer-events-none'>
                                                        <Image
                                                            src={getCloudFrontAssetsUrl('payment-icon/card-logo-image.jpg')}
                                                            alt='card-logo'
                                                            width={100}
                                                            height={100}
                                                            className='absolute top-1/2 -translate-y-1/2 h-8 object-contain'
                                                            draggable={false}
                                                        />
                                                    </div>
                                                </Button>

                                                {/* CRYPTO */}
                                                <Button
                                                    type='button'
                                                    onClick={() => {
                                                        setPaymentType('CRYPTO')
                                                        setAddNewCard(false)
                                                        setPaymentFrom('')
                                                    }}
                                                    loading={isPaymentProcessing}
                                                    classes={`relative flex items-center justify-between py-3 pl-4 pr-16
                                                        text-sm font-semibold rounded-sm bg-[#f8f8f8] text-[#000]
                                                        cursor-pointer flex-1 min-w-0
                                                        ${paymentType === 'CRYPTO' ? 'border-2 border-[#ff1a9d]' : 'border border-transparent'}`}
                                                >
                                                    <span className='relative'>CRYPTO</span>
                                                    <div className='absolute right-1 top-0 h-full w-12 pointer-events-none'>
                                                        <Image
                                                            src={getCloudFrontAssetsUrl('payment-icon/crypto-logo.png')}
                                                            alt='crypto-logo'
                                                            width={100}
                                                            height={100}
                                                            className='absolute top-1/2 -translate-y-1/2 h-8 object-contain'
                                                            draggable={false}
                                                        />
                                                    </div>
                                                </Button>

                                                {/* EXISTING CARD */}
                                                {paymentMethods.length > 0 && (
                                                    <Button
                                                        type='button'
                                                        onClick={() => {
                                                            setPaymentFrom('EXISTING')
                                                            setPaymentType(paymentType === 'CRYPTO' ? '' : paymentType)
                                                            setAddNewCard(false)
                                                        }}
                                                        loading={isPaymentProcessing}
                                                        classes={`relative flex items-center justify-between py-3 pl-4 pr-16
                                                                text-sm font-semibold rounded-sm bg-[#f8f8f8] text-[#000]
                                                                cursor-pointer flex-1 min-w-0
                                                                    ${paymentFrom === 'EXISTING' ? 'border-2 border-[#ff1a9d]' : 'border border-transparent'}`}
                                                    >
                                                        <span className='relative'>EXISTING CARD</span>
                                                        <div className='absolute right-1 top-0 h-full w-12 pointer-events-none'>
                                                            <Image
                                                                src={getCloudFrontAssetsUrl('payment-icon/card-logo-image.jpg')}
                                                                alt='card-logo'
                                                                width={100}
                                                                height={100}
                                                                className='absolute top-1/2 -translate-y-1/2 h-8 object-contain'
                                                                draggable={false}
                                                            />
                                                        </div>
                                                    </Button>
                                                )}
                                            </div>
                                            <div>
                                                {paymentType === 'CRYPTO' && addCardAndSubscription === true && (
                                                    <>
                                                        {showUseWalletOption &&
                                                            <div className='space-y-4'>
                                                                <input
                                                                    type='radio'
                                                                    id='use-wallet-amount'
                                                                    name='subscribe_by_crypto'
                                                                    defaultChecked
                                                                    className='peer hidden'
                                                                />

                                                                <label
                                                                    htmlFor='use-wallet-amount'
                                                                    className='relative flex items-center h-[94px] w-full cursor-pointer rounded-md
                                                                        border border-gray-300 px-6 text-[18px] transition
                                                                        peer-checked:border-[#ff1a9d] peer-checked:bg-[#ff1a9d]/5'                                                                                                         >
                                                                    <i className='fas fa-wallet text-lg mr-2'></i>

                                                                    <span className='font-medium'>
                                                                        Use Wallet For Subscription
                                                                    </span>

                                                                    <Check className='absolute right-4 h-5 w-5 text-[#ff1a9d] opacity-0 peer-checked:opacity-100 transition' />
                                                                </label>

                                                                <p className='text-[#000] text-sm'>
                                                                    By completing this order, I confirm that I am 18 (some locations 21) years or older and agree with the
                                                                    <a className='styled-link' href='/privacy-policy' target='_blank'> privacy statement</a> and
                                                                    <a className='styled-link' href='/terms-of-service' target='_blank'> general terms and conditions</a>.
                                                                </p>

                                                                {enable_coupons && isRebillFailed !== true && (
                                                                    <CouponCodeInputBox
                                                                        classes='flex items-center gap-2 w-full text-start'
                                                                    />
                                                                )}

                                                                <Button
                                                                    type='submit'
                                                                    onClick={() => subscribeUsingCrypto(true, false)}
                                                                    loading={isLoading || isPaymentProcessing}
                                                                    classes='w-full flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold bg-[#ff1a9d] text-[#fff] tracking-[3px]'
                                                                >
                                                                    SUBSCRIBE
                                                                    {(isPaymentInProcess || isPaymentProcessing) && (
                                                                        <Loader isLoading={isPaymentInProcess || isPaymentProcessing} color='#ffffff' size={10} />
                                                                    )}
                                                                </Button>
                                                            </div>

                                                        }
                                                        {showUseWalletOption === false &&
                                                            <AddFundPopup
                                                                type={'subscription'}
                                                                onCompleteTransaction={
                                                                    (updatedWalletBalance) => {
                                                                        if (updatedWalletBalance) {
                                                                            subscriptionFromWallet(false, updatedWalletBalance)
                                                                        }
                                                                    }
                                                                }
                                                            />
                                                        }
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    }
                                    {paymentFrom === 'EXISTING' &&
                                        <div className='w-full y-4'>
                                            {paymentMethods.map((paymentMethod) => {
                                                return <div className='pb-4' key={paymentMethod._id}>
                                                    <input
                                                        className='peer sr-only'
                                                        type='radio'
                                                        name='payment_card'
                                                        id={`card_${paymentMethod._id}`}
                                                        {...register('payment_card', { required: 'Card is required.' })}
                                                        value={paymentMethod._id}
                                                        defaultChecked={
                                                            (paymentMethod.is_primary === true ||
                                                                cardId === paymentMethod._id) &&
                                                            addNewCard === false
                                                        }
                                                        onChange={(e) => {
                                                            setAddNewCard(false)
                                                            onRadioBtnChange(e.target.value)
                                                        }}
                                                    />

                                                    <label
                                                        htmlFor={`card_${paymentMethod._id}`}
                                                        className='block w-full relative'
                                                    >
                                                        <PaymentCardInfo
                                                            card_id={paymentMethod._id}
                                                            card_type={paymentMethod.card_type}
                                                            card_number={paymentMethod.card_last_four_digits}
                                                            expiry_date={paymentMethod.card_expiration_month_year}
                                                            is_primary={paymentMethod.is_primary}
                                                            allow_edit={false}
                                                        />

                                                        <Check className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#000] stroke-[4px] transition-opacity
                                                    ${selectedCard === paymentMethod._id
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                            }`}
                                                        />
                                                    </label>
                                                </div>
                                            })}
                                            <div>
                                                <input
                                                    type='radio'
                                                    name='payment_card'
                                                    id='new_card'
                                                    value='new_card'
                                                    disabled={isLoading}
                                                    {...register('payment_card', {
                                                        required: 'Please Select Payment Method'
                                                    })}
                                                    onChange={(e) => {
                                                        setAddNewCard(true)
                                                        setPaymentType('CARD')
                                                        setPaymentFrom('')
                                                        onRadioBtnChange(e.target.value)
                                                    }}
                                                    defaultChecked={addNewCard}
                                                    className='peer sr-only'
                                                />

                                                <label
                                                    htmlFor='new_card'
                                                    className='relative flex items-center justify-between h-[94px] w-full cursor-pointer
                                                border border-[#aaa] rounded-[2px] px-6'
                                                >
                                                    <span>Add New Card</span>
                                                    <Check className='h-6 w-6 text-black opacity-0 peer-checked:opacity-100 transition' />
                                                </label>
                                            </div>
                                            {
                                                errors.payment_card && (
                                                    <p className='mt-1 text-xs text-red-500 -mt-2'>
                                                        {errors.payment_card.message}
                                                    </p>
                                                )
                                            }
                                            {
                                                enable_coupons && isRebillFailed !== true && (
                                                    <div className='mt-4'>
                                                        <CouponCodeInputBox classes='flex gap-2 md:flex-row md:items-center' />
                                                    </div>
                                                )
                                            }
                                            <div className='mt-6'>
                                                <Button
                                                    type='submit'
                                                    classes='w-full bg-[#ff1a9d] text-white py-3 rounded-md font-semibold tracking-[3px] text-[14px] mt-2 cursor-pointer'
                                                    loading={isLoading || isPaymentProcessing}
                                                >
                                                    {isPaymentInProcess === true ? 'PAYMENT PROCESSING' : 'SUBSCRIBE'}
                                                    <Loader isLoading={isPaymentInProcess || isPaymentProcessing} color='#fff' size={10} />
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                    {/* Billing Form */}
                                    {(paymentFrom !== 'EXISTING' && paymentType === 'CARD' && addNewCard) &&
                                        <>
                                            {(!isMobile || cardStep === 1) && (
                                                <>
                                                    <h3 className='text-base font-normal mb-2'>Billing Details</h3>
                                                    <div className='space-y-3'>
                                                        <input
                                                            type='text'
                                                            placeholder='Address'
                                                            className='w-full bg-gray-100 rounded-md py-3 px-4 text-base text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                            disabled={isLoading}
                                                            {...register('address', { required: 'Please enter address.' })}
                                                            onChange={(e) => {
                                                                clearErrors('address')
                                                                setValue('address', e.target.value)
                                                            }}
                                                        />
                                                        {errors.address && (
                                                            <p className='text-red-500 text-xs text-start -mt-2'>{errors.address.message}</p>
                                                        )}
                                                        {isCountryLoading === false &&
                                                            <div className='relative'>
                                                                <select
                                                                    className='w-full bg-gray-100 rounded-md py-3 px-4 text-base text-[#8a8a8a] appearance-none focus:outline-none'
                                                                    disabled={isLoading}
                                                                    {...register('country', { required: 'Please select a country.' })}
                                                                    onChange={(e) => {
                                                                        clearErrors('country')
                                                                        setValue('country', e.target.value)
                                                                        e.target.classList.remove('text-[#8a8a8a]')
                                                                        e.target.classList.add('text-[#000]')
                                                                    }}
                                                                    name='country'
                                                                    defaultValue={defaultCountry}
                                                                >
                                                                    <option value='' hidden>Country</option>
                                                                    {countryList.map((item) => (
                                                                        <option className='text-[#000]' key={item.value} value={item.value}>
                                                                            {item.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-black'>
                                                                    ▼
                                                                </span>
                                                            </div>
                                                        }
                                                        {errors.country && (
                                                            <p className='text-red-500 text-xs text-start -mt-2'>{errors.country.message}</p>
                                                        )}
                                                        <div className='relative'>
                                                            <select
                                                                className='w-full bg-gray-100 rounded-md py-3 px-4 text-base text-[#8a8a8a] appearance-none focus:outline-none'
                                                                disabled={isLoading}
                                                                {...register('state', { required: 'Please select a state.' })}
                                                                onChange={(e) => {
                                                                    clearErrors('state')
                                                                    setValue('state', e.target.value)
                                                                    e.target.classList.remove('text-[#8a8a8a]')
                                                                    e.target.classList.add('text-[#000]')
                                                                }}
                                                                name='state'
                                                                defaultValue={''}
                                                            >
                                                                <option value='' hidden>State</option>
                                                                {stateList.map((item) => (
                                                                    <option key={item.value} value={item.value} className='text-[#000]'>
                                                                        {item.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-black'>
                                                                ▼
                                                            </span>
                                                        </div>
                                                        {errors.state && (
                                                            <p className='text-red-500 text-xs text-start -mt-2'>{errors.state.message}</p>
                                                        )}
                                                        <Controller
                                                            name='city'
                                                            control={control}
                                                            rules={{ required: 'Please select a city.' }}
                                                            render={({ field, fieldState }) => (
                                                                <div className='flex flex-col mb-3'>
                                                                    {/* SELECT + ARROW (FIXED HEIGHT ONLY) */}
                                                                    <div className='relative'>
                                                                        <CreatableSelect
                                                                            styles={selectStyles}
                                                                            isClearable={false}
                                                                            options={cityList}
                                                                            placeholder='City'
                                                                            isDisabled={isInputDisabled}
                                                                            formatCreateLabel={(input) => input}
                                                                            inputRef={field.ref}
                                                                            value={cityList.find(c => c.value === field.value) || null}
                                                                            onChange={(option) => {
                                                                                field.onChange(option ? option.value : null)
                                                                                clearErrors('city')
                                                                            }}
                                                                            onCreateOption={(inputValue) => {
                                                                                handleCreateNewCity(inputValue)
                                                                                field.onChange(inputValue)
                                                                                clearErrors('city')
                                                                            }}
                                                                        />

                                                                        {/* ARROW (POSITIONED RELATIVE TO SELECT ONLY) */}
                                                                        <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-black'>
                                                                            ▼
                                                                        </span>
                                                                    </div>

                                                                    {/* ERROR — COMPLETELY OUTSIDE RELATIVE WRAPPER */}
                                                                    {fieldState.error?.message &&
                                                                        <p className='mt-1 text-red-500 text-xs text-start'>
                                                                            {fieldState.error?.message}
                                                                        </p>
                                                                    }
                                                                </div>
                                                            )}
                                                        />


                                                        <input
                                                            type='text'
                                                            placeholder='ZIP'
                                                            className='w-full bg-gray-100 rounded-md py-3 px-4 text-base text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                            disabled={isLoading}
                                                            {...register('pincode', { required: 'Zipcode is required.' })}
                                                            onChange={(e) => {
                                                                clearErrors('pincode')
                                                                setValue('pincode', e.target.value)
                                                            }}
                                                        />

                                                        {errors.pincode && (
                                                            <p className='text-red-500 text-xs text-start -mt-2'>{errors.pincode.message}</p>
                                                        )}
                                                    </div>

                                                    <p className='text-[#5958B2] text-xs font-normal mt-4'>
                                                        All billing information is securely collected and only used for the purposes of verifying your card. This is a digital product only.
                                                    </p>

                                                    {/* Mobile CTA */}
                                                    <button
                                                        type='button'
                                                        onClick={async () => {
                                                            const isValid = await trigger([
                                                                'address',
                                                                'country',
                                                                'state',
                                                                'city',
                                                                'pincode'
                                                            ])

                                                            if (isValid) {
                                                                setCardStep(2)
                                                            }
                                                        }} className='md:hidden w-full bg-[#ff1a9d] text-white py-3 rounded-md font-semibold tracking-[3px] text-[14px] cursor-pointer mt-6'>
                                                        PAY WITH CARD
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    }
                                </div>

                                {/* ================= CARD DETAILS ================= */}
                                {(paymentFrom !== 'EXISTING' && paymentType === 'CARD' && addNewCard && (!isMobile || cardStep === 2)) &&
                                    <div>
                                        <div className='flex items-center justify-between mb-4'>
                                            <h3 className='text-base font-normal text-black'>Card Details</h3>
                                            <div className='flex gap-1'>
                                                <Image
                                                    src={getCloudFrontAssetsUrl('payment-icon/card-logo.jpg')}
                                                    alt='card-logo'
                                                    width={160}
                                                    height={160}
                                                    className='h-8 object-contain'
                                                    draggable={false}
                                                />
                                            </div>
                                        </div>
                                        <div className='space-y-3'>
                                            <input
                                                type='text'
                                                placeholder='First Name'
                                                className='w-full bg-gray-100 rounded-md py-4 px-4 text-base
                                                        text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                disabled={isLoading}
                                                {...register('firstName', { required: 'Please enter first name.' })}
                                                onChange={(e) => {
                                                    clearErrors('firstName')
                                                    setValue('firstName', e.target.value)
                                                }}
                                            />
                                            {errors.firstName && (
                                                <p className='text-red-500 text-xs text-start -mt-2'>{errors.firstName.message}</p>
                                            )}
                                            <input
                                                type='text'
                                                placeholder='Last Name'
                                                className='w-full bg-gray-100 rounded-md py-4 px-4 text-base
                                                       text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                disabled={isLoading}
                                                {...register('lastName', { required: 'Please enter first name.' })}
                                                onChange={(e) => {
                                                    clearErrors('lastName')
                                                    setValue('lastName', e.target.value)
                                                }}
                                            />
                                            {errors.lastName && (
                                                <p className='text-red-500 text-xs text-start -mt-2'>{errors.lastName.message}</p>
                                            )}

                                            <div className='grid grid-cols-[3.5fr_1fr] gap-3 w-full'>
                                                {/* Card Number — 80% */}
                                                <div className='flex flex-col min-w-0'>
                                                    <div className='relative'>
                                                        <input
                                                            type='text'
                                                            placeholder='Card Number'
                                                            className='w-full bg-gray-100 rounded-md py-4 px-4 text-base
                                                                        text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                            {...register('cardNumber', {
                                                                required: 'Card number is required',
                                                                maxLength: { value: 19, message: 'Please enter a valid card number.' },
                                                                minLength: { value: 13, message: 'Please enter a valid card number.' },
                                                                pattern: {
                                                                    value: regex,
                                                                    message: 'Only numbers allowed'
                                                                }
                                                            })}
                                                            onChange={(e) => { onCardNumberChange(e.target.value); clearErrors('cardNumber') }}
                                                            disabled={isInputDisabled}
                                                            maxLength={19}
                                                        />
                                                        {(cardType && cardType !== 'unknown') && (
                                                            <div className='absolute right-4 top-1/2 -translate-y-1/2
                                                        h-[30px] w-[40px]
                                                        flex items-center justify-center
                                                        pointer-events-none'>
                                                                <Image
                                                                    src={getCloudFrontAssetsUrl(`payment-icon/${cardType}.png`)}
                                                                    alt={cardType}
                                                                    fill
                                                                    className='object-contain'
                                                                    draggable={false}
                                                                />
                                                            </div>

                                                        )}
                                                    </div>
                                                    {errors.cardNumber?.types &&
                                                        <p className='text-red-500 text-xs'>{errors.cardNumber?.types?.required ||
                                                            errors.cardNumber?.types?.minLength ||
                                                            errors.cardNumber?.types?.maxLength || errors.cardNumber?.types?.pattern
                                                        }</p>
                                                    }
                                                </div>

                                                {/* CVV — 20% */}
                                                <div className='flex flex-col min-w-0'>
                                                    <input
                                                        type='password'
                                                        placeholder='CVV'
                                                        inputMode='numeric'
                                                        maxLength={4}
                                                        className='w-full bg-gray-100 rounded-md py-4 px-4 text-base
                                                                    text-[#000] placeholder-[#8a8a8a] focus:outline-none'
                                                        {...register('cvv', {
                                                            required: 'CVV is required.',
                                                            maxLength: { value: 4, message: 'Invalid CVV' },
                                                            minLength: { value: 3, message: 'Invalid CVV' },
                                                            pattern: { value: /^\d+$/, message: 'Invalid CVV' }
                                                        })}
                                                    />
                                                    {errors.cvv?.types &&
                                                        <p className='text-red-500 text-xs'>{errors.cvv?.types?.required ||
                                                            errors.cvv?.types?.minLength ||
                                                            errors.cvv?.types?.maxLength || errors.cvv?.types?.pattern
                                                        }</p>
                                                    }
                                                </div>
                                            </div>
                                            <div className='grid grid-cols-2 gap-3'>
                                                <div className='flex-1'>
                                                    <div className='relative h-[52px]'>
                                                        <select
                                                            className='w-full bg-gray-100 rounded-md py-4 px-4 text-base
                                                                text-[#8a8a8a] appearance-none focus:outline-none'
                                                            {...register('month', { required: 'Please select month.' })}
                                                            onChange={(e) => {
                                                                clearErrors('month')
                                                                setValue('month', e.target.value)
                                                                e.target.style.color = e.target.value ? '#000' : '#8a8a8a'
                                                            }}
                                                        >
                                                            <option value='' hidden>Month</option>
                                                            {CardMonths}
                                                        </select>
                                                        <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs'>▼</span>
                                                        {errors.month && (
                                                            <p className='text-red-500 text-xs text-start'>{errors.month.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className='flex-1'>
                                                    {/* FIXED HEIGHT WRAPPER */}
                                                    <div className='relative h-[52px]'>
                                                        <select
                                                            className='w-full h-full bg-gray-100 rounded-md px-4 text-base
                                                                    text-[#8a8a8a] appearance-none focus:outline-none'
                                                            {...register('year', {
                                                                required: 'Please select year.', onChange: (e) => {
                                                                    e.target.style.color = e.target.value ? '#000' : '#8a8a8a'
                                                                }
                                                            })}

                                                        >
                                                            <option value='' hidden>Year</option>
                                                            {YearsList}
                                                        </select>

                                                        {/* Arrow */}
                                                        <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs'>
                                                            ▼
                                                        </span>
                                                    </div>

                                                    {/* Error BELOW (does NOT affect arrow now) */}
                                                    <p className='text-red-500 text-xs mt-1 min-h-[16px]'>
                                                        {errors.year?.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {addCardAndSubscription === true ?
                                            <>
                                                <p className='w-full text-[#5958B2] text-[12px] font-normal pt-5 mb-4'>
                                                    Transaction will appear on your bank statement as:
                                                    <span className='font-extrabold text-[#5958b2]'> McCandless Group</span>
                                                </p>

                                                <p className='text-[#5958B2] text-[12px] font-normal'>
                                                    By completing this order, I confirm that I am 18 (some locations 21) years or older and agree with the
                                                    <a className='text-[#764AF1] underline' href='/privacy-policy' target='_blank'> privacy statement</a> and
                                                    <a className='text-[#764AF1] underline' href='/terms-and-condition' target='_blank'> general terms and conditions</a>.
                                                </p>
                                                {enable_coupons && isRebillFailed !== true &&
                                                    <CouponCodeInputBox classes='flex items-center gap-2 w-full pt-6' />
                                                }
                                                <Button
                                                    type='submit'
                                                    classes='mt-6 w-full bg-[#ff1a9d] text-white py-3 rounded-md font-semibold tracking-[3px] text-[14px] cursor-pointer'
                                                    loading={isLoading || isPaymentProcessing}
                                                >
                                                    {isPaymentInProcess === true ? 'PAYMENT PROCESSING' : 'SUBSCRIBE'}
                                                    <Loader isLoading={isPaymentInProcess || isPaymentProcessing} color='#fff' size={10} />
                                                </Button>
                                            </>
                                            :
                                            <Button
                                                type='submit'
                                                classes='mt-6 w-full bg-[#ff1a9d] text-white py-3 rounded-md font-semibold tracking-[3px] text-[14px] cursor-pointer'
                                                loading={isLoading || isPaymentProcessing}
                                            >
                                                {isPaymentInProcess === true ? 'Processing Card' : 'Add Card'}
                                                <Loader isLoading={isPaymentInProcess || isPaymentProcessing} color='#fff' size={10} />
                                            </Button>
                                        }
                                    </div>
                                }
                                {(paymentFrom === 'EXISTING' || paymentType === 'CRYPTO') && (
                                    <div className='flex flex-col gap-4 pt-12 lg:block hidden'>
                                        {loader ?
                                            <div className='relative w-full h-[550px] flex items-center justify-center '>
                                                <Loader isLoading={loader} color='#000' size={10} />
                                            </div>
                                            : feedImages.length > 0 &&
                                            <div className='relative w-full h-[550px]'>
                                                <ImageCarousel
                                                    images={feedImages}
                                                    alt={'feed-images'}
                                                    height='550px'
                                                />
                                            </div>
                                        }
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showConfirmAlert && <ConfirmSweetAlertsWrapper onConfirm={() => { handleSubscriptionPayment() }} onCancel={() => { onCancelProcess() }} />}
        </>
    )
}

export default withPrivateRoute(AddNewCard, ALLOW_ALL)
