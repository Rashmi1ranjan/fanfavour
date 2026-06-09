import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getAllWebsitesUsersList } from '../api/UserLookup'
import { getAllWebsites } from '../api/WebsiteStatusCheck'
import _ from 'lodash'

interface blockedUser {
    website_url: string
    domain: string
    email: string
    card_id: string
}

interface website {
    website_id: number
    website_url: string
    status: string,
    last_registered_user: string,
    last_transaction_time: string,
    version: string
}

class UserLookupStore {
    public rootStore: RootStore
    @observable public isLoading: boolean
    @observable public usersList: Array<blockedUser>
    @observable public websites: Array<website>
    @observable public isSetWebsites: boolean
    @observable public checkOtherField: boolean
    @observable public isCheckingOtherField: boolean
    @observable public otherFieldValue: Array<string>
    @observable public otherType: string
    @observable public checkedSiteNumber: number
    @observable public apiCallStartDateTime: Date
    @observable public apiCallEndDateTime: Date
    @observable public userListDomains: Array<string>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isLoading = false
        this.usersList = []
        this.websites = []
        this.isSetWebsites = false
        this.checkOtherField = false
        this.isCheckingOtherField = false
        this.otherType = ''
        this.otherFieldValue = []
        this.checkedSiteNumber = 0
        this.apiCallStartDateTime = new Date()
        this.apiCallEndDateTime = new Date()
        this.userListDomains = []
    }

    @action.bound
        getUserLookupData = async (data: { type: string, text: string, website_url?: string }) => {
            this.usersList = []
            this.checkedSiteNumber = 0
            this.userListDomains = []
            this.otherType = ''
            this.otherFieldValue = []
            this.apiCallStartDateTime = new Date()

            if (this.isSetWebsites === false) {
                const response = await getAllWebsites()
                if (response.data.success === 0) {
                    return
                }
                const responseData = response.data
                this.websites = responseData.data.websites
                this.isSetWebsites = true
            }
            this.isLoading = true
            this.getWebsitesUserList(data)
            return
        }

    getWebsitesUserList = async (data: { type: string, text: string | Array<string>, website_url?: string }) => {
        for (const website of this.websites) {
            data.website_url = website.website_url
            try {
                const response = await getAllWebsitesUsersList(data)
                if (response.data.success === 1) {
                    const blockedUsers = _.get(response, 'data.data.blockedUsers', [])
                    for (let index = 0; index < blockedUsers.length; index++) {
                        const user = blockedUsers[index]
                        if (data.type === 'email') {
                            this.otherType = 'card'
                            const cardId = _.get(user, 'card_id', [])
                            if (cardId.length > 0) {
                                this.otherFieldValue = _.union(this.otherFieldValue, cardId)
                            }
                        } else {
                            this.otherType = 'email'
                            const email = _.get(user, 'email', '')
                            if (email !== '' && !this.otherFieldValue.includes(email)) {
                                this.otherFieldValue.push(email)
                            }
                        }
                    }
                    if (blockedUsers.length > 0) {
                        if (!this.userListDomains.includes(blockedUsers[0].domain)) {
                            this.userListDomains.push(blockedUsers[0].domain)
                        }
                        this.usersList = this.usersList.concat(blockedUsers)
                    }
                }
            } catch (err) {
                console.log(err)
            }
            this.checkedSiteNumber++
        }
        if (this.otherFieldValue.length > 0) {
            this.checkedSiteNumber = 0
            data.type = this.otherType
            data.text = this.otherFieldValue
            this.isCheckingOtherField = true
            for (const website of this.websites) {
                data.website_url = website.website_url
                try {
                    const response = await getAllWebsitesUsersList(data)
                    if (response.data.success === 1) {
                        const blockedUsers = _.get(response, 'data.data.blockedUsers', [])
                        for (let index = 0; index < blockedUsers.length; index++) {
                            const user = blockedUsers[index]
                            const isDuplicate = this.checkRecordIsDuplicate(user)
                            if (!isDuplicate) {
                                if (!this.userListDomains.includes(user.domain)) {
                                    this.userListDomains.push(user.domain)
                                }
                                this.usersList.push(user)
                            }
                        }
                    }
                } catch (err) {
                    console.log(err)
                }
                this.checkedSiteNumber++
            }
        }
        this.apiCallEndDateTime = new Date()
        this.isCheckingOtherField = false
        this.isLoading = false
    }

    checkRecordIsDuplicate = (newUserDetail: blockedUser) => {
        for (let index = 0; index < this.usersList.length; index++) {
            const existUserDetail = this.usersList[index]
            if (existUserDetail.domain === newUserDetail.domain && existUserDetail.email === newUserDetail.email) {
                return true
            }
        }
        return false
    }
}

export default UserLookupStore
