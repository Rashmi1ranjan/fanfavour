'use client'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { showForgotPasswordPopup } from '../../../../store/slices/universalLoginSlice'
import { registerButtonLoading } from '../../../../store/slices/registerSlice'
import { loginButtonLoading } from '../../../../store/slices/loginSlice'
import { setConfirmSweetAlert, removeConfirmSweetAlert, setAlertLoader } from '../../../../store/slices/sweetAlertSlice'
import ConfirmSweetAlertsWrapper from '../../modals/ConfirmSweetAlertsWrapper'
import { REGISTER } from '@/lib/constant'
import ModalPupUp from '../../modals/ModalPopUp'
import { forgotPassword } from '../../../action/auth.action'

export default function UniversalLoginForgotPasswordPopup({ requestFrom, website_url }) {
    const [isLoading, setIsLoading] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [showWebsiteList, setShowWebsiteList] = useState(false)
    const dispatch = useDispatch()
    const { email, siteListOfMergeAccount, isOldUser } = useSelector((state) => state.universalLogin)

    const cancel = () => {
        // hide forgot password popup
        dispatch(showForgotPasswordPopup(false))
        if (requestFrom === REGISTER) {
            dispatch(registerButtonLoading(false))
            return
        }
        dispatch(loginButtonLoading(false))
    }

    const showConfirmationMessage = () => {
        setShowAlert(true)
        dispatch(setConfirmSweetAlert({ description: 'Are you sure you want to reset your password?' }))
    }

    const sendForgotPasswordLink = async () => {
        setIsLoading(true)
        const data = {
            email: email,
            requestFrom: requestFrom,
            // check old user while change password
            oldUser: isOldUser,
            domain: website_url
        }
        await forgotPassword(data, dispatch)
        dispatch(removeConfirmSweetAlert())
        // hide forgot password popup and disable button loading
        cancel()
        setIsLoading(false)
    }

    const domainLink = (domain, index) => {
        const url = `https://${domain}`
        return (
            <a
                className='px-0 text-white underline hover:text-white'
                href={url}
                rel='noopener noreferrer'
                target='_blank'
            >
                <span>
                    {domain}
                </span>
            </a>
        )
    }

    return (
        <>
            <ModalPupUp showCloseBtn={false} showHeader={false}>
                <p className='mb-2 text-white'>
                    We&apos;ve found that your email is being used across multiple McCandless Group website{siteListOfMergeAccount.length > 1 && 's'}, but the password you&apos;re using is different.
                    Click <strong>SEND RESET PASSWORD MAIL</strong> to reset your password to use the same credentials across all websites.
                </p>
                <p className='text-white'>
                    Please press <strong>CANCEL</strong> to use another email.
                </p>
                {siteListOfMergeAccount.length > 0 && showWebsiteList === false &&
                    <span
                        className='text-white underline cursor-pointer universal-login-show-btn'
                        onClick={() => { setShowWebsiteList(!showWebsiteList) }}
                    >
                        Show all website{siteListOfMergeAccount.length > 1 && 's'}
                        <i className='fas fa-chevron-down pl-1'></i>
                    </span>
                }
                {siteListOfMergeAccount.length > 0 && showWebsiteList &&
                    <div className='overflow-y-auto overflow-x-hidden' style={{ maxHeight: '180px' }}>
                        {siteListOfMergeAccount.map((item, index) => (
                            <div key={index} className='text-white'>
                                {domainLink(item, index)}
                            </div>
                        ))}
                    </div>
                }
                <div
                    className='pt-4 mt-4 border-t flex flex-col gap-3 md:flex-row justify-between md:gap-4'
                >
                    <button
                        className='w-full md:w-auto bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                        disabled={isLoading}
                        onClick={cancel}
                        type='button'
                    >
                        Cancel
                    </button>

                    <button
                        className='w-full md:w-auto bg-[#ff1a9d] text-white px-4 py-2 rounded-md flex items-center justify-center cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                        disabled={isLoading}
                        onClick={showConfirmationMessage}
                        type='button'
                    >
                        Send Reset Password Mail
                    </button>
                </div>

            </ModalPupUp>
            {showAlert &&
                <ConfirmSweetAlertsWrapper
                    onConfirmSweetAlert={() => { dispatch(setAlertLoader(true)); sendForgotPasswordLink() }}
                    onCancelSweetAlert={() => setShowAlert(false)}
                />
            }
        </>
    )
}