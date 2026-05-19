import _ from 'lodash'
import {
    showUniversalLoginAddAccountPopup,
    universalLoginWebsiteList,
    showUniversalLoginMergeAccountPopup,
    universalLoginDifferentPasswordSite,
    showForgotPasswordPopup,
    setForgotPasswordEmail,
    setMergeOldUser,
    showDifferentPasswordSitePopup,
    universalLoginMergeWebsiteList
} from '../../store/slices/universalLoginSlice'
import { setLoginUserInfo, loginButtonLoading } from '../../store/slices/loginSlice'
import { setRegisterUserInfo } from '../../store/slices/registerSlice'
import { LOGIN, REGISTER } from '../lib/constant'
import { redirectRegisterUser } from './users.action'


/**
 * @description show add account popup and store register or login user info
 * @param {object} accountList list of add account list
 * @param {object} userData object data of user email and password
 * @param {string} requestFrom request from login or register
 * @returns return after store add account list and show merge popup
 */
export const handleShowUniversalAddAccountPopup = (accountList, userData, requestFrom) => (dispatch) => {
    const addAccountList = _.get(accountList, 'data.data.siteListOfMergeAccount', [])
    // store website list for add account in universal login
    dispatch(universalLoginWebsiteList(addAccountList))
    // set status of show universal login add account popup
    dispatch(showUniversalLoginAddAccountPopup(true))
    // set user info for use while login users from universal login add account popup
    if (requestFrom === LOGIN) {
        dispatch(setLoginUserInfo(userData))
    }
    // set user info for use while register users from universal login add account popup
    if (requestFrom === REGISTER) {
        dispatch(setRegisterUserInfo(userData))
    }
    return
}

/**
 *
 * @description show old user merge account popup
 * @param {Array} accountList list of old user merge domain
 * @param {object} userData object data of user email and password
 * @returns return after show old user account
 */
export const showOldUserMergeAccountPopup = (accountList, userData, requestFrom) => (dispatch) => {
    const mergeAccountList = _.get(accountList, 'data.data.siteListOfMergeOldAccount', [])
    const differentPasswordSiteList = _.get(accountList, 'data.data.siteListOfDifferentPassword', [])
    // store website list for add account in universal login
    dispatch(universalLoginMergeWebsiteList(mergeAccountList))
    // set status of show universal login add account popup
    dispatch(showUniversalLoginMergeAccountPopup(true))
    // set different password site list
    if (differentPasswordSiteList.length > 0) {
        localStorage.setItem('differentPasswordPopupReminderCount', 0)
    }
    dispatch(universalLoginDifferentPasswordSite(differentPasswordSiteList))
    // set user info for use while login users from universal login add account popup
    if (requestFrom === LOGIN) {
        dispatch(setLoginUserInfo(userData))
    }
    // set user info for use while register users from universal login add account popup
    if (requestFrom === REGISTER) {
        dispatch(setRegisterUserInfo(userData))
    }
    return
}

/**
 * @description handle empty merge website list store object and hide add account popup
 * @param {void} history
 * @param {string} from from register or login
 * @param {string} requestFrom requestFrom newRegisterPage, ccbill and sticky io
 * @param {string} redirectUrl user redirect url while user register
 * @returns return after user empty merge website list store and hide add account popup
 */
export const handleHideUniversalAddAccountPopup = (history, from, requestFrom, redirectUrl, domain) => (dispatch) => {
    // empty object after add account website in universal login
    dispatch(universalLoginWebsiteList([]))
    // set show universal login popup to false
    dispatch(showUniversalLoginAddAccountPopup(false))
    // empty object of store login user info after add account user in the universal login
    if (from === LOGIN) {
        dispatch(loginButtonLoading(false))
        dispatch(setLoginUserInfo({}))
        // check and redirect user while user add account from login page
        dispatch(redirectRegisterUser(history, requestFrom, redirectUrl, domain))
    }
    // empty object of store register user info after add account user in the universal login
    if (from === REGISTER) {
        dispatch(setRegisterUserInfo({}))
    }
    return
}

/**
 * @description store universal merge website and show forgot password popup
 * @param {object} data object of user add account list
 * @param {string} email user email
 * @returns return after show forgot password popup
 */
export const showUniversalForgotPasswordPopup = (data, email) => (dispatch) => {
    dispatch(showForgotPasswordPopup(true))
    dispatch(setForgotPasswordEmail(email))
    const addAccountList = _.get(data, 'data.data.siteListOfMergeAccount', [])
    // store website list for add account in universal login
    dispatch(universalLoginWebsiteList(addAccountList))
    // set to merge old user while show different password popup if only found old user with different password
    const oldUser = _.get(data, 'data.data.mergeOldUser', false)
    dispatch(setMergeOldUser(oldUser))
    return
}

/**
 * @description hide old user merge popup while merge account
 * @param {string} requestFrom requestFrom login or register
 * @returns hide old user merge popup
 */
export const hideOldUserMergeAccountPopup = (requestFrom) => (dispatch) => {
    // empty store website list for merge account in universal login
    dispatch(universalLoginMergeWebsiteList([]))
    // set status of show universal login merge account popup
    dispatch(showUniversalLoginMergeAccountPopup(false))
    // set empty user info for use while login users from universal login add account popup
    if (requestFrom === LOGIN) {
        dispatch(setLoginUserInfo({}))
    }
    // set empty user info for use while register users from universal login add account popup
    if (requestFrom === REGISTER) {
        dispatch(setRegisterUserInfo({}))
    }
    return
}

/**
 * @description show different password popup and store different password site list
 * @param {Array} accountList different password site list
 * @param {object} userData user email and password while show different password
 * @returns show different password popup and store different password site
 */
export const setAndShowDifferentPasswordSiteList = (accountList, userData) => (dispatch) => {
    const differentPasswordSite = _.get(accountList, 'data.data.siteListOfDifferentPassword', [])
    dispatch(setLoginUserInfo(userData))
    // store different password site list
    dispatch(universalLoginDifferentPasswordSite(differentPasswordSite))
    // show different password site popup for reset password
    dispatch(showDifferentPasswordSitePopup(true))
    return
}

