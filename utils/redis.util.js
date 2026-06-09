const Redis = require('ioredis')
// const { Log } = require('../logger/log')

const redisPort = process.env.REDIS_PORT || 6379
const redisHost = process.env.REDIS_HOST || '127.0.0.1'
const redisPassword = process.env.REDIS_PASSWORD || undefined
const redisDb = process.env.REDIS_DB || '0'

// Track Redis connection state
let isRedisConnected = false

const redis = new Redis({
    host: redisHost,
    port: Number(redisPort),
    password: redisPassword,
    connectTimeout: 5000, // 5 seconds
    maxRetriesPerRequest: null, // Disable automatic retries
    db: Number(redisDb),
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('[Redis] Max reconnection attempts reached, stopping retries')
            return null // Stop retrying
        }
        return Math.min(times * 1000, 3000) // Retry after 1s, 2s, 3s
    },
    lazyConnect: true // Don't connect immediately
})

redis.on('connect', () => {
    isRedisConnected = true
    console.info(`[Redis] Connected to ${redisHost}:${redisPort}`)
})

redis.on('ready', () => {
    isRedisConnected = true
    console.info('[Redis] Connection ready')
})

redis.on('error', (err) => {
    isRedisConnected = false
    console.error('[Redis] Error:', err.message, 'EXT-5011')
})

redis.on('close', () => {
    isRedisConnected = false
    console.warn('[Redis] Connection closed')
})

redis.on('reconnecting', () => {
    console.info('[Redis] Attempting to reconnect...')
})

// Attempt initial connection (non-blocking)
redis.connect().catch((err) => {
    isRedisConnected = false
    console.error('[Redis] Initial connection failed:', err.message, 'EXT-5012')
})

const disconnectRedis = async () => {
    if (!redis) return

    try {
        isRedisConnected = false
        await redis.quit()
    } catch (err) {
        console.warn('[Redis] Quit failed, forcing disconnect:', err.message)
        try {
            await redis.disconnect()
        } catch (disconnectErr) {
            console.error('[Redis] Disconnect failed:', disconnectErr.message, 'EXT-5018')
        }
    }
}

// Check if Redis is currently connected and available
const isConnected = () => isRedisConnected

// Safe GET - returns null on failure instead of throwing
const safeHGet = async (key) => {
    if (!isRedisConnected) return null
    try {
        return await redis.hgetall(key)
    } catch (err) {
        console.error('[Redis] safeHGet error:', err, 'EXT-5013')
        return null
    }
}

const safeGet = async (key) => {
    if (!isRedisConnected) return null
    try {
        return await redis.get(key)
    } catch (err) {
        console.error('[Redis] safeGet error:', err, 'EXT-5013')
        return null
    }
}

// Safe SET - silently fails on error
const safeHset = async (
    key,
    value,
    duration
) => {
    if (!isRedisConnected) return false
    try {
        await redis.hset(key, value)
        if (duration) {
            await redis.expire(key, duration)
        }
        return true
    } catch (err) {
        console.error('[Redis] safeHset error:', err, 'EXT-5014')
        return false
    }
}

const safeSet = async (
    key,
    value,
    duration
) => {
    if (!isRedisConnected) return false
    try {
        await redis.set(key, value)
        if (duration) {
            await redis.expire(key, duration)
        }
        return true
    } catch (err) {
        console.error('[Redis] safeSet error:', err, 'EXT-5014')
        return false
    }
}

// Safe DEL - silently fails on error
const safeDel = async (...keys) => {
    if (!isRedisConnected || keys.length === 0) return 0
    try {
        return await redis.del(...keys)
    } catch (err) {
        console.error('[Redis] safeDel error:', err, 'EXT-5015')
        return 0
    }
}

// Safe EXISTS - returns 0 on failure
const safeExists = async (key) => {
    if (!isRedisConnected) return 0
    try {
        return await redis.exists(key)
    } catch (err) {
        console.error('[Redis] safeExists error:', err, 'EXT-5016')
        return 0
    }
}

const safeAdd = async (key, value) => {
    if (!isRedisConnected) return 0
    try {
        return await redis.sadd(key, value)
    } catch (err) {
        console.error('[Redis] safeAdd error:', err, 'EXT-5017')
        return 0
    }
}

// Safe DEL - silently fails on error
const safeDelMembers = async (key) => {
    if (!isRedisConnected) return 0
    try {
        // get all session keys
        const sessionKeys = await redis.smembers(key)

        if (!sessionKeys.length) return

        // delete all sessions
        await redis.del(sessionKeys)
        await redis.del(key)
        return 1
    } catch (err) {
        console.error('[Redis] safeDel error:', err, 'EXT-5015')
        return 0
    }
}

// Export raw client for cases where direct access is needed (e.g., in tests)
module.exports = {
    redis,
    isConnected,
    safeGet,
    safeHGet,
    safeHset,
    safeSet,
    safeDel,
    safeExists,
    safeAdd,
    safeDelMembers,
    disconnectRedis
}
