const { AsyncLocalStorage } = require('async_hooks')

const contextStore = new AsyncLocalStorage()

const getContext = () => {
    return contextStore.getStore()
}

module.exports = {
    getContext,
    contextStore
}
