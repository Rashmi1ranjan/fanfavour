import { observable, action, makeObservable } from 'mobx'
import RootStore from './Root'
import { getInfluencerActivityData } from '../api/InfluencerActivity'
import { InfluencerActivityDetail } from '../types/types'

type IFConfigType = {
    key: string,
    direction: string
}
interface filterOptions {
    page_num?: number
    domain?: string
    sortBy?: IFConfigType
}

class InfluencerActivity {
    public rootStore: RootStore
    @observable public isLoading: boolean
    @observable public currentPage: number
    @observable public totalPages: number
    @observable public totalRows: number
    @observable public limit: number
    @observable public filter: filterOptions
    @observable public apiErrorMessage: string
    @observable public influencerActivity: Array<InfluencerActivityDetail>

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.isLoading = true
        this.currentPage = 1
        this.totalPages = 0
        this.limit = 0
        this.totalRows = 0
        this.influencerActivity = []
        this.filter = {
            page_num: 1,
            domain: '',
            sortBy: { key: 'modal_last_seen', direction: 'desc' }
        }
        this.apiErrorMessage = ''
    }

    @action.bound
    getInfluencerActivity(page_num: number) {
        this.filter.page_num = page_num
        getInfluencerActivityData(this.filter).then((res) => {
            const response = res.data.data
            this.currentPage = response.currentPage
            this.totalPages = response.totalPages
            this.limit = response.limit
            this.totalRows = response.totalRows
            this.influencerActivity = response.rows
            this.isLoading = false
        })
    }
}

export default InfluencerActivity
