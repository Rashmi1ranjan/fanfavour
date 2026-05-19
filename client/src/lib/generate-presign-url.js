import _ from 'lodash'
import { api } from "../action/base-url"

export async function getPresignedUrl(fileName, contentType, mediaType, email = '', domain = '', isUniversalChat = false) {
    try {
        let url = `/v1/upload/generate_presigned_url?domain=${domain}&isUniversalChat=${isUniversalChat}`
        let res = await api.post(url, { file_name: fileName, content_type: contentType, media_type: mediaType, email: email })
        const message = _.get(res, 'data.message', 'Successful')
        if (res.data.status === 200) {
            return res.data.data
        } else {
            return { presigned_url: '', message: message }
        }
    } catch (err) {
        console.log(err)
        const errorMessage = _.get(err, 'response.data.message', err.message)
        return { presigned_url: '', message: errorMessage }
    }
}
