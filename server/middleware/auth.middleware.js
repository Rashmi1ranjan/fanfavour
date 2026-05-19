import _ from 'lodash'
import { errorResponse } from '../helper/common.js'
import { HTTP_UNAUTHORIZED_401 } from '../helper/http.status.js'

// logged in user middleware to protect api
export const protectRouteWithToken = async (req, res, next) => {
    const token = _.get(req, 'headers.token', '')
    if (token.startsWith('ff_')) {
        next()
    } else {
        return errorResponse(res, { error: 'You are not authorized to access this route' }, 'Unauthorized', HTTP_UNAUTHORIZED_401)
    }
}
