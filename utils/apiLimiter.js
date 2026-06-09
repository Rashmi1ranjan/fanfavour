const rateLimit = require('express-rate-limit')
const { errorResponse } = require('../utils')
const { HTTP_TOO_MANY_REQUESTS_429 } = require('../utils/http.status')

const apiLimiterForSSO = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hr window
    max: 15, // start blocking after 15 requests
    keyGenerator: (req) => {
        return req.body.ip_address
    },
    message: 'Too many attempts to add card from this IP, please try again after sometime',
    handler: function (req, res, next) {
        if (process.env.NODE_ENV !== 'production') {
            next()
            return
        }

        return errorResponse(res, { error: 'You sent too many requests. Please wait a while then try again' }, 'You sent too many requests. Please wait a while then try again', HTTP_TOO_MANY_REQUESTS_429)
    }
})

module.exports = {
    apiLimiterForSSO
}
