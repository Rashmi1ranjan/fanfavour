import { makeObservable, observable } from 'mobx'
import RootStore from './Root'

class NavStore {
    public rootStore: RootStore
    @observable public collapse = false

    constructor(rootStore: RootStore) {
        makeObservable(this)
        this.rootStore = rootStore
    }
}

export default NavStore
