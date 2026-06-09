const speakeasy = require('speakeasy')

/**
 * @description generate MFA token
 * @returns {string} secret token
 */
function generateSecret() {
    return speakeasy.generateSecret()
}


/**
 * @description verify MFA token
 * @param {string} secret base32 string
 * @param {string} token 6 digit token
 * @returns {boolean} verify status
 */
function verifyMfaToken(secret, token) {
    const option = {
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1
    }
    const verify = speakeasy.totp.verify(option)
    return verify
}

/**
 * @description creat auth opt url for qr-code
 * @param {string} secret base32 secret key
 * @param {string} name Qr-code name
 * @returns {string} optAuthUrl
 */
function generateOtpAuthUrl(secret, name) {
    const options = {
        secret: secret,
        encoding: 'base32',
        label: name,
        issuer: 'PCP Service'
    }
    return speakeasy.otpauthURL(options)
}

module.exports = {
    generateSecret,
    verifyMfaToken,
    generateOtpAuthUrl
}
