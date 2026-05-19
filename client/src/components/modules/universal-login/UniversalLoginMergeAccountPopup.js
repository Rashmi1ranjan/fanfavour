
import { useDispatch, useSelector } from 'react-redux'
import ModalPupUp from '../../modals/ModalPopUp'
import { showUniversalLoginMergeAccountPopup } from '../../../../store/slices/universalLoginSlice'
import { useState } from 'react'
import { setRegisterUserInfo, registerButtonLoading } from '../../../../store/slices/registerSlice'
import { loginButtonLoading, setLoginUserInfo } from '../../../../store/slices/loginSlice'
import Loader from '../../common/Loader'
import { LOGIN, REGISTER } from '@/lib/constant'

export default function UniversalLoginMergeAccountPopup({ registerUserAndAddInUniversalLogin, loginUserAndAddInUniversalLogin, requestFrom, website_url }) {
    const [showWebsiteList, setShowWebsiteList] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { siteListOfOldUserWebsiteList } = useSelector((state) => state.universalLogin)
    const dispatch = useDispatch()

    const domainLink = (domain, index) => {
        const url = `https://${domain}`
        const currentSite = (website_url === domain)
        return (
            <a
                className='px-0 text-white underline hover:text-white'
                href={!currentSite && url}
                rel='noopener noreferrer'
                target='_blank'
            >
                {`${domain} ${currentSite ? '(Current)' : ''}`}
            </a>
        )
    }

    const cancel = () => {
        // hide universal login add account popup while user click on cancel
        dispatch(showUniversalLoginMergeAccountPopup(false))
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

        localStorage.removeItem('differentPasswordPopupReminderCount')
    }

    const mergeUserInUniversalLogin = () => {
        setIsLoading(true)
        // register and add user in the universal login while show add account popup from register and login screen
        if (requestFrom === REGISTER) {
            registerUserAndAddInUniversalLogin()
            dispatch(setRegisterUserInfo({}))
            dispatch(registerButtonLoading(false))
            return
        }
        const currentSite = !siteListOfOldUserWebsiteList.includes(website_url)
        // check current website exist for merge if not exist then create new account and set new user so we can redirect to subscribe page while create new account from login
        if (currentSite) {
            localStorage.setItem('newUser', true)
        }
        loginUserAndAddInUniversalLogin()
        dispatch(setLoginUserInfo({}))
        dispatch(loginButtonLoading(false))
    }

    return (
        <ModalPupUp showCloseBtn={false} showHeader={false}>
            <p className='mb-2 text-white'>
                We&apos;ve found thats your email is being used across multiple McCandless Group website{siteListOfOldUserWebsiteList.length > 1 && 's'} with the same credentials. Click <strong>MERGE ACCOUNT</strong> to access the website with same email.
            </p>
            <p className='text-white'>
                Please click <strong>CANCEL</strong> to use another email.
            </p>
            {(siteListOfOldUserWebsiteList.length > 0 && showWebsiteList === false) &&
                <span
                    className='text-white underline cursor-pointer universal-login-show-btn'
                    onClick={() => { setShowWebsiteList(!showWebsiteList) }}
                >
                    Show all website{siteListOfOldUserWebsiteList.length > 1 && 's'}
                    <i className='fa-solid fas fa-chevron-down pl-1'></i>
                </span>
            }
            {siteListOfOldUserWebsiteList.length > 0 && showWebsiteList &&
                <div className='overflow-y-auto overflow-x-hidden' style={{ maxHeight: '180px' }}>
                    {siteListOfOldUserWebsiteList.map((item, index) => (
                        <div key={index} className='text-white'>
                            {domainLink(item, index)}
                        </div>
                    ))}
                </div>
            }
            <div className='flex justify-between pt-4 mt-4 border-t'>
                <button
                    className='btn bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                    disabled={isLoading}
                    onClick={cancel}
                    type='button'
                >
                    Cancel
                </button>
                <button
                    className='btn bg-[#ff1a9d] text-white px-4 py-2 rounded-md flex items-center justify-center cursor-pointer focus:outline-none focus:ring-0 focus:shadow-none'
                    disabled={isLoading}
                    onClick={mergeUserInUniversalLogin}
                    type='button'
                >
                    {isLoading ? <Loader isLoading={isLoading} size={10} style={{ transform: 'translate(0px, 3px)' }}  /> : 'Merge Account'}
                </button>
            </div>
        </ModalPupUp>
    )
}