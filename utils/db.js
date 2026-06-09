const mysql = require('mysql2')

if (process.env.MYSQL_HOST_NAME && process.env.MYSQL_USER_NAME && process.env.MYSQL_PASSWORD) {
    const connection = mysql.createConnection({
        host: process.env.MYSQL_HOST_NAME,
        user: process.env.MYSQL_USER_NAME,
        password: process.env.MYSQL_PASSWORD,
        database: 'pcp'
    })
    module.exports = connection
} else {
    module.exports = null
}
