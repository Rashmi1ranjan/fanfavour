import _ from "lodash"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import { errorResponse, successResponse, validateRequest } from "../helper/common.js"
import { websiteApiRequest } from '../utils/axiosClient.js'


export const getCryptoCurrencyList = async (req, res) => {
    try {
        const domain = _.get(req, 'query.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }
        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        const params = { requestFrom: 'FF' }
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/crypto/get-currency-list',
            params,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch user payment method successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get payment method')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getTransactionStatus = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        let data = _.get(req, 'body.data', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/crypto/get-transaction-status',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch transaction status.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while fetch transaction status.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getTransactionData = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        const data = _.get(req, 'body.reqData', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }

        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/crypto/get-transaction-status',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Fetch transaction data successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while fetch transaction data.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const addCryptoFund = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        let data = _.get(req, 'body.data', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/crypto/add-fund-and-payment',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Add fund successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while add crypto fund.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}


export const generatePaymentId = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        let data = _.get(req, 'body.data', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/crypto/generate-payment-id',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, 'Payment Id generated successfully.')
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while generate payment Id.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const purchaseFromWallet = async (req, res) => {
    try {
        const domain = _.get(req, 'body.domain', '')
        if (_.isEmpty(domain)) {
            return errorResponse(res, {}, 'Domain is required', HTTP_BAD_REQUEST_400)
        }

        let data = _.get(req, 'body.reqData', '')
        if (_.isEmpty(data)) {
            return errorResponse(res, {}, 'Data is required', HTTP_BAD_REQUEST_400)
        }

        const token = _.get(req, 'token', req.headers.token)
        if (_.isEmpty(token)) {
            return errorResponse(res, {}, 'Token is required', HTTP_BAD_REQUEST_400)
        }
        data.requestFrom = 'FF'
        let currentDomain = data.domain
        if (data.payment_for === 'subscription') {
            currentDomain = domain
        }
        let endpoint = 'api/crypto/purchase-from-wallet'
        if (_.get(data, 'isUniversalChat', false) === true) {
            endpoint = 'api/universal-chat/purchase/purchase-from-wallet'
        }

        const responseData = await websiteApiRequest({
            domain: currentDomain,
            method: 'post',
            endpoint,
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while purchase.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

export const getWalletHistory = async (req, res) => {
    try {
        const validated = validateRequest(req, res, 'body.data', 'data is required')

        if (!validated) return
        const { domain, data } = validated

        const responseData = await websiteApiRequest({
            domain,
            method: 'post',
            endpoint: '/api/crypto/wallet-history',
            data,
            auth: 'user',
            userAuth: {
                token: req.headers.token
            }
        })
        return successResponse(res, responseData.data.data, responseData.data.message)
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error while get wallet history.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
