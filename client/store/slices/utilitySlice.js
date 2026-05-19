import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    showPaymentModel: false,
    paymentCascade: {},
    paymentRequest: {}
}

export const utilitySlice = createSlice({
    name: 'utility',
    initialState,
    reducers: {
        togglePaymentModal: (state, action) => {
            state.showPaymentModel = !state.showPaymentModel
            state.paymentCascade = action.payload.paymentCascade
            state.paymentRequest = action.payload.paymentRequest
        }
    }
})

export const { togglePaymentModal } = utilitySlice.actions

export default utilitySlice.reducer