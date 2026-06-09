const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const { errorResponse, successResponse } = require('../utils')
const { protectRouteWithRole, SUPER_ADMIN } = require('./../middleware/auth.middleware')
const connection = require('../utils/db')

router.post('/sendgrid/webhook', async (req, res) => {
    try {
        const events = req.body
        for (const event of events) {
            const {
                email,
                event: eventType,
                timestamp,
                sg_event_id,
                sg_message_id,
                reason,
                ip,
                useragent,
                url,
                tracking,
                domain,
                send_date,
                sg_template_id
            } = event

            const timestamps = new Date(timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ')

            // const filterQuery = `SELECT * FROM dump_users WHERE email = '${email}'`
            // const [userRows] = await connection.promise().query(filterQuery)

            if (tracking !== 'ff_website_promotional_email_2025_11_24') {
                continue
            }
            connection.query(
                `INSERT INTO sendgrid_events
                    (email, event_type, timestamp, sg_event_id, sg_message_id, reason, ip, useragent, url, tracking, domain, send_date, template_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, eventType, timestamps, sg_event_id, sg_message_id, reason || null, ip || null, useragent || null, url || null, tracking, domain, send_date, sg_template_id || null]
            )
            console.log(`Inserted event: ${eventType} | Email: ${email}`)
        }

        return successResponse(res, { message: 'Webhook received' }, 'Webhook received', 200)
    } catch (error) {
        return errorResponse(res, { error: 'Error occured while get webhook' }, 'Error occured while get webhook', 401)
    }
})

/**
 * @description get All active website listing
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
router.post('/get-email-statistics', protectRouteWithRole([SUPER_ADMIN]), asyncHandler(async (req, res) => {
    try {
        // const start_date = (req.body.start_date == '') ? moment().subtract(6, 'days').format('MM/DD/YYYY') : req.body.start_date
        // const end_date = (req.body.end_date == '') ? moment().format('MM/DD/YYYY') : req.body.end_date

        // const dateStart = moment(start_date, 'MM/DD/YYYY').format('YYYY-MM-DD')
        // const dateEnd = moment(end_date, 'MM/DD/YYYY').format('YYYY-MM-DD')

        // const domain = req.body.domain

        const [eventTypesRows] = await connection.promise().query(
            'SELECT DISTINCT event_type FROM sendgrid_events'
        )

        const eventTypes = eventTypesRows.map(row => row.event_type)

        const selectFields = eventTypes.map(type => {
            return `CAST(COALESCE(SUM(CASE WHEN e.event_type = '${type}' THEN 1 ELSE 0 END), 0) AS UNSIGNED) AS \`${type}\``
        }).join(',\n')

        // const [results] = await connection.promise().query(`
        //     WITH RECURSIVE date_range AS (
        //       SELECT CAST(? AS DATE) AS date
        //       UNION ALL
        //       SELECT date + INTERVAL 1 DAY
        //       FROM date_range
        //       WHERE date + INTERVAL 1 DAY <= CAST(? AS DATE)
        //     )
        //     SELECT
        //       DATE_FORMAT(d.date, '%Y-%m-%d') AS date,
        //       ${selectFields}
        //     FROM date_range d
        //     LEFT JOIN sendgrid_events e
        //       ON e.send_date = DATE_FORMAT(d.date, '%Y-%m-%d')
        //       AND e.send_date BETWEEN ? AND ?
        //       AND (? = '' OR e.domain = ?)
        //     GROUP BY d.date
        //     ORDER BY d.date
        //   `, [dateStart, dateEnd, dateStart, dateEnd, domain, domain])

        const [results] = await connection.promise().query(`
            WITH RECURSIVE date_range AS (
              SELECT CURDATE() - INTERVAL 6 DAY AS date
              UNION ALL
              SELECT date + INTERVAL 1 DAY
              FROM date_range
              WHERE date + INTERVAL 1 DAY <= CURDATE()
            )
            SELECT
              DATE_FORMAT(d.date, '%Y-%m-%d') AS date,
              ${selectFields}
            FROM date_range d
            LEFT JOIN sendgrid_events e
              ON DATE(e.timestamp) = d.date
            GROUP BY d.date
            ORDER BY d.date
          `)

        return successResponse(res, results, 'Get email statistics', 200)
    } catch (error) {
        return errorResponse(res, {}, 'Error in get email statistics', 500)
    }
}))

module.exports = router
