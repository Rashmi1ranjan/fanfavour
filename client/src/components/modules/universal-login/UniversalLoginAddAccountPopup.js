'use client'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Loader from '../../common/Loader'
import { setRegisterUserInfo, registerButtonLoading } from '../../../../store/slices/registerSlice'
import { setLoginUserInfo, loginButtonLoading } from '../../../../store/slices/loginSlice'
import { showUniversalLoginAddAccountPopup } from '../../../../store/slices/universalLoginSlice'
import { LOGIN, REGISTER } from '@/lib/constant'
import { cn } from '@/lib/utils'
import ModalPupUp from '../../modals/ModalPopUp'

export default function UniversalLoginAddAccountPopup({ registerUserAndAddInUniversalLogin, loginUserAndAddInUniversalLogin, requestFrom }) {
    const [showWebsiteList, setShowWebsiteList] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { siteListOfMergeAccount } = useSelector((state) => state.universalLogin)

    const dispatch = useDispatch()

    const domainLink = (domain, index) => {
        const url = `https://${domain}`

        return (
            <a
                className='px-0 underline text-white'
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

    const cancel = () => {
        // hide universal login add account popup while user click on cancle
        dispatch(showUniversalLoginAddAccountPopup(false))
        // empty register user info while click cancel on universal add account popup on register page
        if (requestFrom === REGISTER) {
            dispatch(setRegisterUserInfo({}))
            dispatch(registerButtonLoading(false))
        }

        // empty login user info while click cancel on universal add account popup on login page
        if (requestFrom === LOGIN) {
            dispatch(setLoginUserInfo({}))
            dispatch(loginButtonLoading(false))
        }
    }

    const mergeUserInUniversalLogin = () => {
        setIsLoading(true)
        // register and add user in the universal login while show add account popup from regiter and login screen
        if (requestFrom === REGISTER) {
            registerUserAndAddInUniversalLogin()
            return
        }
        loginUserAndAddInUniversalLogin()
    }

    return (
        <ModalPupUp showCloseBtn={false} showHeader={false}>
            {/* Title */}
            <h2 className='text-lg font-semibold mb-3 text-white'>
                McCandless Group Website
                {siteListOfMergeAccount.length > 1 ? 's' : ''}
            </h2>

            {/* Content */}
            <p className='mb-2 text-white'>
                We&apos;ve found that your email is being used across multiple
                McCandless Group website
                {siteListOfMergeAccount.length > 1 && 's'} with the same credentials.
                Click <strong>CONTINUE</strong> to access the website with the same
                email.
            </p>
            <p className='text-white'>
                Please Click <strong>CANCEL</strong> to use another email.
            </p>

            {/* Show Websites Button */}
            {siteListOfMergeAccount.length > 0 && !showWebsiteList && (
                <div className='text-left'>
                    <span
                        className={cn('text-white underline cursor-pointer universal-login-show-btn', isLoading && 'opacity-60 pointer-events-none')}
                        onClick={() => { setShowWebsiteList(!showWebsiteList) }}>Show all website{siteListOfMergeAccount.length > 1 && 's'}
                        <i className='fa-solid fas fa-chevron-down pl-1'></i>
                    </span>
                </div>
            )}

            {/* Website List */}
            {siteListOfMergeAccount.length > 0 && showWebsiteList && (
                <div className='mt-1 space-y-2 text-white overflow-y-auto overflow-x-hidden' style={{ maxHeight: '180px' }}>
                    {siteListOfMergeAccount.map((item, index) => (
                        <div key={index}>{domainLink(item, index)}</div>
                    ))}
                </div>
            )}

            {/* Buttons */}
            <div
                className='flex justify-between pt-4 mt-4 border-t border-white'
            >
                <button
                    type='button'
                    onClick={cancel}
                    disabled={isLoading}
                    className='btn bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md cursor-pointer'
                >
                    Cancel
                </button>

                <button
                    type='button'
                    onClick={mergeUserInUniversalLogin}
                    disabled={isLoading}
                    className='btn bg-[#ff1a9d] text-white px-4 py-2 rounded-md flex items-center justify-center cursor-pointer'
                >
                    {isLoading ? (
                        <Loader
                            isLoading={isLoading}
                            size={10}
                            style={{ transform: 'translateY(2px)' }}
                        />
                    ) : (
                        'Continue'
                    )}
                </button>
            </div>
        </ModalPupUp>
    )
}
