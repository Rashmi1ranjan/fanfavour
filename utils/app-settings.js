const AppSettings = require('./../models/AppSettings')
var appSettings = null

function getAppSettings(key) {
    if (appSettings == null) {
        return ''
    }
    return appSettings[key]
}

function updateAppSettingsCache(callback) {
    AppSettings.find({ app: 'model' }).then(rows => {
        if (rows.length > 0) {
            appSettings = rows[0]
            callback()
        }
    })
}

module.exports = { getAppSettings, updateAppSettingsCache }