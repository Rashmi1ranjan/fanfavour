import _ from 'lodash'
import { websiteApiRequest } from './axiosClient.js'

const getUserDetails = async (domain, email) => {
    try {
        const responseData = await websiteApiRequest({
            domain,
            method: 'get',
            endpoint: '/api/users/get-user-details',
            params: { email },
            auth: 'service-header'
        })
        return responseData.data.data
    } catch (error) {
        const errorData = _.get(error, 'response.data', error)
        const errorMessage = _.get(errorData, 'message', 'Error while get user details')
        throw new Error(errorMessage)
    }
}