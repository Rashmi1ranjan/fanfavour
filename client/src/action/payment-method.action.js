import _ from 'lodash'
import { api } from './base-url'
import { updateDefaultPaymentMethod } from '../../store/slices/authSlice'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'

/**
 * 
 * @param {string} domain user current domain
 * @returns {object} response from api
 */
export const getUsersPaymentMethod = async (domain, dispatch) => {
  try {
    const params = {
      domain: domain
    }

    const res = await api.get(`/v1/payment/get-payment-card`, { params })
    return res.data
  } catch (error) {
    const errorMessage = _.get(error, 'response.data.message', error.response?.data?.message)
    dispatch(setSweetAlert({ description: errorMessage }))
  }
}

/**
 * 
 * @param {string} domain user current domain
 * @returns {object} response from api
 */
export const getUsersNewPaymentMethod = async (domain) => {
  try {
    const params = {
      domain: domain
    }

    const res = await api.get(`/v1/payment/get-new-payment-card`, { params })
    return res.data
  } catch (error) {
    const errorMessage = _.get(error, 'response.data.message', 'Error while getting payment method')
    dispatch(setSweetAlert({ description: errorMessage }))
  }
}

/**
 * 
 * @param {string} domain user current domain
 * @param {object} data card id
 * @param {function} dispatch method to update state
 * @returns {object} response from api
 */
export const markCardAsPrimary = async (domain, data, dispatch) => {
  try {
    const res = await api.post(`/v1/payment/mark-card-as-primary`, { data, domain })
    if (res.data.data.paymentMethod === 'crypto_currency') {
      const responseData = {
        payment_method: 'credit_card'
      }
      dispatch(updateDefaultPaymentMethod(responseData))
    }
    return res.data
  } catch (error) {
    const errorMessage = _.get(error, 'response.data.message', 'Error while marking card as primary')
    dispatch(setSweetAlert({ description: errorMessage }))
  }
}

/**
 * 
 * @param {string} domain user current domain
 * @param {object} data card id
 * @param {function} dispatch method to update state
 * @returns {object} response from api
 */
export const removeCard = async (domain, data, dispatch) => {
  try {
    const res = await api.post(`/v1/payment/remove-card`, { data, domain })
    return res.data
  } catch (error) {
    const errorMessage = _.get(error, 'response.data.message', 'Error while removing card')
    dispatch(setSweetAlert({ description: errorMessage }))
  }
}

/**
 * 
 * @param {string} domain user current domain
 * @param {object} data card id
 * @param {function} dispatch method to update state
 * @returns {object} response from api
 */
export const saveUserDefaultPaymentMethod = async (domain, data, dispatch) => {
  try {
    await api.post(`/v1/payment/save-user-default-payment-method`, { data, domain })
    dispatch(updateDefaultPaymentMethod(data))
    return true
  } catch (error) {
    const errorMessage = _.get(error, 'response.data.message', 'Error while saving user default payment method')
    dispatch(setSweetAlert({ description: errorMessage }))
    return false
  }
}
