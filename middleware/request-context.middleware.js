const crypto = require('crypto')
const requestIp = require('request-ip')
const { contextStore } = require('../utils/request-context')

const requestContextMiddleware = (req, res, next) => {
    const requestId = (req.headers['x-request-id'] || crypto.randomUUID())
    const ip = requestIp.getClientIp(req)
    const userAgent = req.headers['user-agent']

    const context = {
        requestId,
        ip: ip || '',
        method: req.method,
        url: req.originalUrl,
        userAgent
    }

    contextStore.run(context, () => {
        next()
    })
}

module.exports = requestContextMiddleware
