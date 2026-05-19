import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoading: false,
  loginUserInfo: {},
  isShowLoginPopup: false,
  isShowForgotPasswordPopup: false
}

export const loginSlice = createSlice({
  name: 'loginUser',
  initialState,
  reducers: {
    loginButtonLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setLoginUserInfo: (state, action) => {
      state.loginUserInfo = action.payload
    },
    setIsShowLoginPopup: (state, action) => {
      state.isShowLoginPopup = action.payload
    },
    setIsShowForgotPasswordPopup: (state, action) => {
      state.isShowForgotPasswordPopup = action.payload
    }
  }
})

export const { loginButtonLoading, setLoginUserInfo, setIsShowLoginPopup, setIsShowForgotPasswordPopup } = loginSlice.actions

export default loginSlice.reducer

