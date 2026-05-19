'use client'

import { useDispatch, useSelector } from 'react-redux'
import _ from 'lodash'
import { cn } from '@/lib/utils'
import Button from '../../common/Button'
import ModalPopUp from '../../modals/ModalPopUp'
import { useMemo, useState } from 'react'
import { setSweetAlert } from '../../../../store/slices/sweetAlertSlice'
import CryptoForm from './CryptoForm'
import CouponCodeInputBox from '../form/CouponCodeInputBox'

export default function AddFundPopup(props) {
    const { type, remainAmount, transactionAmount, requestFrom, onHideAddFund, onHideAddFundForm } = props
    const [open, setOpen] = useState(false)
    const auth = useSelector(state => state.auth)
    const {
        wallet_settings,
        membership_price,
        recurring_membership_price,
        returning_membership_price,
        enable_promotion,
        returning_recurring_membership_price,
        enable_coupons,
        currency_symbol,
        currency_abbreviation
    } = auth.appSettings
    const dispatch = useDispatch()

    const { isSubscribedEver, wallet_amount, isRebillFailed } = auth.user
    const resubscriptionOffer = useSelector(state => state.resubscriptionOffer)
    const remainingAmount = remainAmount || 0

    const { isPaymentProcessing } = useSelector(state => state.payment)

    const { subscriptionPromotion } = useSelector(state => state.promotion)

    const addFundOptions = useMemo(() => {
        let options = []
        if (!_.isEmpty(wallet_settings.add_fund_default_options)) {
            options = wallet_settings.add_fund_default_options.split(',').filter((amount) => parseFloat(amount) > parseFloat(remainingAmount))
        }
        return options
    }, [wallet_settings, remainingAmount])

    const [fundAmount, setFundAmount] = useState(remainingAmount === 0 ? addFundOptions[3] : remainingAmount)
    const [fundOtherAmount, setFundOtherAmount] = useState(fundAmount)
    const [isStartedTransaction, setIsStartedTransaction] = useState(false)

    useMemo(() => {
        setFundAmount(remainingAmount === 0 ? addFundOptions[3] : remainingAmount)
    }, [remainingAmount])

    let addFundMinimumAmount = parseInt(wallet_settings.add_fund_minimum_amount, 10)
    let addFundMaximumAmount = parseInt(wallet_settings.add_fund_maximum_amount, 10)

    const onChange = () => {
        const regExp = /^[0-9]*(\.[0-9]{0,2})?$/
        if (_.isEmpty(fundOtherAmount)) {
            return dispatch(setSweetAlert({ description: 'Please enter a valid amount' }))
        }
        if (!regExp.test(fundOtherAmount)) {
            return dispatch(setSweetAlert({ description: 'Please enter a valid amount' }))
        }

        if (parseInt(fundOtherAmount, 10) > addFundMaximumAmount || parseInt(fundOtherAmount, 10) < addFundMinimumAmount) {
            return dispatch(setSweetAlert({ description: `Choose a fund amount between ${addFundMinimumAmount} and ${addFundMaximumAmount}` }))
        }
        setOpen(false)
        setFundAmount(fundOtherAmount)
    }

    const onStartTransaction = () => {
        setIsStartedTransaction(true)
    }

    const onCompleteTransaction = (updatedWalletBalance) => {
        setIsStartedTransaction(false)
        if (props.onCompleteTransaction !== undefined) {
            props.onCompleteTransaction(updatedWalletBalance)
        }
    }

    const buttonText = useMemo(() => {
        if (type === 'subscription') {
            return `ADD ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${fundAmount} TO WALLET AND SUBSCRIBE`
        } else if (type === 'blog' || type === 'chat') {
            return `ADD ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${fundAmount} TO WALLET AND UNLOCK`
        } else if (type === 'tips') {
            return `ADD ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${fundAmount} TO WALLET AND TIP`
        } else {
            return `ADD ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${fundAmount} TO WALLET`
        }
    }, [type, fundAmount])

    let initialMembershipPrice = Number(membership_price)
    let recurringMembershipPrice = Number(recurring_membership_price)
    if (isSubscribedEver === true) {
        initialMembershipPrice = Number(returning_membership_price)
        recurringMembershipPrice = Number(returning_recurring_membership_price)
    }

    const { couponCodeDetails, couponStatus } = useSelector(state => state.couponCode)

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

    if (_.isEmpty(couponCodeDetails) && enable_promotion && subscriptionPromotion !== false) {
        if (subscriptionPromotion.applicable_to === 'ALL_USERS') {
            initialMembershipPrice = subscriptionPromotion.subscription_initial_amount
            recurringMembershipPrice = subscriptionPromotion.subscription_recurring_amount
        } else if (isSubscribedEver === true && subscriptionPromotion.applicable_to === 'OLD_USERS') {
            initialMembershipPrice = subscriptionPromotion.subscription_initial_amount
            recurringMembershipPrice = subscriptionPromotion.subscription_recurring_amount
        } else if (isSubscribedEver !== true && subscriptionPromotion.applicable_to === 'NEW_USERS') {
            initialMembershipPrice = subscriptionPromotion.subscription_initial_amount
            recurringMembershipPrice = subscriptionPromotion.subscription_recurring_amount
        }
    }

    if (_.isEmpty(couponCodeDetails) && resubscriptionOffer.isUserEligibleForOffer === true) {
        if (resubscriptionOffer.offer.give_free_month_subscription !== 0) {
            initialMembershipPrice = '0.00'
        } else {
            initialMembershipPrice = resubscriptionOffer.offer.recurring_price
        }
        recurringMembershipPrice = resubscriptionOffer.offer.recurring_price
    }

    const getPriceText = () => {
        if (type === 'subscription') {
            let text = ''
            if (parseFloat(initialMembershipPrice) === 0.00) {
                return `Our minimum cryptocurrency funding amount is  ${_.isEmpty(currency_symbol) ? '$' : currency_symbol.trim()}${addFundMinimumAmount}.`
            } else {
                if (parseFloat(recurringMembershipPrice) === parseFloat(initialMembershipPrice)) {
                    text = ` ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${initialMembershipPrice}/month`
                } else {
                    text = `${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${initialMembershipPrice} for First Month then ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${recurringMembershipPrice}/month`
                }
            }
            return `Your purchase request is for ${text}. Our minimum cryptocurrency funding
            amount is ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${addFundMinimumAmount}.`
        } else if (type === 'blog' || type === 'chat' || type === 'tips') {
            if (remainingAmount === 0) {
                return `Your purchase request is for ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${transactionAmount}. Our minimum cryptocurrency funding
                amount is  ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${addFundMinimumAmount}.`
            } else {
                return `Your purchase request is for ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${transactionAmount} and your current balance is ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${wallet_amount}. You will need to fund your balance with at least ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${Math.ceil(transactionAmount - wallet_amount)}.`
            }
        }
        else {
            return ''
        }
    }

    return (
        <div className='p-3 text-center'>
            {isStartedTransaction === false &&
                <>
                    <h3 className='mb-2 text-xl font-semibold text-white'>CRYPTO FUNDING AMOUNT</h3>
                    <p className={cn('text-start', type !== 'subscription' && 'text-white')}>
                        {getPriceText()} Please choose an amount to fund your balance via this cryptocurrency
                        transaction. You can choose any amount up to {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{addFundMaximumAmount} {_.isEmpty(currency_abbreviation.trim()) ? 'USD' : currency_abbreviation.trim()}. All funds will
                        be kept in site balance and will be available for future
                        transactions on this site.
                    </p>
                    <div>
                        {remainingAmount !== 0 && addFundOptions.includes(remainingAmount.toString()) === false &&
                            <Button
                                type='button'
                                onClick={() => setFundAmount(remainingAmount)}
                                classes={cn('px-4 py-3 text-[16px] text-white rounded-md', fundAmount === remainAmount ? 'bg-[#ff1a9d]' : 'bg-[#ff1a9d]/80')}
                            >
                                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{remainingAmount}
                            </Button>
                        }
                        {addFundOptions.length > 0 && addFundOptions.map((tip, index) => {
                            return <Button
                                key={index}
                                type='button'
                                onClick={() => {
                                    setFundAmount(tip)
                                    setFundOtherAmount(tip)
                                }}
                                classes={cn('px-4 py-3 text-[16px] text-white m-1 rounded-md', fundAmount === tip ? 'bg-[#ff1a9d]' : 'bg-[#ff1a9d]/80')}
                                loading={false}
                            >
                                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{tip}
                            </Button>
                        })}
                        <Button
                            type='button'
                            onClick={() => setOpen(true)}
                            classes='px-4 py-3 text-[16px] bg-[#ff1a9d] text-white rounded-md ml-1'
                            loading={false}
                        >
                            Other
                        </Button>
                    </div>
                    {enable_coupons && props.type === 'subscription' && isRebillFailed !== true &&
                        <div className='flex justify-center'>
                            <CouponCodeInputBox
                                classes='flex items-center gap-2 w-full max-w-md py-2'
                            />
                        </div>
                    }
                    <div className='mt-3'>
                        <Button
                            type='button'
                            onClick={onStartTransaction}
                            classes='px-4 py-3 text-[16px] whitespace-break-spaces bg-[#ff1a9d] rounded-md text-white'
                            loading={isPaymentProcessing}
                        >
                            {buttonText}
                        </Button>
                    </div>
                    {/* {showOtherOption && */}
                    <ModalPopUp
                        open={open}
                        title="Other amount"
                        handleClose={() => setOpen(false)}
                        modalBodyMaxHeight="70vh"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <input
                                type='number'
                                name='amount'
                                className='w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-non [&::-webkit-inner-spin-button]:appearance-none flex-1 px-4 py-3 rounded-md text-[#8a8a8a] text-base placeholder-[#8a8a8a] bg-white/90'
                                value={fundOtherAmount}
                                onChange={(e) => setFundOtherAmount(e.target.value)}
                                min={addFundMinimumAmount}
                                max={addFundMaximumAmount}
                                placeholder='Enter fund amount'
                            />
                            <Button classes='px-6 py-3 text-[16px] whitespace-break-spaces bg-[#ff1a9d] rounded-md text-white'
                                type='button'
                                onClick={onChange}
                                loading={false}
                            >
                                Confirm
                            </Button>
                        </div>
                    </ModalPopUp>
                    {/* } */}
                </>
            }
            {isStartedTransaction &&
                <CryptoForm
                    requestFrom={requestFrom}
                    onHideAddFundsForm={onHideAddFund}
                    hideCryptoFormStatus={type}
                    onHideCryptoForm={onHideAddFundForm}
                    amount={fundAmount}
                    onChangeAmount={() => setIsStartedTransaction(false)}
                    onCompleteTransaction={onCompleteTransaction}
                />
            }
        </div>
    )
}