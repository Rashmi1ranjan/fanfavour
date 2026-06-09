import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getUniversalLoginUsersList, getUniversalLoginCards, getAllWebsiteUsersList, addNewNote, getUserNote, getEventStatistics } from '../api/UniversalLogin'
import _ from 'lodash'
import { toast } from 'react-toastify'
import moment from 'moment'
import { AxiosError } from 'axios'

interface filterOption {
    email: string,
    domain: Array<string>,
    page: number
}

interface cardDetailsFilter {
    email: string,
    page: number,
    card_id: string,
    subscription_id: string,
    sticky_io_order_id: string,
    payment_gateway: string,
    card_last_four_digits: string,
    domain: Array<string>,
    card_holder_name: string
}

interface UniversalUserDetail {
    _id: string,
    email: string,
    name: string,
    default_payment_method: string,
    universal_login_merged_domains: string[],
    createdAt: string
}

interface AllWebsiteUserDetail {
    _id: string,
    email: string,
    domain: string,
    default_payment_method: string,
    createdAt: string
}

interface UniversalLoginCardDetails {
    user_id: string,
    email: string,
    domain: string,
    card_id: string,
    is_primary: boolean,
    is_deleted: boolean,
    card_holder_name: string
}

interface noteDataInterface {
    userId: string,
    noteText: string
}

interface noteArray {
    id: string,
    note: string,
    created_at: Date
}
interface statisticsFilterOption {
    domain: Array<string>,
    start_date: string
    end_date: string
}

interface UniversalUsers {
    singleSiteUsers: number,
    multipleSiteUsers: number
}

class UniversalLoginStore {
    public rootStore: RootStore
    @observable public isApiError: boolean
    @observable public filter: filterOption
    @observable public currentPage: number
    @observable public totalPage: number
    @observable public totalRows: number
    @observable public limit: number
    @observable public universalUserDetails: UniversalUserDetail[]
    @observable public UniversalLoginCardDetails: UniversalLoginCardDetails[]
    @observable public isLoading: boolean
    @observable public isUniversalUserDetailsLoading: boolean
    @observable public cardDetailsFilter: cardDetailsFilter
    @observable public allWebsiteUserfilter: filterOption
    @observable public allWebsiteUserDetails: AllWebsiteUserDetail[]
    @observable public isAllWebsiteUserDetailsLoading: boolean
    @observable public isAllWebsiteUserDetailsApiError: boolean
    @observable public addNoteLoading: boolean
    @observable public fetchNoteLoader: boolean
    @observable public noteData: noteDataInterface
    @observable public notes: noteArray[]
    @observable public universalUserApiError: boolean
    @observable public statisticsFilter: statisticsFilterOption
    @observable public statisticsData: Array<Array<string | number>>
    @observable public universalUsers: UniversalUsers

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isApiError = false
        this.currentPage = 1
        this.totalPage = 0
        this.totalRows = 0
        this.limit = 0
        this.filter = {
            email: '',
            domain: [],
            page: 1
        }

        this.cardDetailsFilter = {
            email: '',
            page: 1,
            card_id: '',
            subscription_id: '',
            sticky_io_order_id: '',
            payment_gateway: '',
            card_last_four_digits: '',
            domain: [],
            card_holder_name: ''
        }
        this.universalUserDetails = [{
            _id: '',
            email: '',
            name: '',
            default_payment_method: '',
            universal_login_merged_domains: [''],
            createdAt: ''
        }]
        this.UniversalLoginCardDetails = []
        this.isLoading = true
        this.isUniversalUserDetailsLoading = false
        this.allWebsiteUserfilter = {
            email: '',
            domain: [],
            page: 1
        }
        this.isAllWebsiteUserDetailsLoading = false
        this.isAllWebsiteUserDetailsApiError = false
        this.allWebsiteUserDetails = [{
            _id: '',
            email: '',
            domain: '',
            default_payment_method: '',
            createdAt: ''
        }]
        this.noteData = {
            userId: '',
            noteText: ''
        }
        this.addNoteLoading = false
        this.notes = []
        this.fetchNoteLoader = false
        this.universalUserApiError = false
        this.statisticsFilter = {
            domain: [],
            start_date: moment().subtract(6, 'days').format('MM/DD/YYYY'),
            end_date: moment().format('MM/DD/YYYY')
        }
        this.statisticsData = [['x']]
        this.universalUsers = { singleSiteUsers: 0, multipleSiteUsers: 0 }
    }

    @action.bound
    getUniversalUserDetails(page: number) {
        this.filter.page = page
        this.isUniversalUserDetailsLoading = true
        getUniversalLoginUsersList(this.filter).then((res) => {
            const responseData = res.data.data
            this.universalUserApiError = false
            this.universalUserDetails = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isUniversalUserDetailsLoading = false
        }).catch((error: AxiosError) => {
            const errorMessage = _.get(error, 'response.data.message', 'Error while fetch universal login user list')
            alert(errorMessage)
            this.universalUserApiError = true
            this.isUniversalUserDetailsLoading = false
        })
    }

    @action.bound
    getAllWebsiteUserDetails(page: number) {
        this.allWebsiteUserfilter.page = page
        this.isAllWebsiteUserDetailsLoading = true
        getAllWebsiteUsersList(this.allWebsiteUserfilter).then((res) => {
            const responseData = res.data.data
            this.allWebsiteUserDetails = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPages
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isAllWebsiteUserDetailsLoading = false
        }).catch((error: AxiosError) => {
            const errorMessage = _.get(error, 'response.data.message', 'Error while fetch all website user')
            alert(errorMessage)
            this.isAllWebsiteUserDetailsApiError = true
            this.isAllWebsiteUserDetailsLoading = false
        })
    }

    @action.bound
    getUniversalCardDetails(page: number) {
        this.cardDetailsFilter.page = page
        this.isLoading = true
        getUniversalLoginCards(this.cardDetailsFilter).then((res) => {
            const responseData = res.data.data
            this.UniversalLoginCardDetails = responseData.rows
            this.currentPage = responseData.currentPage
            this.totalPage = responseData.totalPage
            this.limit = responseData.limit
            this.totalRows = responseData.totalRows
            this.isLoading = false
        }).catch((error: AxiosError) => {
            const errorMessage = _.get(error, 'response.data.message', 'Error while fetch user card')
            alert(errorMessage)
            this.isApiError = true
            this.isLoading = false
        })
    }

    @action.bound
    getNote(userId: string) {
        this.fetchNoteLoader = true
        getUserNote(userId).then((res) => {
            this.notes = res.data.data.notes
            this.fetchNoteLoader = false
            return
        }).catch((error: object) => {
            const errorMessage = _.get(error, 'response.data.message', 'Error while add new note')
            alert(errorMessage)
            this.fetchNoteLoader = false
            this.isApiError = true
        })
    }

    @action.bound
    addNewNote() {
        this.addNoteLoading = true
        addNewNote(this.noteData).then((res) => {
            this.notes = res.data.data.notes
            this.addNoteLoading = false
            toast.success('Note added successfully')
            this.noteData.noteText = ''
            return
        }).catch((error: object) => {
            const errorMessage = _.get(error, 'response.data.message', 'Error while add new note')
            toast.error(errorMessage)
            this.addNoteLoading = false
            this.isApiError = true
        })
    }
    @action.bound
    getStatistics() {
        this.isLoading = true
        getEventStatistics(this.statisticsFilter).then((res) => {
            this.statisticsData = res.data.data.statisticsData
            const { singleSiteUsers, multipleSiteUsers } = res.data.data.universalUsersCounts
            this.universalUsers = { singleSiteUsers, multipleSiteUsers }
            this.isLoading = false
        }).catch((error: object) => {
            // const errorMessage = _.get(error, 'response.data.message', 'Error while add new note')
            console.log(error)
            this.isLoading = false
        })
    }
}

export default UniversalLoginStore
