import { createClient } from 'redis'
import * as Sentry from '@sentry/node'

let instance = null
let subscriber = null
let appSettings = {}
let redisApi = null

function Redis() {
    if (redisApi) {
        return redisApi
    }

    instance = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        socket: {
            reconnectStrategy: () => {
                // reconnect after every 20 minutes
                return 1200000
            }
        }
    })

    const getClient = () => instance

    instance.on('error', (error) => {
        Sentry.captureException(error)
        console.error(`Redis Client Error: ${error}`)
    })

    const connect = (callback) => {
        instance.connect()
            .then(() => {
                console.log('Redis client connected')
                if (callback) callback()
            })
            .catch(err => {
                console.log('Failed to connect to Redis Client :', err)
            })
    }

    const connectAsync = async () => {
        // const isRedisCacheEnabled = getAppSettings('is_redis_cache_enabled')
        // if (!isRedisCacheEnabled) return

        try {
            await instance.connect()
            console.log('Redis client connected')
        } catch (err) {
            console.log('Failed to connect to Redis Client :', err)
        }
    }

    const connectToSubscriber = (callback) => {
        subscriber = instance.duplicate()
        subscriber.connect()
            .then(() => {
                console.log('Connected to Redis subscriber')
                if (callback) callback()
            })
            .catch(err => {
                console.log('Failed to connect Redis subscriber :', err)
            })
    }

    const publishToChannel = (channel, data) => {
        if (instance.isReady) {
            instance.publish(channel, JSON.stringify(data))
        }
    }

    const disconnect = () => {
        if (instance.isReady) {
            console.log('Redis client disconnected manually')
            instance.disconnect()
        }
    }

    const logger = () => {
        instance.on('error', (error) => {
            Sentry.captureException(error)
            console.error(`Redis Client Error: ${error}`)
        })
    }

    const disconnectAsync = async () => {
        if (instance.isReady) {
            try {
                await instance.disconnect()
                console.log('Redis client disconnected manually')
            } catch (err) {
                console.log('Failed to disconnect Redis Client :', err)
            }
        }
    }

    const setAppSettings = (settings) => {
        appSettings = settings || {}
    }

    const getAppSettings = (key) => {
        return appSettings[key] || ''
    }

    const getSubscriber = () => subscriber

    redisApi = {
        connect,
        connectAsync,
        connectToSubscriber,
        publishToChannel,
        disconnect,
        disconnectAsync,
        setAppSettings,
        getAppSettings,
        getSubscriber,
        logger,
        getClient
    }

    return redisApi
}
const redis = new Redis()
export default redis
