import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getSendGridWebhookList } from '../api/sendGridWebhooks'

interface sendGridWebhooksEvent {
    optInEmail: number,
    notification: number,
    forgotPassword: number,
    changeEmail: number,
    all: number
}

class sendGridWebhooks {

    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public sendGridWebhookData: Array<sendGridWebhooksEvent>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.sendGridWebhookData = []
    }

    @action.bound
    getSendGridWebhooks(filter: object) {
        this.isLoading = true
        getSendGridWebhookList(filter).then((response) => {
            const responseData = response.data
            this.sendGridWebhookData = responseData.eventCount
            this.isLoading = false
        })
    }
}

export default sendGridWebhooks
