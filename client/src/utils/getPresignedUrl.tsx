import axios from 'axios'
import _ from 'lodash'
import { getAppBaseUrl } from './../api/api'
const baseURL = getAppBaseUrl()

export async function getPresignedUrl(fileName: string, mediaType: string) {
    try {
        const url = '/api/upload/generate_presigned_url'
        const res = await axios.post(baseURL + url, { file_name: fileName, media_type: mediaType })
        const message = _.get(res, 'data.message', 'Successful')
        if (res.data.success === 1) {
            return res.data.data
        } else {
            return { presigned_url: '', message: message }
        }
    } catch (err: any) {
        const errorMessage = _.get(err, 'response.data.message', err.message)
        return { presigned_url: '', message: errorMessage }
    }
}

export const uploadFileToS3 = async (presignedUrl: string, file: File, contentType: string, setProgress?: (percent: number) => void) => {
    try {
        const axiosWithoutAuth = axios.create()
        delete axiosWithoutAuth.defaults.headers.common['authorization']
        const response = await axiosWithoutAuth.put(presignedUrl, file, {
            headers: {
                'Content-Type': contentType
            },
            onUploadProgress: (progressEvent) => {
                if (setProgress) {
                    const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
                    setProgress(percent)
                }
            }

        })
        return response
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            // Axios-specific error
            console.error('Axios error:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            })
        } else {
            // Non-Axios error
            console.error('Unknown error:', error)
        }
        throw error
    }
}

