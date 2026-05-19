import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import _ from 'lodash'
import { api } from './base-url'
import { setPromotion } from '../../store/slices/promotionSlice'

export const getAllPromotionOffers = async (domain, dispatch) => {
    try {
        const url = '/v1/offer/check-offer'
        const res = await api.post(url, { domain })
        dispatch(setPromotion(res.data.data))
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get promotion offer')
        dispatch(setSweetAlert({ description: errorMessage }))
    }
}