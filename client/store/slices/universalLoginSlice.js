import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isUniversalLoginDifferentPasswordPopupVisible: false,
  siteListOfMergeAccount: [],
  universalMergeWebsiteList: [],
  differentPasswordSiteList: [],
  siteListOfOldUserWebsiteList: [],
  showUniversalLoginPopup: false,
  showOldUserMergeAccountPopup: false,
  showUniversalLoginForgotPasswordPopup: false,
  showDifferentPasswordSitePopup: false,
  isOldUser: false,
  email: '',
  is_universal_login_enabled: false
}

export const universalLoginSlice = createSlice({
  name: 'universal_login',
  initialState,
  reducers: {
    // List of merge account site list
    universalLoginWebsiteList: (state, action) => {
      state.siteListOfMergeAccount = action.payload
    },
    // Show add account popup while login and register fresh user
    showUniversalLoginAddAccountPopup:(state, action) => {
        state.showUniversalLoginPopup = action.payload
    },
    // universal login merge site list
    universalLoginMergeWebsite: (state, action) => {
      state.universalMergeWebsiteList = action.payload
    },
    //Show old user merge account popup
    showUniversalLoginMergeAccountPopup: (state, action) => {
        state.showOldUserMergeAccountPopup = action.payload
    },
    // show forgot password popup
    showForgotPasswordPopup: (state, action) => {
      state.showUniversalLoginForgotPasswordPopup = action.payload
    },
    // forgot password email
    setForgotPasswordEmail: (state, action) => {
      state.email = action.payload
    },
    universalLoginOldUserWebsiteList: (state, action) => {
      state.siteListOfOldUserWebsiteList = action.payload
    },
     //List of different password site list
    universalLoginDifferentPasswordSite: (state, action) => {
        state.differentPasswordSiteList = action.payload
    },
    showDifferentPasswordSitePopup: (state, action) => {
      state.showDifferentPasswordSitePopup = action.payload
    },
    // set if old user
    setMergeOldUser: (state, action) => {
      state.isOldUser = action.payload
    },
    // store universal login status
    setIsUniversalLoginEnabled: (state, action) => {
      state.is_universal_login_enabled = action.payload
    },
    setUniversalLoginDifferentPasswordPopupVisibility: (state, action) => {
      state.isUniversalLoginDifferentPasswordPopupVisible = action.payload
    },
    universalLoginMergeWebsiteList: (state, action) => {
      state.siteListOfOldUserWebsiteList = action.payload
    }
  }
})

export const {
  showUniversalLoginAddAccountPopup,
  showUniversalLoginMergeAccountPopup,
  universalLoginDifferentPasswordSite,
  showForgotPasswordPopup,
  setForgotPasswordEmail,
  showOldUserMergeAccountPopup,
  universalLoginOldUserWebsiteList,
  showDifferentPasswordSitePopup,
  setMergeOldUser,
  universalLoginWebsiteList,
  setUniversalLoginDifferentPasswordPopupVisibility,
  universalLoginMergeWebsiteList,
  setIsUniversalLoginEnabled
} = universalLoginSlice.actions

export default universalLoginSlice.reducer
