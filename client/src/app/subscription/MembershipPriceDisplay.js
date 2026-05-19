import { useDispatch, useSelector } from 'react-redux'
import { getAllPromotionOffers } from '../../action/promotion.action'
import { useEffect } from 'react'
import _ from 'lodash'
import cleanDomain from '../../lib/index'

export default function MembershipPriceDisplay() {
    const auth = useSelector(state => state.auth)
    const {
        membership_price,
        recurring_membership_price,
        returning_membership_price,
        returning_recurring_membership_price,
        enable_promotion,
        payment_page_message_for_free_subscription,
        payment_page_message_for_one_month_free_subscription,
        currency_symbol,
        website_url
    } = auth.appSettings

    const { isSubscribedEver } = auth.user
    const { subscriptionPromotion, isSetPromotion } = useSelector(state => state.promotion)
    const { couponCodeDetails } = useSelector(state => state.couponCode)
    const resubscriptionOffer = useSelector(state => state.resubscriptionOffer)

    const dispatch = useDispatch()

    const domain = cleanDomain(website_url)

    useEffect(() => {
        if (enable_promotion) {
            if (isSetPromotion === false) {
                getAllPromotionOffers(domain, dispatch)
            }
        }
    }, [])

    let initialMembershipPrice = Number(membership_price)
    let recurringMembershipPrice = Number(recurring_membership_price)
    let actualMembershipPrice = Number(membership_price)
    let actualRecurringMembershipPrice = Number(recurring_membership_price)
    let initialPeriod = 30
    let isTrialOffer = false
    if (isSubscribedEver === true) {
        initialMembershipPrice = Number(returning_membership_price)
        recurringMembershipPrice = Number(returning_recurring_membership_price)
        actualMembershipPrice = Number(returning_membership_price)
        actualRecurringMembershipPrice = Number(returning_recurring_membership_price)
    }

    if (_.isEmpty(couponCodeDetails) === false) {
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
        isTrialOffer = _.get(subscriptionPromotion, 'is_trial_offer')
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
        if (isTrialOffer === true) {
            initialPeriod = subscriptionPromotion.initial_period
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

    const freeSubscriptionTextForCrypto = 'When using cryptocurrency, we require a minimum deposit. You can use the deposit funds to purchase premium services from me such as one on one video chats and private content tailored to your requests.'

    return <div className='text-lg text-center mx-auto'>
        {_.isEmpty(couponCodeDetails) === false ? <>
            {
                parseFloat(recurringMembershipPrice) === parseFloat(initialMembershipPrice) ?
                    <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>
                        <span className='line-through'>{_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{actualMembershipPrice}</span> {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{initialMembershipPrice}
                    </p>
                    : <>
                        <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>
                            <span className='line-through'>{_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{actualMembershipPrice}</span> {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{initialMembershipPrice} for First Month
                        </p>
                        <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>
                            then {actualRecurringMembershipPrice !== recurringMembershipPrice && <span className='text-decoration-line-through'>{_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{actualRecurringMembershipPrice}</span>} {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{recurringMembershipPrice}
                        </p>
                    </>
            }
        </> : <>
            {parseFloat(initialMembershipPrice) === 0.00 ? <>
                {
                    parseFloat(recurringMembershipPrice) === 0.00 ?
                        <>
                            <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>FREE MEMBERSHIP</p>
                            {/* {displayFreeInformativeMessage === true &&
                                <FreeWelcomeMessageText>{isCryptoPaymentMethod ? freeSubscriptionTextForCrypto : payment_page_message_for_free_subscription}</FreeWelcomeMessageText>
                            } */}
                        </> : <>
                            {resubscriptionOffer.isUserEligibleForOffer === true ?
                                <>
                                    <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>Get {resubscriptionOffer.offer.give_free_month_subscription} Month(s) Free</p>
                                    <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>then {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{recurringMembershipPrice}</p>
                                </>
                                :
                                <>
                                    <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>
                                        {isTrialOffer === true ? `Get ${initialPeriod} Day${initialPeriod > 1 ? 's' : ''} Free` : `Get first Month Free`}
                                    </p>
                                    <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>then {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{recurringMembershipPrice}</p>
                                    {/* {displayFreeInformativeMessage === true &&
                                        <FreeWelcomeMessageText>{isCryptoPaymentMethod ? freeSubscriptionTextForCrypto : payment_page_message_for_one_month_free_subscription}</FreeWelcomeMessageText>
                                    } */}
                                </>
                            }
                        </>
                }
            </> : <>
                {
                    parseFloat(recurringMembershipPrice) === parseFloat(initialMembershipPrice) ?
                        <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>{_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{initialMembershipPrice}</p>
                        : <>
                            <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>
                                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{initialMembershipPrice} for {isTrialOffer === false ? 'First Month' : `${initialPeriod} Day${initialPeriod > 1 ? 's' : ''}`}
                            </p>
                            <p className='text-[37.1px] md:text-[29.8px] font-extrabold text-white leading-none m-0'>then {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}{recurringMembershipPrice}</p>
                        </>
                }
            </>}
        </>}

    </div>
}
