import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { showDifferentPasswordSitePopup, setUniversalLoginDifferentPasswordPopupVisibility } from '../../../../store/slices/universalLoginSlice'
import { useDispatch, useSelector } from 'react-redux'
import ModalPupUp from '../../modals/ModalPopUp'
import ConfirmSweetAlertsWrapper from '../../modals/ConfirmSweetAlertsWrapper'
import { removeConfirmSweetAlert, setConfirmSweetAlert, setAlertLoader } from '../../../../store/slices/sweetAlertSlice'
import { forgotPassword } from '../../../action/auth.action'
import Button from '../../common/Button'

export default function UniversalLoginDifferentPasswordPopup() {
    const [isLoading, setIsLoading] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [showWebsiteList, setShowWebsiteList] = useState(false)
    const { differentPasswordSiteList } = useSelector((state) => state.universalLogin)
    const { email } = useSelector((state) => state.userLogin.loginUserInfo)
    // let showPopup = !utility.isProgressiveWebAppPopupVisible

    const dispatch = useDispatch()

    const remindMeLater = () => {
        dispatch(setUniversalLoginDifferentPasswordPopupVisibility(false))
        let reminderCount = Number(localStorage.getItem('differentPasswordPopupReminderCount'))
        if (reminderCount >= 45) {
            localStorage.setItem('differentPasswordPopupReminderCount', 1)
        } else {
            localStorage.setItem('differentPasswordPopupReminderCount', reminderCount + 1)
        }
        dispatch(showDifferentPasswordSitePopup(false))
    }

    const showConfirmationMessage = () => {
        setShowAlert(true)
        dispatch(setConfirmSweetAlert({ description: 'Are you sure you want to reset your password?' }))
    }

    const sendForgotPasswordLink = async () => {
        dispatch(setUniversalLoginDifferentPasswordPopupVisibility(false))
        let userEmail = email
        if (_.isEmpty(email)) {
            userEmail = props.auth.user.email
        }
        setIsLoading(true)
        const data = {
            email: userEmail,
            requestFrom: 'oldUser'
        }
        await forgotPassword(data)
        dispatch(removeConfirmSweetAlert())
        dispatch(showDifferentPasswordSitePopup(false))
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
                {domain}
            </a>
        )
    }

    useEffect(() => {
        dispatch(setUniversalLoginDifferentPasswordPopupVisibility(true))
    }, [])

    return (
        <>
            <ModalPupUp showCloseBtn={false} showHeader={false}>
                <p className='mb-2 text-white'>
                    We&apos;ve found that your email is being used across multiple McCandless Group website{differentPasswordSiteList.length > 1 && 's'}, but your password is different.
                    Click <strong>SEND RESET PASSWORD MAIL</strong> to reset your password to use the same credentials across all websites.
                </p>
                <p className='text-white'>
                    Please click <strong>REMIND ME LATER</strong> to continue without changing your password.
                </p>
                {differentPasswordSiteList.length > 0 && showWebsiteList === false &&
                    <span
                        className='text-white underline cursor-pointer universal-login-show-btn universal-login-different-password-show-btn'
                        onClick={() => { setShowWebsiteList(!showWebsiteList) }}
                    >
                        Show all website{differentPasswordSiteList.length > 1 && 's'}
                        <i className='fas fa-chevron-down pl-1'></i>
                    </span>
                }
                {differentPasswordSiteList.length > 0 && showWebsiteList &&
                    <div className='overflow-y-auto overflow-x-hidden text-white' style={{ maxHeight: '180px' }}>
                        {differentPasswordSiteList.map((item, index) => (
                            <div key={index} className='text-white'>
                                {domainLink(item, index)}
                            </div>
                        ))}
                    </div>
                }
                <div className='pt-4 flex flex-col gap-3 md:flex-row md:justify-end w-full'>
                    <div className='w-full md:w-auto'>
                        <Button
                            classes='w-full bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                            disabled={isLoading}
                            onClick={remindMeLater}
                            type='button'
                        >
                            Remind Me Later
                        </Button>
                    </div>

                    <div className='w-full md:w-auto'>
                        <Button
                            classes='w-full bg-[#ff1a9d] text-white px-4 py-2 rounded-md flex items-center justify-center cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                            disabled={isLoading}
                            onClick={showConfirmationMessage}
                            type='button'
                        >
                            Send Reset Password Mail
                        </Button>
                    </div>
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

