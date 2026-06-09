import axios, { AxiosResponse } from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const addHelpTag = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/tag/save`
    return axios.post(url, data)
}

export const editHelpTag = (data: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/tag/save`
    return axios.post(url, data)
}

export const getHelpTagList = (page_num: number, filter: object): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/get/tagList?page_num=${page_num}`
    return axios.post(url, filter)
}

export const getHelpTagDataById = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/get/tag/id?_id=${_id}`
    return axios.get(url)
}

export const getAllHelpTagList = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/get/allTagList`
    return axios.get(url)
}

export const getSpecificWebsiteHelpTagList = (): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/get/specificWebsiteTagList`
    return axios.get(url)
}

export const deleteInfluencerHelpTagData = (_id: string): Promise<AxiosResponse> => {
    const url = `${baseURL}/help/tag/delete`
    return axios.post(url, { _id: _id })
}
