import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { addDatabase, editDatabase, getDatabaseList, getDatabaseDataById, getDatabaseLists, getDatabaseOptions } from '../api/Database'
import _ from 'lodash'

interface database {
    _id: string
    name: string
    monthly_earning: number
}

interface databaseOptions {
    _id: string
    name: string
    monthly_earning: number
}

class Database {
    public rootStore: RootStore
    @observable public apiErrorMessage: string
    @observable public isApiError: boolean
    @observable public isLoading: boolean
    @observable public databaseData: Array<database>
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public limit: number
    @observable public totalRows: number
    @observable public redirect: string
    @observable public editDatabaseData: database
    @observable private isDatabaseOptionDataLoaded: boolean
    @observable public allDatabaseOptions: Array<databaseOptions>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.apiErrorMessage = ''
        this.isApiError = false
        this.isLoading = false
        this.databaseData = []
        this.currentPage = 1
        this.totalPage = 0
        this.limit = 0
        this.totalRows = 0
        this.redirect = ''
        this.editDatabaseData = {
            _id: '',
            name: '',
            monthly_earning: 0.00
        }
        this.isDatabaseOptionDataLoaded = false
        this.allDatabaseOptions = []
    }

    @action.bound
    clearWebsiteData() {
        this.editDatabaseData = {
            _id: '',
            name: '',
            monthly_earning: 0.00
        }
    }

    @action.bound
    getAllDatabaseOptions() {
        if (this.isDatabaseOptionDataLoaded === true) {
            return
        }
        this.isDatabaseOptionDataLoaded = true
        getDatabaseOptions().then((response) => {
            const responseData = response.data
            this.allDatabaseOptions = responseData.rows
        })
    }

    @action.bound
    setDatabaseData() {
        this.isApiError = false
        this.apiErrorMessage = ''
        this.isLoading = true
        const id = _.get(this.editDatabaseData, '_id', false)
        if (id === false || id === '') {
            addDatabase(this.editDatabaseData).then((response) => {
                this.isLoading = false
                if (response.data.status === false) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                this.getDatabaseData(this.currentPage)
                alert('Data add successfully')
                this.redirect = '/servers'
                return
            })
        } else {
            editDatabase(this.editDatabaseData).then((response) => {
                this.isLoading = false
                if (response.data.status === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    alert(this.apiErrorMessage)
                    return
                }
                this.getDatabaseData(this.currentPage)
                alert('Data updated successfully')
                this.redirect = '/Servers'
                return
            })
        }
    }

    @action.bound
        getDatabaseDataById = (_id: string): void => {
            getDatabaseDataById(_id).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data.rows
                this.editDatabaseData = responseData[0]
                return
            })
        }

    @action.bound
        getDatabaseData = (currentPage: number): void => {
            getDatabaseList(currentPage).then((response) => {
                this.isLoading = false
                if (response.data.success === 0) {
                    this.isApiError = true
                    this.apiErrorMessage = response.data.message
                    return
                }
                const responseData = response.data
                this.databaseData = responseData.rows
                this.currentPage = responseData.currentPage
                this.totalPage = responseData.totalPages
                this.limit = responseData.limit
                this.totalRows = responseData.totalRows
                this.isApiError = false
                this.apiErrorMessage = ''
                return
            })
        }

    @action.bound
    getDatabasesData() {
        getDatabaseLists().then((response) => {
            this.isLoading = false
            if (response.data.success === 0) {
                this.isApiError = true
                this.apiErrorMessage = response.data.message
                return
            }
            const responseData = response.data
            this.databaseData = responseData.rows
            this.isApiError = false
            this.apiErrorMessage = ''
            return
        })
    }
}

export default Database
