import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
  bannerImages: [],
  appSettings: {},
  counts: {},
  user: {},
  domain: '',
  isAuthenticated: false,
  profilePhotoUploading: false,
  isAdmin: false,
  isModel: false,
  isSuperAdmin: false,
  isContentManager: false,
  isSupport: false,
  isSubAdmin: false,
  isProfileReady: false,
  isBlocked: false,
  userUnreadMessage: 0,
  isReady: false,
  isReadyForRedirect: false
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // setUserIsAuthenticate: (state, action) => {
    //   state.isAuthenticated = action.payload
    // },
    setCurrentDomain: (state, action) => {
      state.domain = action.payload
    },
    setCurrentUser: (state, action) => {
      const role = _.get(action.payload, 'role', '')
      const isContentManager = (role === 'content_manager')
      const isModel = (role === 'model')
      const isSuperAdmin = (role === 'admin')
      const isSubAdmin = (role === 'sub_admin')
      const isSupport = (role === 'support')
      const isAdmin = _.get(action.payload, 'isAdmin', false)

      state.isAuthenticated = !_.isEmpty(action.payload)
      state.user = action.payload
      state.profilePhotoUploading = false
      state.isAdmin = isAdmin
      state.isModel = isModel
      state.isContentManager = isContentManager
      state.isSuperAdmin = isSuperAdmin
      state.isSupport = isSupport
      state.isSubAdmin = isSubAdmin
      state.isReady = true
    },
    updateDefaultPaymentMethod: (state, action) => {
      state.user = {
        ...state.user,
        default_payment_method: action.payload.payment_method
      }
    },
    updateUserSubscriptionStatus: (state, action) => {
      state.user = {
        ...state.user,
        ccbillSubscriptionStatus: '2',
        isRebillFailed: false,
        payment: {
          ...state.user.payment,
          membership: true
        }
      }
    },
    appSettings: (state, action) => {
      if (action.payload.appSettings.theme_2_banner_images_url) {
        state.bannerImages = action.payload.appSettings.theme_2_banner_images_url.split(',')
      }

      state.isReady = true
      state.isBlocked = action.payload.blocked
      state.appSettings = action.payload.appSettings
    },
    updateWalletAmount: (state, action) => {
      state.user.wallet_amount = action.payload
    },
    setIsProfileReadyAction: (state, action) => {
      state.isProfileReady = true
    },
    setUnreadCount: (state, action) => {
      state.counts = action.payload
    },
    updateUnreadCountInNavbar: (state, action) => {
      const userUnreadCount = state.counts
      userUnreadCount.userUnreadMessage = (Number(userUnreadCount.userUnreadMessage) || 0) + action.payload
      state.counts = userUnreadCount
    },
    removePayPerMessageCredit: (state, action) => {
      state.user.payPerMessageCredit = state.user.payPerMessageCredit > 0 ? state.user.payPerMessageCredit - 1 : 0
    },
    addPayPerMessageCredit: (state, action) => {
      state.user.payPerMessageCredit = state.user.payPerMessageCredit + 1
    },
    setReadyForRedirect: (state, action) => {
      state.isReadyForRedirect = action.payload
    },
    profilePhotoUploading: (state, action) => {
      state.profilePhotoUploading = action.payload
    }
  }
})

export const {
  setCurrentDomain,
  setCurrentUser,
  setIsProfileReadyAction,
  updateDefaultPaymentMethod,
  updateUserSubscriptionStatus,
  appSettings,
  updateWalletAmount,
  setUnreadCount,
  updateUnreadCountInNavbar,
  removePayPerMessageCredit,
  addPayPerMessageCredit,
  setIsUserReady,
  setReadyForRedirect,
  profilePhotoUploading
} = authSlice.actions

export default authSlice.reducer
