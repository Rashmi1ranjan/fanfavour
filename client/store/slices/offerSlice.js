import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    isCheckOffer: false,
    isUserEligibleForOffer: false,
    offer: {}
}

export const offerSlice = createSlice({
    name: 'offer',
    initialState,
    reducers: {
        setResubscriptionOffer: (state, action) => {
            state.isCheckOffer = true,
            state.isUserEligibleForOffer = action.payload.isUserEligibleForOffer,
            state.offer = action.payload.offer
        },
        removeResubscriptionOffer: (state, action) => {
            state.isCheckOffer = false,
            state.isUserEligibleForOffer = false,
            state.offer = {}
        }
    }
})

export const { setResubscriptionOffer, removeResubscriptionOffer } = offerSlice.actions
export default offerSlice.reducer