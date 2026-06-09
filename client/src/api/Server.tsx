import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addServer = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/add_server`
    return axios.post(url, data)
}

export const editServer = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/edit_server`
    return axios.post(url, data)
}

export const getServerList = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/get_server_list`
    return axios.get(url)
}

export const getServerLists = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/get_server_lists`
    return axios.get(url)
}

export const getServerDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/get_server_data_by_id?_id=${_id}`
    return axios.get(url)
}

export const getServerOptions = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/users/server/get_all_server_options`
    return axios.get(url)
}

export default { addServer, editServer, getServerList, getServerLists, getServerDataById }
