import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoading: false,
  registerUserInfo: {},
  isShowRegisterPopup: false
}

export const registerUser = createSlice({
  name: 'registerUser',
  initialState,
  reducers: {
    registerButtonLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setRegisterUserInfo: (state, action) => {
      state.registerUserInfo = action.payload
    },
    setIsShowRegisterPopup: (state, action) => {
      state.isShowRegisterPopup = action.payload
    }

  }
})

export const { registerButtonLoading, setRegisterUserInfo, setIsShowRegisterPopup } = registerUser.actions

export default registerUser.reducer