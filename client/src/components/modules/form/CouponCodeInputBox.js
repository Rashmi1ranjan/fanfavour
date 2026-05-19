import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import _ from 'lodash'
import {
    setCouponCode,
    setCouponDetails,
    updateCouponLoading,
    updateCouponStatus
} from '../../../../store/slices/couponSlice'
import { checkCouponIsValid } from '../../../action/coupon.action'
import { setSweetAlert } from '../../../../store/slices/sweetAlertSlice'
import cleanDomain from '../../../lib'
import Button from '../../common/Button'

export default function CouponCodeInputBox(props) {
    const auth = useSelector(state => state.auth)
    const { disabled, classes } = props
    const { display_coupon_box_to_user, enable_promotion, website_url } = auth.appSettings
    const { isSubscribedEver, isRebillFailed } = auth.user
    const { subscriptionPromotion } = useSelector(state => state.promotion)
    const { isUserEligibleForOffer } = useSelector(state => state.resubscriptionOffer)
    const {
        isLoading,
        couponCode,
        couponStatus,
        couponCodeDetails
    } = useSelector(state => state.couponCode)
    const domain = cleanDomain(website_url)
    const { isPaymentProcessing } = (state => state.payment)
    const dispatch = useDispatch()

    let otherOfferIsOn = isUserEligibleForOffer
    if (enable_promotion && subscriptionPromotion !== false) {
        if (subscriptionPromotion.applicable_to === 'ALL_USERS') {
            otherOfferIsOn = true
        } else if (subscriptionPromotion.applicable_to === 'NEW_USERS' && isSubscribedEver !== true) {
            otherOfferIsOn = true
        } else if (subscriptionPromotion.applicable_to === 'OLD_USERS' && isSubscribedEver === true) {
            otherOfferIsOn = true
        }
    }

    const [coupon, setCoupon] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [showAlert, setShowAlert] = useState(false)

    useEffect(() => {
        if (!_.isEmpty(couponCode) && isRebillFailed !== true) {
            setCoupon(couponCode)
            if (couponStatus !== 'valid') {
                checkCouponValid(couponCode)
            }
        }
    }, [])

    useEffect(() => {
        if (couponCodeDetails && otherOfferIsOn && showAlert) {
            dispatch(showSweetAlert())
        }
    }, [couponCodeDetails, otherOfferIsOn, showAlert])

    const checkCouponValid = async (code) => {
        try {
            code = code.trim().toUpperCase()
            dispatch(updateCouponLoading(true))
            setErrorMessage('')
            dispatch(setCouponDetails({}))
            if (_.isEmpty(code.trim())) {
                setErrorMessage('Enter valid coupon')
                dispatch(updateCouponStatus('notChecked'))
                dispatch(updateCouponLoading(false))
                return
            }
            await checkCouponIsValid(domain, { code: code }, dispatch)
            setShowAlert(true)
        } catch (error) {
            console.log(error.message)
            setErrorMessage(error.message)
        }
    }

    const showSweetAlert = () => {
        let message = ''
        const { discount_type, discount_value_for_initial, discount_value_for_recurring } = couponCodeDetails
        if (discount_type === 'percentage') {
            if (discount_value_for_recurring === 0) {
                message = `You have received a flat ${discount_value_for_initial}% discount on the first month membership price.`
            } else if (discount_value_for_initial === discount_value_for_recurring) {
                message = `You have received a flat ${discount_value_for_initial}% discount on the membership price.`
            } else {
                message = `You have received a ${discount_value_for_initial}% discount on your first month membership price and ${discount_value_for_recurring}% discount on the membership price after the first month.`
            }
        } else {
            if (discount_value_for_recurring === 0) {
                message = `You have received a flat $${discount_value_for_initial} discount on the first month membership price.`
            } else if (discount_value_for_initial === discount_value_for_recurring) {
                message = `You have received a flat $${discount_value_for_initial} discount on the membership price.`
            } else {
                message = `You have received a $${discount_value_for_initial} discount on your first month membership price and $${discount_value_for_recurring} discount on the membership price after the first month.`
            }
        }
        const description = <div>
            <h2 > <span role='img' aria-label='party-icon'>🎉</span> Coupon Applied Successfully! <span role='img' aria-label='party-icon'>🎉</span></h2>
            {message && <p>{message}</p>}
        </div>
        dispatch(setSweetAlert({ description: description }))
        setShowAlert(false)
    }

    const removeAppliedCoupon = async () => {
        dispatch(updateCouponLoading(true))
        setCoupon('')
        setErrorMessage('')
        dispatch(setCouponCode(''))
        dispatch(updateCouponStatus('notChecked'))
        dispatch(setCouponDetails({}))
        dispatch(updateCouponLoading(false))
        return
    }

    if (display_coupon_box_to_user !== true) {
        return <></>
    }

    const handleChange = (e) => {
        setCoupon(e.target.value)
        setErrorMessage('')
        const coupon = localStorage.getItem('coupon')
        if (coupon) {
            localStorage.removeItem('coupon')
        }
    }

    return <>
        <div className={classes}>
            <input
                type='text'
                name='coupon-code'
                value={coupon}
                onChange={(e) => handleChange(e)}
                placeholder='Coupon Code'
                disabled={disabled || isLoading || couponStatus === 'valid' || isPaymentProcessing}
                className='w-full md:flex-1 bg-[#f8f8f8] rounded-sm py-3 px-4 text-base text-[#000] placeholder-[#8a8a8a] focus:outline-none uppercase'
            />

            {couponStatus === 'valid' ? (
                <Button
                    type='button'
                    onClick={removeAppliedCoupon}
                    loading={isLoading || isPaymentProcessing}
                    classes={`shrink-0 py-4 px-10 text-[13px] rounded-sm font-bold ${coupon ? 'bg-[#ff1a9d] text-white' : 'bg-[#d9d9d9] text-[#8a8a8a]'
                        }`}
                >
                    REMOVE
                </Button>
            ) : (
                <Button
                    type='button'
                    onClick={() => checkCouponValid(coupon)}
                    loading={!coupon || isLoading || isPaymentProcessing}
                    classes={`shrink-0 py-3 px-10 text-[13px] rounded-sm font-bold ${coupon ? 'bg-[#ff1a9d] text-white' : 'bg-[#d9d9d9] text-[#8a8a8a]/50'
                        }`}
                >
                    APPLY
                </Button>
            )}
        </div>
        <div className='mt-1 space-y-1'>
            {otherOfferIsOn && (
                <p className='text-xs text-gray-500'>
                    Note: You cannot combine a coupon with other offers.
                </p>
            )}

            {!_.isEmpty(errorMessage) && (
                <p className='text-xs text-red-500'>
                    {errorMessage}
                </p>
            )}

            {couponStatus === 'valid' && (
                <p className='text-xs text-green-600 text-start'>
                    Coupon Code Applied!
                </p>
            )}
        </div>
    </>
}


