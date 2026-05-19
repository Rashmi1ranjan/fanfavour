import _ from 'lodash'
import { setCouponCode, setCouponDetails, updateCouponLoading, updateCouponStatus } from '../../store/slices/couponSlice'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { api } from './base-url'

/**
 * @description Check coupon is valid
 *
 * @param {object} data coupon code
 * @returns {object} coupon details
 */
export const checkCouponIsValid = async (domain, data, dispatch) => {
    const url = '/v1/coupon/check'
    try {
        const res = await api.post(url, { domain, data })
        dispatch(setCouponCode(data.code))
        dispatch(setCouponDetails(res.data.data))
        dispatch(updateCouponStatus('valid'))
        return res.data.data
    } catch (error) {
        console.log(error)
        dispatch(setCouponCode(''))
        dispatch(setCouponDetails({}))
        dispatch(updateCouponStatus('invalid'))
        const codeErrorMessage = _.get(error, 'response.data.message', '')
        const errorMessage = _.get(error, 'response.data.message', 'Something went wrong please try again after some time')
        if (_.isEmpty(codeErrorMessage)) {
            dispatch(setSweetAlert({ description: errorMessage }))
        }
        throw new Error(codeErrorMessage)
    } finally {
        dispatch(updateCouponLoading(false))
    }
}

export const resetCouponStore = () => (dispatch) => {
    dispatch(updateCouponLoading(false))
    dispatch(setCouponDetails({}))
    dispatch(setCouponCode(''))
    dispatch(updateCouponStatus('notChecked'))
}
