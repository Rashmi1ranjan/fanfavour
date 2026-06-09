import { observable, makeObservable } from 'mobx'
import RootStore from './Root'
import { getMfaSetting, enableMfaSetting, disableMfaSetting } from '../api/MfaSetting'

class MfaSettingStore {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public mfaSecret: string
    @observable public mfaQrCode: string
    @observable public mfaEnabled: boolean

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = true
        this.mfaSecret = ''
        this.mfaQrCode = ''
        this.mfaEnabled = false
    }

    mfaSetting = (): void => {
        getMfaSetting().then((response) => {
            if (response.status === 200) {
                this.mfaEnabled = response.data.is_mfa_enabled
                this.mfaSecret = response.data.mfa_secret
                this.mfaQrCode = response.data.mfa_qr_code
                this.isLoading = false
            } else {
                alert('Something went wrong')
                this.isLoading = false
            }
        })
    }

    enableMfa = (data: { token: string }): void => {
        enableMfaSetting(data).then((response) => {
            this.rootStore.authStore.setUserMfaStatus(response.data.is_mfa_enabled)
            this.mfaEnabled = response.data.is_mfa_enabled
            alert(response.data.message)
            return
        })
    }

    disableMfa = (data: { token: string }): void => {
        disableMfaSetting(data).then((response) => {
            this.rootStore.authStore.setUserMfaStatus(response.data.is_mfa_enabled)
            this.mfaEnabled = response.data.is_mfa_enabled
            alert(response.data.message)
            return
        })
    }
}

export default MfaSettingStore
