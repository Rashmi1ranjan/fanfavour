const express = require("express")
const router = express.Router()
const _ = require('lodash')
const sgMail = require('@sendgrid/mail');
const moment = require('moment')
let lastEmailSentTime = null

router.post('/', (req, res) => {
    let params = req.body
    var duration = moment.duration(moment().diff(lastEmailSentTime));
    var hours = duration.asHours();
    hours = Math.floor(hours)

    if ((lastEmailSentTime == null) || (hours >= 1)) {
        console.log("In send email")
        sgMail.setApiKey(params.sendgrid_api_key);
        let fromEmail = params.email_from
        let websiteName = params.website_name
        let requestFrom = params.request_from

        const msg = {
            to: `nick@nickmccandless.com`,
            cc: [`yogs174@gmail.com`, `jkrushna96@gmail.com`],
            from: fromEmail,
            subject: `Received -12 as CCBill response on ${websiteName}`,
            html: `
            <table style="width: 100%;" border="0" cellspacing="0" cellpadding="0">
                <tr>
                    <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px;">
                            <tr><td>
                                Hello,<br /><br />
                                <p>
                                    ${websiteName} has encountered a response of -12 from CCBill. You may need to contact CCBill and ask them if the IP has been blocked and if so you'll need ask them to unlock the IP.

                                    This error occurred in ${requestFrom}.
                                </p>
                            </td></tr>
                        </table>
                    </td>
                </tr>
            </table>
        `
        };

        sgMail.send(msg).then(sgmail => {
            lastEmailSentTime = moment()
            return res.send({ sent: true })
        }).catch(error => {
            return res.status(500).send(error)
        })
    } else {
        return res.send({ sent: false, message: 'Email was sent in the last hour' })
    }
})

module.exports = router
