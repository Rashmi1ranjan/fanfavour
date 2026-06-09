import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addDatabase = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/add_Database`
    return axios.post(url, data)
}

export const editDatabase = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/edit_Database`
    return axios.post(url, data)
}

export const getDatabaseList = (page_num: number): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/get_database_list?page_num=${page_num}`
    return axios.get(url)
}

export const getDatabaseDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/get_database_data_by_id?_id=${_id}`
    return axios.get(url)
}

export const getDatabaseLists = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/get_database_lists`
    return axios.get(url)
}

export const getDatabaseOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/database/get_all_database_options`
    return axios.get(url)
}

export default { addDatabase, editDatabase, getDatabaseList, getDatabaseDataById }
