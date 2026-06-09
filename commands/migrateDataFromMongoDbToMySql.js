const Website = require('./../models/Website')
const moment = require('moment')
const _ = require('lodash')
const axios = require('axios')
const mysql = require('mysql2/promise')
const db_name = 'pcp_analytics'
const transaction_table = 'transaction_logs_v2'
const content_table = 'content_logs_v2'
const user_subscription_transaction_count_table = 'user_registration_subscription_data_v2'
const db_host = process.env.MYSQL_HOST_NAME
const db_user = process.env.MYSQL_USER_NAME
const db_password = process.env.MYSQL_PASSWORD
let db_mysql_connection
let processed_records = 0

/**
 * to connect with my sql database
 *
 * @returns {any} conn
 */
async function connectToMySql() {
    db_mysql_connection = await mysql.createConnection({
        host: db_host,
        user: db_user,
        password: db_password,
        database: db_name
    })
    return db_mysql_connection
}

/**
 * @description create transaction log table
 * @returns {boolean} true/false
 */
async function createTransactionLogTableInMySql() {
    try {
        await db_mysql_connection.query(`DROP TABLE IF EXISTS ${transaction_table}`)
        const sql = `
            CREATE TABLE ${transaction_table} (
                id int NOT NULL AUTO_INCREMENT,
                payment_gateway VARCHAR(255),
                payment_gateway_type VARCHAR(255),
                user_id VARCHAR(255),
                transaction_type VARCHAR(255),
                amount VARCHAR(255),
                ip_address VARCHAR(255),
                transaction_date DATETIME,
                is_refunded BOOLEAN,
                is_voided BOOLEAN,
                is_chargeback BOOLEAN,
                void_date VARCHAR(255),
                chargeback_date VARCHAR(255),
                refund_date VARCHAR(255),
                domain VARCHAR(255),
                country VARCHAR(255),
                content_type VARCHAR(255),
                content_from VARCHAR(255),
                content_create_date DATETIME,
                content_id VARCHAR(255),
                user_registration_date DATETIME,
                content_visibility VARCHAR(255),
                is_content_ever_purchased BOOLEAN,
                transaction_id varchar(255),
                PRIMARY KEY (id)
            )
        `
        await db_mysql_connection.query(sql)
        console.log(`${transaction_table} Table created`)
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * @description create transaction log table
 * @returns {boolean} true/false
 */
async function createContentLogTableInMySQL() {
    try {
        await db_mysql_connection.query(`DROP TABLE IF EXISTS ${content_table}`)
        const sql = `
            CREATE TABLE ${content_table} (
                id int NOT NULL AUTO_INCREMENT,
                domain VARCHAR(255),
                content_id VARCHAR(255),
                content_from VARCHAR(255),
                is_content_paid BOOLEAN,
                content_price VARCHAR(255),
                content_create_date DATETIME,
                content_type VARCHAR(255),
                content_visibility VARCHAR(255),
                PRIMARY KEY (id)
            )
        `
        await db_mysql_connection.query(sql)
        console.log(`${content_table} Table created`)
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * @description create transaction log table
 * @returns {boolean} true/false
 */
async function createMySQLTables() {
    try {
        await connectToMySql()

        await createTransactionLogTableInMySql()
        await createContentLogTableInMySQL()
    } catch (error) {
        console.log('Error in create mysql tables')
        console.log(error.message)
        return
    }
}


/**
 * delete record by date
 *
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @param {string} domain domain
 * @param {boolean} only_free_transaction Remove only free transactions
 */
async function deleteTransactionRecordByDateWithDomain(startDate, endDate, domain, only_free_transaction = true) {
    try {
        let sql = `DELETE FROM ${transaction_table}`
        let has_condition = false
        if ((startDate !== '' && startDate !== null) && (endDate !== '' && endDate !== null)) {
            has_condition = true
            sql = `${sql} WHERE transaction_date >= '${startDate} 00:00:00' AND transaction_date <= '${endDate} 23:59:59'`
        }
        if (domain !== 'all') {
            sql = has_condition === true ? `${sql} AND domain = '${domain}'` : `${sql} WHERE domain = '${domain}'`
            has_condition = true
        }
        if (only_free_transaction === true) {
            sql = has_condition === true ? `${sql} AND user_id = 'free'` : `${sql} WHERE user_id = 'free'`
        } else {
            sql = has_condition === true ? `${sql} AND (user_id != 'free' OR user_id IS NULL)` : `${sql} WHERE (user_id != 'free' OR user_id IS NULL)`
        }

        const [rows] = await db_mysql_connection.query(sql)
        // console.log('delete query count ', rows.affectedRows)
        console.log('Records deleted Successfully')
        return
    } catch (error) {
        console.log(error)
        console.log('==== Error in delete record by date with domain ====')
    }
}

/**
 *
 * @param {string} domain domain
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 */
async function generateContentLogForDataScientist(domain, startDate, endDate) {
    await connectToMySql()
    await websiteLoop(domain, startDate, endDate)
    return
}

/**
 * website loop
 *
 * @param {string} domain domain
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @returns {boolean} true false
 */
async function websiteLoop(domain, startDate, endDate) {
    try {
        const query = {}
        if (domain != 'all') {
            query.website_url = domain
        }
        const start_date = startDate === null ? '' : moment(startDate).format('YYYY-MM-DD 00:00:00')
        const end_date = endDate === null ? '' : moment(endDate).format('YYYY-MM-DD 23:59:59')
        const content_types = ['blog', 'mass_message', 'private_message']

        if (process.env.NODE_ENV === 'development') {
            const localDomain = 'localhost:8000'
            await deleteContentRecordByDateWithDomain(startDate, endDate, localDomain)

            for (const content_type of content_types) {
                console.log(`=== Get ${content_type} start ===`)
                processed_records = 0
                await getDataFromWeb(localDomain, start_date, end_date, 1, content_type)
                console.log(`=== Get ${content_type} End ===`)
            }
            console.log(`==== Complete: Transaction get from website: ${localDomain} ====`)
        } else {
            const totalWebsites = await Website.countDocuments(query)
            if (totalWebsites > 0) {
                const limit = 50
                const totalPages = Math.ceil(totalWebsites / limit)
                for (let index = 0; index < totalPages; index++) {
                    const offset = index * limit
                    const websites = await Website.find(query, 'website_url website_id').sort({ website_id: -1 }).skip(offset).limit(limit)

                    for (const website of websites) {
                        console.log(`==== Started: Transaction get from website: ${website.website_url}(${website.website_id}) ====`)
                        await deleteContentRecordByDateWithDomain(startDate, endDate, website.website_url)
                        for (const content_type of content_types) {
                            console.time(`getWebsiteTransactions_${content_type}`)
                            console.log(`=== Get ${content_type} start ===`)
                            processed_records = 0
                            await getDataFromWeb(website.website_url, start_date, end_date, 1, content_type)
                            console.log(`=== Get ${content_type} End ===`)
                            console.timeEnd(`getWebsiteTransactions_${content_type}`)
                        }
                        console.log(`==== Complete: Transaction get from website: ${website.website_url}(${website.website_id}) ====`)
                    }
                }
            }
        }
        return true
    } catch (error) {
        console.log('------------------------')
        console.log('Error in ', domain)
        console.log('Error ', error)
        console.log('------------------------')
        return false
    }
}

/**
 * get data from website recursively.
 *
 * @param {string} domain domain
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @param {number} pageNum pageNum
 * @param {string} type Type for transactions
 * @returns {boolean} true false
 */
async function getDataFromWeb(domain, startDate, endDate, pageNum, type = 'blog') {
    const host = process.env.NODE_ENV === 'development' ? `http://${domain}` : `https://api.${domain}`

    let apiUrl = ''
    switch (type) {
        case 'blog':
            apiUrl = `${host}/api/get-blog-content`
            break
        case 'mass_message':
            apiUrl = `${host}/api/get-mass-message`
            break
        case 'private_message':
            apiUrl = `${host}/api/get-private-message`
            break
        default:
            apiUrl = ''
            break
    }
    if (apiUrl === '') {
        return false
    }
    const requestBody = {
        token: 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl',
        startDate: startDate,
        endDate: endDate,
        pageNum: pageNum,
        domain: domain
    }

    try {
        const body = await axios.post(apiUrl, requestBody)
        if (body.status === 200) {
            if (body.data.data.resultArray.length > 0) {
                await saveContentLogData(body.data.data.resultArray)
                processed_records = processed_records + body.data.data.resultArray.length
                // const totalRecords = body.data.data.totalRecords
                // console.log(`Inserted Records: ${processed_records}/${totalRecords}`)
                const isMoreData = _.get(body, 'data.data.isMoreData', false)
                if (isMoreData) {
                    await getDataFromWeb(domain, startDate, endDate, pageNum + 1, type)
                }
            }
            return true
        } else {
            console.log(`error in ${apiUrl}`)
            return false
        }
    } catch (error) {
        console.log(`error in ${apiUrl}`, error)
        return false
    }

}

/**
 * @description Add transaction logs in database
 * @param {Array} array array
 * @returns {boolean} true/false
 */
async function addTransactionLogs(array) {
    try {
        const insertionFields = 'payment_gateway,payment_gateway_type,user_id,transaction_type,amount,ip_address,transaction_date,is_refunded,is_voided,is_chargeback,refund_date,chargeback_date,void_date,domain,country,content_type,content_from,content_create_date,content_id,user_registration_date,content_visibility,is_content_ever_purchased,transaction_id'
        const statement = `INSERT INTO ${transaction_table} (${insertionFields})  VALUES ?  `

        await db_mysql_connection.query(statement, [array])
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * @description Add transaction logs in database
 * @param {Array} array array
 * @returns {boolean} true/false
 */
async function saveContentLogData(array) {
    try {
        const insertionFields = 'domain,content_id,content_from,is_content_paid,content_price,content_create_date,content_type,content_visibility'
        const statement = `INSERT INTO ${content_table} (${insertionFields})  VALUES ?  `

        await db_mysql_connection.query(statement, [array])
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * @description create transaction log table
 * @returns {boolean} true/false
 */
async function alterTableToAddTransactionIdColumn() {
    try {
        const connection = await connectToMySql()

        const sql = `ALTER TABLE ${transaction_table} ADD transaction_id varchar(255)`
        await connection.query(sql)
        console.log('Column successfully added for transaction_id')
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * delete Content log by date and domain
 *
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @param {string} domain domain
 */
async function deleteContentRecordByDateWithDomain(startDate, endDate, domain) {
    try {
        let sql = `DELETE FROM ${content_table}`
        let has_condition = false
        if ((startDate !== '' && startDate !== null) && (endDate !== '' && endDate !== null)) {
            sql = `${sql} WHERE content_create_date >= '${startDate} 00:00:00' AND content_create_date <= '${endDate} 23:59:59'`
            has_condition = true
        }
        if (domain !== 'all') {
            sql = has_condition === true ? `${sql} AND domain = '${domain}'` : `${sql} WHERE domain = '${domain}'`
            has_condition = true
        }

        const [rows] = await db_mysql_connection.query(sql)
        // console.log('delete query count ', rows.affectedRows)
        console.log('Records deleted Successfully')
        return
    } catch (error) {
        console.log(error)
        console.log('==== Error in delete record by date with domain ====')
    }
}

/**
 * delete Content log by date and domain
 *
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @param {string} domain domain
 */
async function deletePrivateMessageContentRecordByDateWithDomain(startDate, endDate, domain) {
    try {
        let sql = `DELETE FROM ${content_table}`
        let has_condition = false
        if ((startDate !== '' && startDate !== null) && (endDate !== '' && endDate !== null)) {
            sql = `${sql} WHERE content_create_date >= '${startDate} 00:00:00' AND content_create_date <= '${endDate} 23:59:59'`
            has_condition = true
        }
        if (domain !== 'all') {
            sql = has_condition === true ? `${sql} AND domain = '${domain}'` : `${sql} WHERE domain = '${domain}'`
            has_condition = true
        }

        sql = has_condition === true ? `${sql} AND content_from = 'private_message'` : `${sql} WHERE content_from = 'private_message'`

        const [rows] = await db_mysql_connection.query(sql)
        // console.log('delete query count ', rows.affectedRows)
        console.log('Records deleted Successfully')
        return
    } catch (error) {
        console.log(error)
        console.log('==== Error in delete record by date with domain ====')
    }
}

/**
 * website loop
 *
 * @param {string} domain domain
 * @param {string} startDate startDate
 * @param {string} endDate endDate
 * @returns {boolean} true false
 */
async function getPrivateMessagesLog(domain, startDate, endDate) {
    try {
        const query = {}
        if (domain != 'all') {
            query.website_url = domain
        }
        const start_date = startDate === null ? '' : moment(startDate).format('YYYY-MM-DD 00:00:00')
        const end_date = endDate === null ? '' : moment(endDate).format('YYYY-MM-DD 23:59:59')

        if (process.env.NODE_ENV === 'development') {
            const localDomain = 'localhost:8000'
            await deletePrivateMessageContentRecordByDateWithDomain(startDate, endDate, localDomain)

            console.log('=== Get private_message start ===')
            processed_records = 0
            await getDataFromWeb(localDomain, start_date, end_date, 1, 'private_message')
            console.log('=== Get private_message End ===')
            console.log(`==== Complete: Transaction get from website: ${localDomain} ====`)
        } else {
            const totalWebsites = await Website.countDocuments(query)
            if (totalWebsites > 0) {
                const limit = 50
                const totalPages = Math.ceil(totalWebsites / limit)
                for (let index = 0; index < totalPages; index++) {
                    const offset = index * limit
                    const websites = await Website.find(query, 'website_url').sort({ website_id: -1 }).skip(offset).limit(limit)

                    for (const website of websites) {
                        console.log(`==== Started: Transaction get from website: ${website.website_url} ====`)
                        await deletePrivateMessageContentRecordByDateWithDomain(startDate, endDate, website.website_url)
                        console.time('getWebsiteTransactions_private_message')
                        console.log('=== Get private_message start ===')
                        processed_records = 0
                        await getDataFromWeb(website.website_url, start_date, end_date, 1, 'private_message')
                        console.log('=== Get private_message End ===')
                        console.timeEnd('getWebsiteTransactions_private_message')
                        console.log(`==== Complete: Transaction get from website: ${website.website_url} ====`)
                    }
                }
            }
        }
        return true
    } catch (error) {
        console.log('------------------------')
        console.log('Error in ', domain)
        console.log('Error ', error)
        console.log('------------------------')
        return false
    }
}

/**
 * @description create User registration and subscription count log table
 * @returns {boolean} true/false
 */
async function createUserSubscriptionRegistrationCountLogTableInMySql() {
    try {
        await db_mysql_connection.query(`DROP TABLE IF EXISTS ${user_subscription_transaction_count_table}`)
        const sql = `
            CREATE TABLE ${user_subscription_transaction_count_table} (
                id int NOT NULL AUTO_INCREMENT,
                domain VARCHAR(255),
                registration VARCHAR(255),
                subscription VARCHAR(255),
                total_amount_spent_0 VARCHAR(255),
                total_amount_spent_grater_then_0 VARCHAR(255),
                feed_unlock_count VARCHAR(255),
                feed_unique_unlock_count VARCHAR(255),
                mass_message_unlock_count VARCHAR(255),
                mass_message_unique_unlock_count VARCHAR(255),
                private_message_unlock_count VARCHAR(255),
                tip_count VARCHAR(255),
                PRIMARY KEY (id)
            )
        `
        await db_mysql_connection.query(sql)
        console.log(`${user_subscription_transaction_count_table} Table created`)
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * delete Content log by date and domain
 *
 * @param {string} domain domain
 */
async function deleteUserRegistrationSubscriptionCountRecordByDateWithDomain(domain) {
    try {
        let sql = `DELETE FROM ${user_subscription_transaction_count_table}`
        let has_condition = false
        if (domain !== 'all') {
            sql = has_condition === true ? `${sql} AND domain = '${domain}'` : `${sql} WHERE domain = '${domain}'`
            has_condition = true
        }

        const [rows] = await db_mysql_connection.query(sql)
        console.log('Records deleted Successfully')
        return
    } catch (error) {
        console.log(error)
        console.log('==== Error in delete record with domain ====')
    }
}

/**
 * @description insert registration subscription count logs in database
 * @param {Array} array array
 * @returns {boolean} true/false
 */
async function saveUserRegistrationSubscriptionCount(array) {
    try {
        const insertionFields = 'domain,registration,subscription,total_amount_spent_0,total_amount_spent_grater_then_0,feed_unlock_count,feed_unique_unlock_count,mass_message_unlock_count,mass_message_unique_unlock_count,private_message_unlock_count,tip_count'
        const statement = `INSERT INTO ${user_subscription_transaction_count_table} (${insertionFields})  VALUES ?  `

        await db_mysql_connection.query(statement, [[array]])
        return true
    } catch (error) {
        console.log(error.message)
        return
    }
}

/**
 * @description Get User Registration and Subscription count
 * @param {string} domain domain name
 * @returns {boolean} true/false
 */
async function userRegistrationSubscriptionLogByDomain(domain) {
    const requestBody = {
        token: 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl',
        domain: domain
    }
    const host = process.env.NODE_ENV === 'development' ? `http://${domain}` : `https://api.${domain}`

    let apiUrl = `${host}/api/get-registration-subscription-count`

    try {
        const body = await axios.post(apiUrl, requestBody)
        if (body.status === 200) {
            await saveUserRegistrationSubscriptionCount(body.data.data)
            return true
        } else {
            console.log(`error in ${apiUrl}`)
            return false
        }
    } catch (error) {
        console.log(`error in ${apiUrl}`, error)
        return false
    }
}

/**
 * Get and insert users registration and subscription log
 *
 * @param {string} domain domain
 * @returns {boolean} true false
 */
async function userRegistrationSubscriptionLog(domain = 'all') {
    try {
        const query = {}
        if (domain != 'all') {
            query.website_url = domain
        }

        if (process.env.NODE_ENV === 'development') {
            const localDomain = 'localhost:8000'
            await deleteUserRegistrationSubscriptionCountRecordByDateWithDomain(localDomain)
            processed_records = 0
            await userRegistrationSubscriptionLogByDomain(localDomain)
            console.log(`==== Complete: Transaction get from website: ${localDomain} ====`)
        } else {
            const totalWebsites = await Website.countDocuments(query)
            if (totalWebsites > 0) {
                const limit = 50
                const totalPages = Math.ceil(totalWebsites / limit)
                for (let index = 0; index < totalPages; index++) {
                    const offset = index * limit
                    const websites = await Website.find(query, 'website_url').sort({ website_id: -1 }).skip(offset).limit(limit)

                    for (const website of websites) {
                        console.log(`==== Started: User Registration and subscription count website: ${website.website_url} ====`)
                        await deleteUserRegistrationSubscriptionCountRecordByDateWithDomain(website.website_url)
                        console.time('userRegistrationSubscriptionLog')
                        processed_records = 0
                        await userRegistrationSubscriptionLogByDomain(website.website_url)
                        console.timeEnd('userRegistrationSubscriptionLog')
                        console.log(`==== Complete: User Registration and subscription count website: ${website.website_url} ====`)
                    }
                }
            }
        }
        return true
    } catch (error) {
        console.log('------------------------')
        console.log('Error in ', domain)
        console.log('Error ', error)
        console.log('------------------------')
        return false
    }
}

module.exports = {
    generateContentLogForDataScientist,
    createTransactionLogTableInMySql,
    addTransactionLogs,
    connectToMySql,
    deleteTransactionRecordByDateWithDomain,
    alterTableToAddTransactionIdColumn,
    createContentLogTableInMySQL,
    createMySQLTables,
    getPrivateMessagesLog,
    createUserSubscriptionRegistrationCountLogTableInMySql,
    deleteUserRegistrationSubscriptionCountRecordByDateWithDomain,
    saveUserRegistrationSubscriptionCount,
    userRegistrationSubscriptionLog
}
