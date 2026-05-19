import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    isPaymentProcessing: false
}

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    paymentProcessingStatus: (state, action) => {
      state.isPaymentProcessing = action.payload
    }
  }
})

export const { paymentProcessingStatus } = paymentSlice.actions

export default paymentSlice.reducer