import { makeObservable, observable } from 'mobx'
import RootStore from './Root'

class SideMenuStore {
    public rootStore: RootStore
    @observable public searchFilter: string
    @observable public scrollPosition: number

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
        this.searchFilter = ''
        this.scrollPosition = 0
    }
}

export default SideMenuStore
