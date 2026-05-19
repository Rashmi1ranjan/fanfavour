'use client'
import _ from 'lodash'
import { useEffect, useRef, useState } from "react";
import Sidebar from "../page";
import Button from "@/components/common/Button";
import PaymentCardInfo from "@/app/subscription/PaymentCardInfo";
import { useDispatch, useSelector } from "react-redux";
import { getUsersNewPaymentMethod, markCardAsPrimary, removeCard, saveUserDefaultPaymentMethod } from "@/action/payment-method.action";
import { useRouter } from "next/navigation";
import { removeConfirmSweetAlert, setAlertLoader, setConfirmSweetAlert, setSweetAlert } from '../../../../store/slices/sweetAlertSlice';
import ConfirmSweetAlertsWrapper from '@/components/modals/ConfirmSweetAlertsWrapper';
import { withPrivateRoute } from "@/components/layout/PrivateRoute";
import AddNewCard from '../AddNewCard';
import BackLayout from '../BackLayout';
import Loader from '@/components/common/Loader';

function PaymentMethod() {
    const [isLoading, setIsLoading] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState([])
    const [isSaving, setIsSaving] = useState(false)
    const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('')
    const [processing, setProcessing] = useState(false)
    const [showConfirmAlert, setConfirmAlert] = useState(false)
    const [confirmAlertFor, setConfirmAlertFor] = useState('')
    const [cardId, setCardId] = useState('')
    const authRef = useRef()
    const router = useRouter()
    const dispatch = useDispatch()
    const auth = useSelector((state) => state.auth)
    const userMergedDomainCount = _.get(authRef.current, 'user.userMergedDomainCount', 0)

    useEffect(() => {
        authRef.current = auth
    }, [auth])

    const getPaymentMethods = async () => {
        setIsLoading(true)
        const response = await getUsersNewPaymentMethod(auth.user.domain)
        if (response.status === 200) {
            setPaymentMethod(response.data.userPaymentCard)
            setDefaultPaymentMethod(response.data.userDefaultPaymentMethod.default_payment_method)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (auth.user.ccbillSubscriptionStatus !== '2' && auth.user.ccbillSubscriptionStatus !== '1' && auth.appSettings.enable_ccbill_rest_api === false && auth.appSettings.is_sticky_io_enabled === false) {
            router.back()
            return
        }
        getPaymentMethods()
    }, [])

    const checkIsPrimaryCard = (is_primary) => {
        if (typeof is_primary === 'boolean') {
            return is_primary
        }
        return is_primary.includes(true)
    }

    const changeCardToPrimary = async (confirm) => {
        let confirmMessage = <p>Are you sure you want to make this card primary? This card will be used for all the future transactions.</p>
        if (userMergedDomainCount > 1) {
            confirmMessage = <p>
                Are you sure you want to make this card primary? <br /><br />
                <b>Note:</b>&nbsp;This card will be used for all the future transactions on all the McCandless Group Websites.
            </p>
        }
        if (confirm === false) {
            setConfirmAlert(true)
            setConfirmAlertFor('makeCardPrimary')
            dispatch(setConfirmSweetAlert({
                description: confirmMessage
            }))
            return false
        }
        setProcessing(true)
        const response = await markCardAsPrimary(auth.user.domain, { card_id: cardId }, dispatch)
        if (response.success === 1) {
            dispatch(removeConfirmSweetAlert())
            setConfirmAlert(false)
            updatePrimaryCard(cardId, 'update')
            let description = 'Primary card changed successfully.'
            if (userMergedDomainCount > 1) {
                description = 'Primary card changed successfully. This card will be used for all the future transactions on all the McCandless Group Websites.'
            }
            dispatch(setSweetAlert({ description }))
        }
        setProcessing(false)
    }

    const updatePrimaryCard = (cardId, type = 'update') => {
        let updatedPaymentMethod
        if (type === 'update') {
            updatedPaymentMethod = paymentMethod.map((paymentMethod) => {
                if (paymentMethod._id === cardId) {
                    return { ...paymentMethod, is_primary: true }
                }
                return { ...paymentMethod, is_primary: false }
            })
        } else {
            updatedPaymentMethod = paymentMethod.filter((paymentMethod) => {
                return paymentMethod._id !== cardId
            })
        }
        const sortedCards = updatedPaymentMethod.sort((a, b) => {
            return b.is_primary - a.is_primary
        })
        setPaymentMethod(sortedCards)
    }

    const removeCardById = async (confirm) => {
        let confirmMessage = <p>Are you sure that you want to remove this card?</p>
        if (userMergedDomainCount > 1) {
            confirmMessage = <p>
                Are you sure that you want to remove this card?<br /><br />
                <b>Note:</b>&nbsp;This card will be removed from all the McCandless Group websites.
            </p>
        }

        if (confirm === false) {
            setConfirmAlert(true)
            setConfirmAlertFor('removeCard')
            dispatch(setConfirmSweetAlert({
                description: confirmMessage
            }))
            return false
        }
        setProcessing(true)
        const response = await removeCard(auth.user.domain, { card_id: cardId }, dispatch)
        if (response.success === 1) {
            setConfirmAlert(false)
            updatePrimaryCard(cardId, 'remove')
            let description = 'Card Successfully removed.'
            if (userMergedDomainCount > 1) {
                description = 'This card has been removed successfully from all the McCandless Group websites.'
            }
            dispatch(setSweetAlert({ description }))
        }
        dispatch(removeConfirmSweetAlert())
        setProcessing(false)
    }

    const saveDefaultPaymentMethod = async () => {
        setIsSaving(true)
        const data = {
            payment_method: defaultPaymentMethod
        }
        const resStatus = await saveUserDefaultPaymentMethod(auth.user.domain, data, dispatch)
        if (resStatus) {
            let confirmMessage = <p>Payment method successfully updated.</p>
            if (userMergedDomainCount > 1) {
                confirmMessage = <p>
                    Payment method successfully updated.<br /><br />
                    <b>Note:</b>&nbsp;This payment method will be used for all the future transactions on all the McCandless Group Websites.
                </p>
            }
            dispatch(setSweetAlert({ description: confirmMessage }))
        } else {
            setDefaultPaymentMethod(auth.user.default_payment_method)
        }
        setIsSaving(false)
    }

    const onConfirmSweetAlert = () => {
        dispatch(setAlertLoader(true))
        switch (confirmAlertFor) {
            case 'makeCardPrimary':
                changeCardToPrimary(true)
                break
            case 'removeCard':
                removeCardById(true)
                break
            default:
                break
        }
        setConfirmAlertFor('')
    }

    return (
        <div className='flex justify-center px-4 md:px-10 py-6'>
            <div className='w-full max-w-6xl'>
                <BackLayout />
                <div className='flex flex-col md:flex-row gap-6 items-start'>
                    <div className='w-full md:flex-1 hidden lg:block'>
                        <Sidebar />
                    </div>
                    <div className='w-full md:flex-[2] bg-white shadow-sm rounded-sm overflow-hidden'>
                        <div className='p-4 border-b font-medium'>
                            Payment Method
                        </div>
                        <div className="p-4 space-y-2">
                            <div className='flex items-center gap-8 '>
                                {/* Credit Card */}
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='radio'
                                        name='payment_type'
                                        id='inlineRadio1'
                                        value='credit_card'
                                        checked={defaultPaymentMethod === 'credit_card' ? true : false}
                                        onChange={() => setDefaultPaymentMethod('credit_card')}
                                        disabled={isSaving}
                                    />
                                    <label htmlFor='inlineRadio1' className="text-normal text-sm">Credit Card</label>
                                </div>

                                {/* Crypto */}
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='radio'
                                        name='payment_type'
                                        id='inlineRadio2'
                                        value='crypto_currency'
                                        checked={defaultPaymentMethod === 'crypto_currency' ? true : false}
                                        onChange={() => setDefaultPaymentMethod('crypto_currency')}
                                        disabled={isSaving}
                                    />
                                    <label htmlFor='inlineRadio2' className="text-normal text-sm">Crypto</label>
                                </div>
                            </div>
                            <span className="text-normal text-sm">Note: Selected method will be used for purchase.</span>
                            <div>
                                <Button
                                    type='submit'
                                    onClick={saveDefaultPaymentMethod}
                                    disabled={isSaving}
                                    classes={`bg-${isSaving ? '[#ff1a9d]/80' : '[#ff1a9d]'} w-[100px] text-white py-3 rounded-md font-semibold text-sm mt-2`}
                                >
                                    Save
                                </Button>
                            </div>
                            <div className='border-b border-gray-200 my-6'></div>
                            <div className='w-full'>
                                {isLoading ?
                                    <div className='flex items-center justify-center'>
                                        <Loader isLoading={isLoading} color='#000' />
                                    </div>
                                    : (
                                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                            <>
                                                {paymentMethod.map((paymentMethod) => (
                                                    <PaymentCardInfo
                                                        key={paymentMethod._id}
                                                        card_id={paymentMethod._id}
                                                        card_type={paymentMethod.card_type}
                                                        card_number={paymentMethod.card_last_four_digits}
                                                        expiry_date={paymentMethod.card_expiration_month_year}
                                                        is_primary={checkIsPrimaryCard(paymentMethod.is_primary)}
                                                        onPrimary={() => {
                                                            setCardId(paymentMethod._id);
                                                            changeCardToPrimary(false);
                                                        }}
                                                        onRemove={() => {
                                                            setCardId(paymentMethod._id);
                                                            removeCardById(false);
                                                        }}
                                                        allow_edit={true}
                                                        processing={processing}
                                                    />
                                                ))}
                                                <AddNewCard />
                                            </>
                                        </div>
                                    )}
                            </div>
                        </div>
                        {showConfirmAlert && <ConfirmSweetAlertsWrapper
                            onConfirm={() => { onConfirmSweetAlert() }}
                            onCancel={() => { dispatch(removeConfirmSweetAlert()); setConfirmAlert(false) }}
                        />}
                        {/* <div className='flex flex-col items-center p-6 md:p-10 space-y-4'>
                            <div className='relative w-[200px] h-[200px] rounded-full overflow-hidden'>
                                <Image
                                    src={renderFile}
                                    alt='avatar'
                                    fill
                                    className='object-cover'
                                />
                            </div>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleAvatarChange}
                                className='hidden'
                                id='avatar-upload'
                            />
                            <label
                                htmlFor='avatar-upload'
                                className='text-sm text-[#ff1a9d] bg-[#ff1a9d]/20 px-2 py-1 rounded-full cursor-pointer'
                            >
                                Upload Profile Photo
                            </label>
                            <div className='flex flex-col gap-5 w-full'>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>
                                        Name
                                    </label>
                                    <input
                                        type='text'
                                        value={auth?.user?.name || ''}
                                        className='bg-gray-50 border rounded-sm px-3 py-2'
                                    />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>
                                        Email
                                    </label>
                                    <input
                                        type='email'
                                        value={auth?.user?.email || ''}
                                        className='bg-gray-50 border rounded-sm px-3 py-2'
                                    />
                                </div>
                                <Button
                                    type='submit'
                                    classes='bg-[#ff1a9d] w-full md:w-[200px] text-white py-3 rounded-md font-semibold text-sm mt-2'
                                >
                                    Update Profile
                                </Button>
                            </div>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withPrivateRoute(PaymentMethod, ['user'])