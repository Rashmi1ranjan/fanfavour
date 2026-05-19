import logger from './logger.js'
import { getContext } from '../utils/requestContext.js'

/**
 * Serialize error object
 *
 * @param {Error} err error object
 *
 * @returns {object} serialized error object
 */
function serializeError(err) {
    return {
        message: err.message,
        name: err.name,
        stack: err.stack,
        cause: (err).cause
    }
}

/**
 * Prepare data for logging
 *
 * @param {object} data data
 * @param {WeakSet} seen seen
 *
 * @returns {object} prepared data
 */
function prepareData(data, seen = new WeakSet()) {
    if (data instanceof Error) {
        return serializeError(data)
    }
    if (typeof data === 'object' && data !== null) {
        if (seen.has(data)) return '[Circular]'
        seen.add(data)

        if (Array.isArray(data)) {
            return data.map(item => prepareData(item, seen))
        }

        const newData = {}
        for (const [key, value] of Object.entries(data)) {
            newData[key] = prepareData(value, seen)
        }
        return newData
    }
    return data
}

/**
 * Log message
 *
 * @param {string} level log level
 * @param {string} message log message
 * @param {object} meta log meta
 */
function log(level, message, meta) {
    const context = getContext()
    const logData = {
        ...(meta?.code ? { code: meta.code } : {}),
        ...(meta?.data ? { data: prepareData(meta.data) } : {})
    }

    if (context) {
        Object.assign(logData, {
            requestId: context.requestId,
            ip: context.ip,
            method: context.method,
            url: context.url,
            userId: context.userId,
            userAgent: context.userAgent
        })
    }

    logger.log(level, message, logData)
}

/**
 * Log object
 *
 * @param {string} message log message
 * @param {object} data log data
 * @param {number} code log code
 */
const Log = {
    info: (message, data, code) => log('info', message, { data, code }),
    error: (message, data, code) => log('error', message, { data, code }),
    warning: (message, data, code) => log('warning', message, { data, code }),
    notice: (message, data, code) => log('notice', message, { data, code }),
    debug: (message, data, code) => log('debug', message, { data, code })
}

export default Log
