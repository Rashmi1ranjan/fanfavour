import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addModel = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/add-model`
    return axios.post(url, data)
}

export const editModel = (data: object, previousData: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/edit-model`
    const websiteData = {
        data: data,
        previousData: previousData
    }
    return axios.post(url, websiteData)
}

export const getModelList = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/get_model_list?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getModelDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/get_model_data_by_id?_id=${_id}`
    return axios.get(url)
}

export const getFeaturedModelText = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/get_featured_model_text`
    return axios.get(url)
}

export const saveFeaturedModelText = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/save_featured_model_text`
    return axios.post(url, data)
}

export const removeModelById = (modelId: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/model/remove_model_by_id`
    return axios.post(url, { modelId })
}

export default { addModel, editModel, getModelList, getModelDataById, removeModelById }
