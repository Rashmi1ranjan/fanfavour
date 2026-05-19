import { getHostName } from '../../helper/index.js'
import { sendChatMessage } from '../../sockets/SocketManager.js'
import { getAppSettings } from '../../utils/AppSettings.js'
import { getUserFromWebsite } from '../../utils/UniversalLogin.js'


export default function UniversalRedis(redis) {
    const subscriber = redis.getSubscriber()
    const hostName = new URL(process.env.FF_CLIENT_DOMAIN).hostname || 'localhost'
    const channel = hostName + '/api'

    subscriber.subscribe(channel, async (message) => {
        const parsedMessage = JSON.parse(message)
        const { event, requestObject, meta, source } = parsedMessage
        if (event === 'ADMIN_SEND_MESSAGE') {
            const reqBody = requestObject.body
            const decoded = requestObject.decoded
            const { fromAdmin, email, receiver, sender } = reqBody
            const { model_id } = meta
            // const user = await getUserFromWebsite(email, source, project)
            // const userId = user._id
            // reqBody.userId = userId
            if (fromAdmin) {
                // ignore this case for now
                decoded.id = model_id
                reqBody.sender = sender
                reqBody.receiver = receiver
            } else {
                decoded.id = userId
                reqBody.sender = userId
            }
            sendChatMessage(reqBody.receiver, 'MESSAGE_RECEIVE', requestObject, reqBody.receiver)
            // await sendMessage(requestObject, null, source)
        } else if (event === 'IS_ENABLE_PAY_PER_MESSAGE') {
            const { email, source, currentDomain, modelDomain } = parsedMessage
            const isPayPerMessageEnabled = await getAppSettings(modelDomain, 'is_pay_per_message_enabled')
            const payPerMessageAmount = await getAppSettings(modelDomain, 'pay_per_message_amount')
            const payPerMessageCredit = await getUserFromWebsite(email, modelDomain, { pay_per_message_credit: 1 })
            const payPerMessageCreditAmount = payPerMessageCredit.pay_per_message_credit
            const object = {
                event: 'PAY_PER_MESSAGE_STATUS',
                data: { isPayPerMessageEnabled, payPerMessageAmount, payPerMessageCreditAmount }
            }
            const sourceDomain = new URL(process.env.FF_CLIENT_DOMAIN).hostname || 'localhost'
            redis.publishToChannel(sourceDomain, object)
        }
    })
}