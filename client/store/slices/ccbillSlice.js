import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    isLoading: false,
    isBlogPaymentLoading: false
}

export const ccbillSlice = createSlice({
    name: 'ccbill',
    initialState,
    reducers: {
        paymentProcessing: (state, action) => {
            state.isLoading = action.payload
        },
        blogUnlockPaymentProcessing: (state, action) => {
            state.isBlogPaymentLoading = action.payload
        }
    }
})

export const { paymentProcessing, blogUnlockPaymentProcessing } = ccbillSlice.actions
export default ccbillSlice.reducer