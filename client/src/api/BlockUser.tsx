import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addBlockUser = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_user`
    return axios.post(url, data)
}

export const getBlockUserList = (page_num: number, filter: object, sort_by: object): Promise<AxiosResponse> => {
    const data = {
        page_num,
        filter,
        sort_by
    }
    const url = `${baseURL}/api/get_block_user_list`
    return axios.post(url, data)
}

export const getBlockUserById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_user_by_id?_id=${_id}`
    return axios.get(url)
}

export const editBlockUser = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/block_user`
    return axios.put(url, data)
}

export const getBlockedUsersList = (id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/api/blocked_users_list?id=${id}`
    return axios.get(url)
}
export default { addBlockUser }
