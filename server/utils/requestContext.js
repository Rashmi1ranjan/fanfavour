import { AsyncLocalStorage } from 'async_hooks'

const contextStore = new AsyncLocalStorage()

const getContext = () => {
    return contextStore.getStore()
}

export { getContext, contextStore }
