import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { addServer, editServer, getServerList, getServerDataById, getServerLists, getServerOptions } from '../api/Server'
import _ from 'lodash'

interface server {
    _id: string
    name: string
    ip_address: string
    monthly_earning: number
}

interface serverOptions {
    _id: string
    name: string
    monthly_earning: number
}

class Server {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public serverData: Array<server>
    @observable public redirect: string
    @observable public editServerData: server
    @observable private isServerOptionDataLoaded: boolean
    @observable public allServerOptions: Array<serverOptions>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.serverData = []
        this.redirect = ''
        this.editServerData = {
            _id: '',
            name: '',
            ip_address: '',
            monthly_earning: 0.00
        }
        this.isServerOptionDataLoaded = false
        this.allServerOptions = []
    }

    @action.bound
    clearServerData() {
        this.editServerData = {
            _id: '',
            name: '',
            ip_address: '',
            monthly_earning: 0.00
        }
    }

    @action.bound
    getAllServerOptions() {
        if (this.isServerOptionDataLoaded === true) {
            return
        }
        this.isServerOptionDataLoaded = true
        getServerOptions().then((response) => {
            const responseData = response.data
            this.allServerOptions = responseData.rows
        })
    }

    @action.bound
    setServerData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editServerData, '_id', false)
        if (id === false || id === '') {
            addServer(this.editServerData).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                this.getServerData()
                alert('Data add successfully')
                this.redirect = '/servers'
                return
            })
        } else {
            editServer(this.editServerData).then((response) => {
                this.isLoading = false
                if (response.data.status === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                this.getServerData()
                alert('Data updated successfully')
                this.redirect = '/Servers'
                return
            })
        }
    }

    @action.bound
    getServerDataById(_id: string) {
        getServerDataById(_id).then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data.rows
            this.editServerData = responseData[0]
            return
        })
    }

    @action.bound
        getServerData = (): void => {
            getServerList().then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data
                this.serverData = responseData.rows
                this.isApiError = false
                this.apiErrorMessage = ''
                return
            })
        }

    @action.bound
    getServersData() {
        getServerLists().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.serverData = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default Server
