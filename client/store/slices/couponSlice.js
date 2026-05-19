import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    isLoading: false,
    couponCodeDetails: {},
    couponCode: '',
    couponStatus: 'notChecked', // valid, invalid, notChecked,
    couponList: [],

}

export const couponSlice = createSlice({
    name: 'coupon',
    initialState,
    reducers: {
        updateCouponLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setCouponCode: (state, action) => {
            state.couponCode = action.payload
        },
        updateCouponStatus: (state, action) => {
            state.couponStatus = action.payload
        },
        setCouponDetails: (state, action) => {
            state.couponCodeDetails = action.payload
        },
        resetCoupon: () => initialState
    }
})

export const {
    updateCouponLoading,
    setCouponCode,
    updateCouponStatus,
    setCouponDetails,
    resetCoupon
} = couponSlice.actions
export default couponSlice.reducer
