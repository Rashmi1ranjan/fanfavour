const Website = require('../models/Website')
const crypto = require('crypto')
const _ = require('lodash')
const { safeSet, safeExists, safeDel } = require('./redis.util')
const Log = require('../logger/log')

// generate sso hash
const generateSSOHash = async (website_url, token) => {
    try {
        const website = await Website.findOne({ website_url }, { sso_secret: 1 })
        const sso_secret = _.get(website, 'sso_secret', '123456789')
        const hash = crypto.createHmac('sha256', sso_secret).update(token).digest('hex')
        return hash
    } catch (error) {
        Log.error('Error in generateSSOHash', { website_url, token, error }, 'ERR-SSO-010')
        return false
    }
}

// verify sso hash
const verifySSOHash = async (website_url, token, hash) => {
    try {
        const website = await Website.findOne({ website_url }, { sso_secret: 1 })
        const sso_secret = _.get(website, 'sso_secret', '123456789')
        const generatedHash = crypto.createHmac('sha256', sso_secret).update(token).digest('hex')
        return generatedHash === hash
    } catch (error) {
        Log.error('Error in verifySSOHash', { website_url, token, hash, error }, 'ERR-SSO-011')
        return false
    }
}

// generate new sso secret for all websites
const generateWebsiteSSOSecret = async () => {
    try {
        const websites = await Website.find({ status: { $in: ['published', 'live'] } }, { _id: 1, website_url: 1 })

        const redisKey = 'sso:secret:*'
        const cacheExists = await safeExists(redisKey)
        if (cacheExists) {
            await safeDel(redisKey)
        }

        for (const website of websites) {
            const hash = crypto.randomBytes(32).toString('hex')
            await Website.updateOne({ _id: website._id }, { $set: { sso_secret: hash } })
            await safeSet(`sso:secret:${website.website_url}`, hash)
        }
        // if (process.env.NODE_ENV === 'development') {
        //     await safeSet('sso:secret:localplatform.com', crypto.randomBytes(32).toString('hex'))
        //     await safeSet('sso:secret:localhost', crypto.randomBytes(32).toString('hex'))
        // }
        return true
    } catch (error) {
        Log.error('Error in generateWebsiteSSOSecret', error, 'ERR-SSO-012')
        return false
    }
}

const ssoGenerateTokenHash = (data, secret) => {
    // 1. Remove non-primitive values
    const filtered = {}
    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && typeof value !== 'object') {
            filtered[key] = value
        }
    }
    // 2. Sort keys alphabetically and serialize
    const serialized = Object.keys(filtered)
        .sort((a, b) => a.localeCompare(b))
        .map(key => `${key}=${filtered[key]}`)
        .join('&')

    // 3. HMAC-SHA512, hex digest, then Base64 encode
    const hmac = crypto.createHmac('sha512', secret)
        .update(serialized)
        .digest('hex')
    return Buffer.from(hmac).toString('base64').replace(/=+$/, '')
}

const setWebsiteSSOSecretToRedis = async () => {
    try {
        const websites = await Website.find({ status: { $in: ['published', 'live'] } }, { _id: 1, website_url: 1, sso_secret: 1 })

        const redisKey = 'sso:secret:*'
        const cacheExists = await safeExists(redisKey)
        if (cacheExists) {
            await safeDel(redisKey)
        }

        for (const website of websites) {
            await safeSet(`sso:secret:${website.website_url}`, website.sso_secret)
        }
        if (process.env.NODE_ENV === 'development') {
            await safeSet('sso:secret:localplatform.com', crypto.randomBytes(32).toString('hex'))
            await safeSet('sso:secret:localhost', crypto.randomBytes(32).toString('hex'))
        }
        return true
    } catch (error) {
        Log.error('Error in setWebsiteSSOSecretToRedis', error, 'ERR-SSO-013')
        return false
    }
}

module.exports = {
    generateSSOHash,
    verifySSOHash,
    generateWebsiteSSOSecret,
    ssoGenerateTokenHash,
    setWebsiteSSOSecretToRedis
}
