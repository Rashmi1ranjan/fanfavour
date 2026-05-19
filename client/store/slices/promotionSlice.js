import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    isSetPromotion: false,
    subscriptionPromotion: false,
    lockedContentPromotion: false
}

export const promotionSlice = createSlice({
    name: 'promotion',
    initialState,
    reducers: {
        setPromotion: (state, action) => {
            state.isSetPromotion = true
            state.subscriptionPromotion = action.payload.subscription_promotion
            state.lockedContentPromotion = action.payload.locked_content_promotion
        },
        removePromotionOffer: (state, action) => {
            state.isSetPromotion = false
            state.subscriptionPromotion = false
            state.lockedContentPromotion = false
        }
    }
})

export const { setPromotion, removePromotionOffer } = promotionSlice.actions
export default promotionSlice.reducer