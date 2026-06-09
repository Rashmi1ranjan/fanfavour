import axios, {AxiosResponse} from 'axios'
import { getAppBaseUrl } from './api'
const baseURL = getAppBaseUrl()

export const getSuspiciousUserList = (page_num:number, filter:object):Promise <AxiosResponse> =>{
    const data = {
        page:page_num,
        filter
    }
    const url = `${baseURL}/suspicious-user/getSuspiciousUser?page_num=${page_num}`
    return axios.post(url, data)
}
