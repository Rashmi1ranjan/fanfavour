import { configureStore } from '@reduxjs/toolkit'
import modelSlice from './slices/modelSlice'
import authSlice from './slices/authSlice'
import universalLoginSlice from './slices/universalLoginSlice'
import loginSlice from './slices/loginSlice'
import registerSlice from './slices/registerSlice'
import sweetAlertSlice from './slices/sweetAlertSlice'
import paymentSlice from './slices/paymentSlice'
import promotionSlice from './slices/promotionSlice'
import couponSlice from './slices/couponSlice'
import offerSlice from './slices/offerSlice'
import ccbillSlice from './slices/ccbillSlice'
import blogSlice from './slices/blogSlice'
import chatSlice from './slices/chatSlice'
import toastSlice from './slices/toastSlice'
import socketSlice from './slices/socketSlice'
import utilitySlice from './slices/utilitySlice'
import websiteBlogSlice from './slices/websiteBlogSlice'

export const store = configureStore({
  reducer: {
    models: modelSlice,
    auth: authSlice,
    universalLogin: universalLoginSlice,
    userLogin: loginSlice,
    userRegister: registerSlice,
    sweetAlert: sweetAlertSlice,
    payment: paymentSlice,
    promotion: promotionSlice,
    couponCode: couponSlice,
    resubscriptionOffer: offerSlice,
    ccbill: ccbillSlice,
    blog: blogSlice,
    chat: chatSlice,
    toast: toastSlice,
    socket: socketSlice,
    utility: utilitySlice,
    websiteBlog: websiteBlogSlice
  }
})

export default store
