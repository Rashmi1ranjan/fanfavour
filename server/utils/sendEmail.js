import sgMail from '@sendgrid/mail'
/**
 * send email
 *
 * @param {object} emailContent email content
 * @returns {Promise<boolean>} true if- mail was sent, false otherwise.
 */
export const sendEmail = async (emailContent, sendgridApiKey) => {
    sgMail.setApiKey(sendgridApiKey)

    try {
        await sgMail.send(emailContent)
        // console.log('email send.')
        return true
    } catch (error) {
        console.log('Error while sending emails')
        console.log({ error })
        return false
    }
}
