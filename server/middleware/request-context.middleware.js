import crypto from 'crypto'
import requestIp from 'request-ip'
import { contextStore } from '../utils/requestContext'

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

export default requestContextMiddleware
