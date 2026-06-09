import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getAwsSettings, saveAwsSettings } from '../api/AwsSettings'

interface awsSettings {
    aws_secret_key_id: string
    aws_secret_access_key: string
    aws_region: string
    aws_s3_bucket: string
    aws_url: string
    is_cloud_front_enable: boolean
    cloud_front_url: string
}

class AwsSettings {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public editAwsSettingsData: awsSettings

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.editAwsSettingsData = {
            aws_secret_key_id: '',
            aws_secret_access_key: '',
            aws_region: '',
            aws_s3_bucket: '',
            aws_url: '',
            is_cloud_front_enable: false,
            cloud_front_url: ''
        }
    }

    @action.bound
    setAwsSettingsData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true

        saveAwsSettings(this.editAwsSettingsData).then((response) => {
            if (response.data.status === false) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                alert(this.apiErrorMessage)
                this.isLoading = false
                return
            }
            alert('Data saved successfully')
            this.isLoading = false
            return
        })
    }

    @action.bound
        getAwsSettingsData = (): void => {
            getAwsSettings().then((response) => {
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    this.isLoading = false
                    return
                }
                const responseData = response.data.data.rows
                if (responseData.length === 1) {
                    this.editAwsSettingsData = responseData[0]
                }
                this.isLoading = false
                return
            })
        }
}

export default AwsSettings
