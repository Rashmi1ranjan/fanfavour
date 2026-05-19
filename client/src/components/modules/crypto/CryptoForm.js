'use client'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import _ from 'lodash'
import {
    getCryptoCurrencyList,
    checkTransactionForAddFund,
    addFund,
    generatePaymentId
} from '../../../action/crypto-payment.action'
import Loader from '../../common/Loader'
import { openCopyToClipboard } from '../../../lib/open-copy-to-clipboard-toast'
import { cn } from '@/lib/utils'
import { updateDefaultPaymentMethod } from '../../../../store/slices/authSlice'
import { googleAnalyticsTrackEvent } from '../../../lib/google-analytics-event'
import Button from '../../common/Button'
import { getUserDetails } from '../../../action/users.action'
import { setSweetAlert } from '../../../../store/slices/sweetAlertSlice'
import { v4 as uuidv4 } from 'uuid'
import { toggleChatTipPopup } from '../../../../store/slices/chatSlice'
import cleanDomain from '../../../lib'
import { Copy } from 'lucide-react'



export default function CryptoForm(props) {
    const auth = useSelector(state => state.auth)
    const {
        card_background_color,
        enable_forumpay_payment_live_mode,
        content_color,
        currency_abbreviation,
        currency_symbol,
        website_url
    } = auth.appSettings

    const domain = cleanDomain(website_url)
    const { last_used_crypto_currency } = auth.user

    const [cryptoCurrencies, setCryptoCurrencies] = useState([])
    const [selectedCurrency, setSelectedCurrency] = useState('')
    const [loading, setLoading] = useState(true)
    const [amount, setAmount] = useState(0)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [forumUrl, setForumUrl] = useState('')
    const [paymentAddress, setPaymentAddress] = useState('')
    const [isPaymentStarted, setIsPaymentStarted] = useState(false)
    const [waitTime, setWaitTime] = useState('')
    const [transactionId, setTransactionId] = useState('')
    const [isTransactionProceed, setIsTransactionProceed] = useState(false)
    const [posId, setPosId] = useState('')
    const [paymentId, setPaymentId] = useState('')
    const [paymentNotices, setPaymentNotices] = useState([])

    const currencyRef = useRef(null)
    const transactionIdRef = useRef(transactionId)
    const isTransactionProceedRef = useRef(isTransactionProceed)
    const paymentAddressRef = useRef(paymentAddress)
    const posIdRef = useRef(posId)
    const paymentIdRef = useRef(paymentId)
    const selectedCurrencyRef = useRef(selectedCurrency)
    const isCallApiRef = useRef(false)
    const generatePaymentIdApiRef = useRef(false)
    const dispatch = useDispatch()
    const { requestFrom, onHideAddFundsForm, hideCryptoFormStatus, onChangeAmount, onCompleteTransaction } = props

    // =======================
    // Constants & Helpers
    // =======================
    const INTERVAL_TIME = 5000

    useEffect(() => {
        if (isPaymentStarted) {
            const interval = setInterval(() => {
                checkTransaction()
            }, INTERVAL_TIME)

            return () => {
                clearInterval(interval)
            }
        } else if (selectedCurrencyRef.current === '') {
            setLoading(true)
            getCryptoCurrencyListData()
        }

        if (generatePaymentIdApiRef.current === false && isPaymentStarted === false) {
            const generatePaymentIdInterval = setInterval(() => {
                generatePaymentID()
            }, INTERVAL_TIME)

            return () => {
                clearInterval(generatePaymentIdInterval)
            }
        }
    }, [isPaymentStarted])

    useEffect(() => {
        if (isPaymentStarted === false || selectedCurrencyRef.current === '') {
            transactionIdRef.current = ''
            generatePaymentID()
        }
    }, [selectedCurrency, isPaymentStarted])

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text)
        dispatch(openCopyToClipboard())
    }

    const checkTransaction = async () => {
        if (transactionIdRef.current !== '' && isTransactionProceedRef.current !== true && isCallApiRef.current === false) {
            setLoading(true)
            const data = {
                pos_id: posIdRef.current,
                currency: selectedCurrencyRef.current,
                address: paymentAddressRef.current,
                payment_id: paymentIdRef.current,
                transaction_id: transactionIdRef.current
            }
            isCallApiRef.current = true
            const res = await checkTransactionForAddFund(domain, data)
            isCallApiRef.current = false
            if (res) {
                setLoading(false)
                if (res.data.is_payment_confirmed === false) {
                    return
                } else {
                    const payload = {
                        payment_method: 'crypto_currency'
                    }
                    dispatch(updateDefaultPaymentMethod(payload))
                    const isUserDetailsFetched = await getUserDetails(dispatch, false, domain)
                    if (isUserDetailsFetched) {
                        setIsTransactionProceed(true)
                        isTransactionProceedRef.current = true
                        // window.CryptoPaymentStats.beforeClose()
                        onCompleteTransaction(res.data.wallet_balance)
                    }
                }
            } else {
                setLoading(false)
                setIsTransactionProceed(true)
                isTransactionProceedRef.current = true
                dispatch(setSweetAlert({ description: 'Payment failed.' }))
                window.CryptoPaymentStats.beforeClose()
                onCompleteTransaction(false)
            }
        }
    }

    const getCryptoCurrencyListData = async () => {
        const res = await getCryptoCurrencyList(domain, requestFrom, dispatch)
        if (res) {
            setCryptoCurrencies(res.data)
            setSelectedCurrency(last_used_crypto_currency)
            selectedCurrencyRef.current = last_used_crypto_currency
        } else {
            if (hideCryptoFormStatus === 'blog' || hideCryptoFormStatus === 'chat' ||
                hideCryptoFormStatus === 'tips' || hideCryptoFormStatus === 'add_fund') {
                onHideAddFundsForm()
            }
            if (hideCryptoFormStatus === 'tips') {
                dispatch(toggleChatTipPopup(false))
            }
            onChangeAmount()
        }
        setLoading(false)
    }

    const currencyOptions = useMemo(() => {
        const options = cryptoCurrencies.map((currency) => {
            return <option key={currency.currency} value={currency.currency}>{currency.description}</option>
        })
        return options
    }, [cryptoCurrencies])

    const onStartNewPayment = async () => {
        if (selectedCurrency.current !== '') {
            setLoading(true)
            setIsPaymentStarted(true)
            const data = {
                currency: selectedCurrencyRef.current,
                transaction_type: 'add_fund',
                amount: props.amount.toString(),
                payment_for: 'add_fund',
                payment_id: paymentIdRef.current
            }
            const res = await addFund(domain, data)
            if (res.success === 1) {
                const { paymentData, pos_id } = res.data
                const { amount, qr_img, qr, address, wait_time, reference_no, payment_id, stats_token, currency, notices } = paymentData
                setAmount(amount)
                setQrCodeUrl(qr_img)
                setForumUrl(qr)
                setPaymentAddress(address)
                setWaitTime(wait_time)
                setTransactionId(reference_no)
                setPosId(pos_id)
                setPaymentNotices(notices)
                transactionIdRef.current = reference_no
                paymentAddressRef.current = address
                posIdRef.current = pos_id
                paymentIdRef.current = payment_id

                window.CryptoPaymentStats.setToken(stats_token)
                googleAnalyticsTrackEvent('add_fund', pos_id, amount, 'CRYPTO', 'add_fund', currency)
            } else {
                dispatch(setSweetAlert({ description: res.message }))
            }
        }
    }

    const generatePaymentID = async () => {
        if (selectedCurrencyRef.current !== '' && generatePaymentIdApiRef.current === false) {
            generatePaymentIdApiRef.current = true
            setLoading(true)
            const data = {
                currency: selectedCurrencyRef.current,
                amount: props.amount.toString()
            }
            const res = await generatePaymentId(domain, data)
            if (res.success === 1) {
                setAmount(res.data.amount)
                setPaymentId(res.data.payment_id)
                paymentIdRef.current = res.data.payment_id
                setLoading(false)
                generatePaymentIdApiRef.current = false
            } else {
                const payload = {
                    description: res.message
                }
                dispatch(setSweetAlert(payload))
                onCompleteTransaction(false)
            }
        }
    }

    return <div>
        <div>
            <h4 className={`m-0 ${hideCryptoFormStatus === 'subscription' ? '' : 'text-[#fff]'}`}>Transaction Amount:  {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{props.amount}  {_.isEmpty(currency_abbreviation) ? 'USD' : currency_abbreviation}</h4>
            <p
                className={`m-0 underline cursor-pointer ${hideCryptoFormStatus === 'subscription' ? '' : 'text-[#fff]'}`}
                onClick={() => onChangeAmount()}
            >(change amount)</p>
        </div>
        <div className={cn('w-full h-full flex justify-center items-center bg-transparent z-[1]', (loading || currencyOptions.length === 0) ? 'visible' : 'invisible')}>
            <div className='w-full h-full absolute top-0 right-0' />
            <Loader isLoading={loading} color={hideCryptoFormStatus === 'subscription' ? '' : '#fff'} />
        </div>
        <div>
            <p className={`${hideCryptoFormStatus === 'subscription' ? '' : 'text-[#fff]'}`}>
                {isPaymentStarted === true ?
                    <>
                        Use the wallet QR code below or copy and paste the coin amount and wallet address.
                    </>
                    :
                    <>
                        Please select a cryptocurrency from the options below.
                    </>
                }
            </p>
        </div>
        <div className='relative w-full'>
            <select
                className='w-full bg-gray-100 rounded-md py-3 px-4 text-sm text-gray-700 appearance-none focus:outline-none'
                value={selectedCurrency}
                onChange={(e) => {
                    const value = e.target.value
                    setSelectedCurrency(value)
                    selectedCurrencyRef.current = value
                    generatePaymentID()
                }}
                ref={currencyRef}
                disabled={isPaymentStarted}
            >
                {currencyOptions}
            </select>
            <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500'>
                ▼
            </span>
        </div>
        <div className='w-full mt-3'>
            <div className='flex items-center rounded-md border border-gray-300 bg-white overflow-hidden'>
                {/* Currency */}
                <span className='px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 bg-gray-50 shrink-0'>
                    {selectedCurrency}
                </span>

                {/* Amount */}
                <input
                    type='text'
                    value={amount}
                    disabled
                    className='flex-1 px-3 py-2 text-sm text-gray-900 bg-transparent outline-none disabled:cursor-not-allowed'
                />

                {/* Copy Icon */}
                <button
                    type='button'
                    onClick={() => copyToClipboard(amount, 'amount')}
                    className='px-1 py-2 border-l border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition'
                >
                    <Copy className='text-[#495057] w-5 h-5 cursor-pointer' />
                </button>

            </div>
        </div>
        {isPaymentStarted === true ?
            <>
                <div className='w-full max-w-lg mx-auto text-center'>
                    {/* Address */}
                    <div className='mb-4 pt-3'>
                        <div className='flex items-center rounded-md border border-gray-300 bg-white overflow-hidden'>
                            <span className='px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border-r'>
                                Address
                            </span>

                            <input
                                type='text'
                                value={paymentAddress}
                                readOnly
                                className='flex-1 px-3 py-2 text-sm text-gray-900 bg-transparent outline-none'
                            />

                            <button
                                type='button'
                                onClick={() => copyToClipboard(paymentAddress, 'payment_address')}
                                className='px-3 py-2 border-l text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            >
                                <Copy className='text-[#495057] w-5 h-5 cursor-pointer' />
                            </button>
                        </div>
                    </div>

                    {/* Notices */}
                    {paymentNotices.length > 0 && (
                        <div className='mb-4 space-y-2 text-left'>
                            {paymentNotices.map((notice) => (
                                <div
                                    key={uuidv4()}
                                    className='rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700'
                                >
                                    <strong>{notice.code}:</strong> {notice.message}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* QR Code */}
                    <div className='flex justify-center my-6'>
                        <img
                            src={qrCodeUrl}
                            className='w-[200px] h-[200px]'
                            alt='QR Code'
                            onLoad={() => window.CryptoPaymentStats.onQRCodeLoad(true)}
                            onError={() => window.CryptoPaymentStats.onQRCodeLoad(false)}
                        />
                    </div>

                    {/* Info Text */}
                    <div className={`space-y-1 text-sm mb-4 ${hideCryptoFormStatus === 'subscription' ? '' : 'text-[#fff]'}`}>
                        <p>Expected time to confirm: <strong>{waitTime}</strong></p>
                        <p>Please do not close this tab.</p>
                    </div>

                    {/* External Link */}
                    {!enable_forumpay_payment_live_mode && (
                        <a
                            href={forumUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={`inline-block text-sm font-medium text-[#000] hover:underline mb-4 ${hideCryptoFormStatus === 'subscription' ? '' : 'text-[#fff]'}`}
                        >
                            Click here for payment
                        </a>
                    )}

                    {/* Info Box */}
                    <div
                        className={`mt-5 rounded-md border p-4 flex items-start gap-3 text-left text-sm ${hideCryptoFormStatus === 'subscription' ? 'border-gray-500' : 'text-[#fff] border-[#fff]'}`}
                    >
                        <i className='fas fa-info-circle text-lg mt-0.5' />
                        <p>
                            You will have <strong>15 minutes</strong> from the time you select your
                            cryptocurrency to complete your transaction. If you are unable to complete
                            your transaction, you can start over again. <strong>All orders are final.</strong>
                        </p>
                    </div>

                </div>

            </>
            :
            <Button
                type='button'
                onClick={onStartNewPayment}
                classes='px-4 py-3 text-base bg-[#ff1a9d] text-[#fff] rounded-md ml-1 mt-2'
                loading={loading}
            >
                Start Crypto Payment
            </Button>
        }
    </div>
}
