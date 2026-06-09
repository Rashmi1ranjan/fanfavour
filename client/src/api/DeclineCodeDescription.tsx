import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addDeclineCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/decline_code_description/add_decline_code_description`
    return axios.post(url, data)
}

export const editDeclineCodeDescription = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/decline_code_description/edit_decline_code_description`
    return axios.post(url, data)
}

export const getDeclineCodeDescriptionList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/decline_code_description/get_decline_code_description_list?page_num=${page_num}`
    return axios.get(url)
}

export const getDeclineCodeDescriptionById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/decline_code_description/get_decline_code_description_by_id?_id=${_id}`
    return axios.get(url)
}

export const getDeclineCodeDescriptionOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/decline_code_description/get_all_decline_code_description_options`
    return axios.get(url)
}

export default { getDeclineCodeDescriptionOptions, addDeclineCodeDescription, editDeclineCodeDescription, getDeclineCodeDescriptionList, getDeclineCodeDescriptionById }
