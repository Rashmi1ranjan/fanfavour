import _ from 'lodash'
import Joi from 'joi'
import { successResponse, errorResponse } from "../helper/common.js"
import { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } from "../helper/http.status.js"
import { sendEmail } from '../utils/sendEmail.js'
import { servicesApiRequest } from '../utils/axiosClient.js'

export const contactUs = async (req, res) => {
    try {
        const { name, email, subject, body } = req.body
        if (_.isEmpty(name) || _.isEmpty(email) || _.isEmpty(subject) || _.isEmpty(body)) {
            return errorResponse(res, {}, 'All fields are required', HTTP_BAD_REQUEST_400)
        }

        const emailSchema = Joi.string().email().required()
        const { error } = emailSchema.validate(email)
        if (error) {
            return errorResponse(res, {}, 'Please enter a valid email address', HTTP_BAD_REQUEST_400)
        }

        const websiteUrl = process.env.FF_CLIENT_DOMAIN
        const domain = new URL(websiteUrl)
        const hostName = domain.hostname

        const fromEmail = email.toLowerCase().trim()

        const emailData = {
            name: name,
            email: fromEmail,
            subject: subject,
            body: body,
            domain: hostName
        }

        await servicesApiRequest({
            method: 'post',
            endpoint: '/contact_us',
            data: emailData,
            params: { token: null },
        })

        const sendgridApiKey = process.env.SENDGRID_API_KEY

        const msg = {
            to: 'support@themccandlessgroup.com',
            from: fromEmail,
            subject: `Contact Us - ${subject}`,
            text: `
From ${req.headers.origin}

${body}
        `,
            html: `
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    </head>
    <body>
        From <a>${_.escape(req.headers.origin)}</a><br />
        ${_.escape(body).replace(/\n/g, '<br />')}
    </body>
</html>
    `
        }

        const isSentEmail = await sendEmail(msg, sendgridApiKey)
        if (isSentEmail) {
            return successResponse(res, {}, 'Your message was sent successfully.')
        } else {
            return errorResponse(res, {}, 'Failed to send message', HTTP_INTERNAL_SERVER_ERROR_500)
        }
    } catch (error) {
        const errorMessage = _.get(error, 'response.data.message', 'Error sending email')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}
