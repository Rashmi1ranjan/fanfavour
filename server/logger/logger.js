import winston from 'winston'
import { logLevels, logColors } from './levels.js'
import DailyRotateFile from 'winston-daily-rotate-file'

winston.addColors(logColors)

const stringifyNestedData = winston.format((info) => {
    if (info.data !== undefined) {
        info.data = typeof info.data === 'string' ? info.data : JSON.stringify(info.data)
    }
    return info
})()

const consoleFormat = winston.format.combine(
    stringifyNestedData,
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, code, data }) => {
        return `${timestamp} ${level}: ${message}` +
            (code ? ` [${code}]` : '') +
            (data ? ` ${data}` : '')
    })
)

const fileFormat = winston.format.combine(
    stringifyNestedData,
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
)

const fileTransport = new DailyRotateFile({
    dirname: 'logs',
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '1d',
    level: process.env.LOG_LEVEL || 'debug',
    format: fileFormat,
    maxSize: '20m'
})

const transports = [
    fileTransport
]

// Update this condition based on your project's local NODE_ENV value
if (process.env.NODE_ENV === 'local') {
    transports.push(new winston.transports.Console({ format: consoleFormat }))
}

const logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'debug',
    transports,
    exitOnError: false
})

export default logger
