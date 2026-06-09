const moment = require('moment')

/**
 *
 * @param {string} date date
 * @param {string} dateFormat dateFormat
 * @returns {boolean} true if date matches with dateFormat else false
 */
const isDateFormatInvalid = (date, dateFormat) => !moment(date, dateFormat, true).isValid()

module.exports = {
    isDateFormatInvalid
}
