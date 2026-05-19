import _ from 'lodash'
import { jwtDecode } from 'jwt-decode'
import { loginButtonLoading, setIsShowLoginPopup } from '../../store/slices/loginSlice'
import { registerButtonLoading, setIsShowRegisterPopup } from '../../store/slices/registerSlice'
import { showDifferentPasswordSitePopup, universalLoginDifferentPasswordSite } from '../../store/slices/universalLoginSlice'
import { ADD_ACCOUNT, LOGIN, MERGE_ACCOUNT, REGISTER } from '../lib/constant'
import { handleHideUniversalAddAccountPopup, hideOldUserMergeAccountPopup } from './universal-login.action'
import store from '../../store/index'
import {
    profilePhotoUploading,
    resetAuth,
    setCurrentDomain,
    setCurrentUser,
    setIsProfileReadyAction,
    setReadyForRedirect
} from '../../store/slices/authSlice'
import { api } from './base-url'
import { setAuthToken } from '../lib/set-auth-token'
import { removePromotionOffer } from '../../store/slices/promotionSlice'
import { removeResubscriptionOffer } from '../../store/slices/offerSlice'
import { sendMobileInfoToServices } from './utility.action'
import { setFeedImages, setFullScreenLoader, setMainScreenLoader } from '../../store/slices/modelSlice'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import socket from '../lib/socket'
import { refreshMessageCount } from './chat.action'
import { resetChatData } from '../../store/slices/chatSlice'
import { resetCoupon } from '../../store/slices/couponSlice'
import { getBlogData } from './blog.action'

export const getCurrentUserDetails = (router, from, action, requestFrom = '', redirectUrl = '', domain) => async (dispatch) => {
    const state = store.getState()

    const isUserDetailFetched = await getUserDetails(dispatch, true, domain)
    if (isUserDetailFetched) {
        const isUniversalLoginEnabled = _.get(state, 'universalLogin.is_universal_login_enabled', false)
        const differentPasswordSite = _.get(state, 'universalLogin.differentPasswordSiteList', [])

        // universal login logic
        if (isUniversalLoginEnabled) {
            if (action === ADD_ACCOUNT) {
                dispatch(handleHideUniversalAddAccountPopup(router, from, requestFrom, redirectUrl, domain))
            } else if (action === MERGE_ACCOUNT) {
                dispatch(hideOldUserMergeAccountPopup(from))
            }
        }

        // REGISTER logic
        dispatch(setReadyForRedirect(true))
        if (from === REGISTER) {
            dispatch(registerButtonLoading(false))
            dispatch(setIsShowRegisterPopup(false))
            dispatch(redirectRegisterUser(router, requestFrom, redirectUrl, domain))

            if (differentPasswordSite.length > 0) {
                dispatch(showDifferentPasswordSitePopup(true))
            }
        } else if (from === LOGIN && ['', MERGE_ACCOUNT].includes(action)) {
            // LOGIN logic
            dispatch(loginButtonLoading(false))
            dispatch(setIsShowLoginPopup(false))
            const currentRoute = localStorage.getItem('routeBeforeLogin')

            if (currentRoute) {
                const parts = currentRoute.split('/')
                const routeToken = parts.pop()
                const verificationSource = parts.pop()
                router.replace(`/${verificationSource}/${routeToken}?name=${domain}`)
            } else {
                router.replace(`/model-profile/${domain}?name=${domain}`)

                if (differentPasswordSite.length > 0) {
                    dispatch(showDifferentPasswordSitePopup(true))
                }
            }
        }
    }
    dispatch(removePromotionOffer())
    return
}

// Get current user details
export const getUserDetails = async (dispatch, isRequestFromLoginOrSignupAPI = false, domain, email = '', router) => {
    const token = localStorage.getItem('AuthToken')
    if (!token) {
        dispatch(setIsProfileReadyAction())
        return true
    }

    try {
        const url = '/v1/get-user-details'
        const params = {
            is_request_from_login_or_signup_api: isRequestFromLoginOrSignupAPI,
            domain: domain,
            email: email
        }

        const result = await api.get(url, { params })
        localStorage.setItem('currentDomain', result.data.data.domain)
        dispatch(setCurrentDomain(result.data.data.domain))
        dispatch(updateUserDetails(result, isRequestFromLoginOrSignupAPI, domain))
        if (result.data.data.isNewUser) {
            dispatch(removeResubscriptionOffer())
            dispatch(removePromotionOffer())
            dispatch(resetChatData())
        }

        dispatch(resetCoupon())
        if (result.data.data.domain) {
            getBlogData(result.data.data.domain, { pageNum: 1 }, dispatch)
        }
        return true
    } catch (error) {
        dispatch(loginButtonLoading(false))
        dispatch(registerButtonLoading(false))
        dispatch(setFullScreenLoader(false))
        logoutUser(dispatch)
        if (router) {
            router.replace('/')
        }
        return false
    }
}

/**
 * @description Update user details after /me API call is completed
 * @param {object} result Response data
 * @param {boolean} isRequestFromLoginOrSignupAPI Is API request from login or sign up
 */
const updateUserDetails = (result, isRequestFromLoginOrSignupAPI, domain) => dispatch => {
    dispatch(setCurrentUser(result.data.data))
    dispatch(setIsProfileReadyAction())
    refreshMessageCount(domain, dispatch)
    // if (result.data.data.ccbillSubscriptionStatus === '2') {
    //     dispatch(toggleAnnouncementBanner(true))
    // }
    // if (result.data.data.isAdmin === true && isRequestFromLoginOrSignupAPI === true) {
    //     dispatch(getInfluencerHelpPopupData(() => { }))
    // }

    // if (result.data.data.isAdmin === false && isRequestFromLoginOrSignupAPI === true) {
    //     dispatch(getUserInfluencerHelpPopupData(() => { }))
    // }

    if (result.data.data.isAdmin === false && result.data.role !== 'proxy_user') {
        const userId = _.get(result, 'data.data._id', '')
        socket.emit('USER_ONLINE', {
            userId: userId,
            email: result.data.data.email
        })
    }

    const differentPasswordSiteList = _.get(result, 'data.data.siteListOfDifferentPassword', [])
    if (differentPasswordSiteList.length > 0) {
        const differentPasswordPopupReminderCount = localStorage.getItem('differentPasswordPopupReminderCount')
        if (!differentPasswordPopupReminderCount) {
            localStorage.setItem('differentPasswordPopupReminderCount', 0)
            dispatch(showDifferentPasswordSitePopup(true))
        } else {
            if ([0, 12, 23, 31, 45].includes(Number(differentPasswordPopupReminderCount))) dispatch(showDifferentPasswordSitePopup(true))
        }

        dispatch(universalLoginDifferentPasswordSite(differentPasswordSiteList))
    }

    const data = {
        is_running_from_pwa: window.matchMedia('(display-mode: standalone)').matches === true,
        user_id: result.data.data._id,
        user_agent: window.navigator.userAgent,
        ccbill_subscription_status: result.data.data.ccbillSubscriptionStatus
    }
    // Sentry.setUser({ id: result.data._id })
    dispatch(sendMobileInfoToServices(domain, data))
    // dispatch(showPushNotificationPrompt())
}

// redirect to user while register
export const redirectRegisterUser = (router, requestFrom, redirectUrl, domain) => () => {
    if (requestFrom === 'newRegisterPage') {
        return window.location.replace(redirectUrl)
    } else if (requestFrom === 'ccbillRestApi' || requestFrom === 'stickyIo') {
        router.replace(`/subscription?name=${domain}`)
        return
    }
    router.replace(`/membership?name=${domain}`)
}

// logout user
export const logoutUser = (dispatch) => {
    dispatch(setMainScreenLoader(true))
    localStorage.removeItem('differentPasswordPopupReminderCount')
    dispatch(universalLoginDifferentPasswordSite([]))

    // dispatch(resetHelpNotification())
    // dispatch(resetUserHelpNotification())
    // removeUserDataFromOneSignal()
    // Remove token from local storage
    localStorage.removeItem('AuthToken')
    localStorage.removeItem('showEmailNotificationPrompt')
    localStorage.removeItem('currentDomain')
    // Remove auth header for future requests
    setAuthToken(false)
    // Set current user to empty object {} which will set isAuthenticated to false
    dispatch(setCurrentUser({}))
    // const data = {
    //     pageNum: 1
    // }
    // dispatch(getAllBlogs(false, data, () => { }))
    // dispatch(resetCurrentPage())
    dispatch(removeResubscriptionOffer())
    dispatch(removePromotionOffer())
    dispatch(resetChatData())
    dispatch(resetCoupon())
    dispatch(setFeedImages([]))
    dispatch(setMainScreenLoader(false))
}

export const checkAuthToken = (dispatch, domain) => {
    const authToken = localStorage.getItem('AuthToken')
    if (authToken) {
        // Decode token and get user info and exp
        const decoded = jwtDecode(authToken)
        // Check for expired token
        const currentTime = Date.now() / 1000
        if (decoded.exp < currentTime) {
            // Logout user
            logoutUser(dispatch)
        } else {
            // Set auth token header auth
            setAuthToken(authToken)

            // Set user and isAuthenticated
            // store.dispatch(setCurrentUser(decoded))

            // Get Current user details
            getUserDetails(dispatch, false, domain)
        }
    } else {
        dispatch(setIsProfileReadyAction())
    }
}

export const updateProfile = (domain, data, dispatch) => async () => {
    dispatch(profilePhotoUploading(true))
    try {
        const params = {
            domain: domain
        }

        await api.post(`/v1/update-profile`, data, { params })
        const isUserFetched = await getUserDetails(dispatch, false, domain)
        if (isUserFetched) {
            dispatch(setSweetAlert({ description: 'Profile Details Updated Successfully.' }))
            dispatch(profilePhotoUploading(false))
        }
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'response.data.message', 'Error while update profile')
        dispatch(setSweetAlert({ description: errorMessage }))
        dispatch(profilePhotoUploading(false))
    }
}

