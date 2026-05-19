import { createAccessToken, createTempToken } from "../helper/sso.js"
import _ from 'lodash'
import redis from '../redis/config/redis.js'
import crypto from 'crypto'

export const generateSSOAccessToken = async (domain, email, ip) => {
    try {
        const domainSecret = await redis.getClient().get(`sso:secret:${domain}`)
        const tempTokenData = {
            email: email,
            source_domain: domain,
            ip_address: ip
        }

        const requestTempTokenHash = ssoGenerateTokenHash(tempTokenData, domainSecret)
        const requestTempTokenData = { ...tempTokenData, hash: requestTempTokenHash }

        const generateTempToken = await createTempToken(requestTempTokenData)
        if (_.get(generateTempToken, 'success', 0) === 0) {
            console.log(generateTempToken, 'generateTempToken')
            return false
        }

        const FFTempToken = _.get(generateTempToken, 'data.temp_token', '')
        const accessTokenData = {
            email: email,
            ip_address: ip,
            token: FFTempToken,
            source_domain: domain,
            create_temp_token: false
        }

        const requestAccessTokenHash = ssoGenerateTokenHash(accessTokenData, domainSecret)
        const requestAccessTokenData = { ...accessTokenData, hash: requestAccessTokenHash }

        const generateAccessToken = await createAccessToken(requestAccessTokenData)
        if (_.get(generateAccessToken, 'success', 0) === 0) {
            console.log(generateAccessToken, 'generateAccessToken')
            return false
        }

        const FFAccessToken = _.get(generateAccessToken, 'data.access_token', '')
        return FFAccessToken
    } catch (error) {
        console.log(error)
        return false
    }
}

export const ssoGenerateTokenHash = (data, secret) => {
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