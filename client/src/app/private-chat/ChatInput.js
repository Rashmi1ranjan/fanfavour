import _ from 'lodash'
import { Images } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Send } from 'lucide-react'
import { purchaseFromWallet } from '../../action/crypto-payment.action'
import { addPayPerMessageCredit, removePayPerMessageCredit, updateWalletAmount } from '../../../store/slices/authSlice'
import { setConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from '../../../store/slices/sweetAlertSlice'
import { setSelectedChatModelId, toggleChatTipPopup, unlockContentDetail, updateUserList, clearChatTextInput } from '../../../store/slices/chatSlice'
import { incMessageId, addNewMessageInEnd } from '../../../store/slices/chatSlice'
import { sendTextMessage } from '../../action/chat.action'
import AddFundPopup from '../../components/modules/crypto/AddFundPopup'
import socket from '../../lib/socket'
import ChatInputHandler from './ChatInputHandler'
import ChatInputTextArea from './ChatInputTextArea'
import ModalPopUp from '../../components/modals/ModalPopUp'

export default function ChatInput(props) {
    const auth = useSelector(state => state.auth)
    const chat = useSelector(state => state.chat)
    const { user, appSettings } = auth
    const { is_pay_per_message_enabled, currency_symbol } = appSettings
    const { messageId, unlockPaymentData } = chat

    const {
        isAdmin,
        role
    } = user
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [inputType, setInputType] = useState('')
    const [showAddFundPopup, setShowAddFundPopup] = useState(false)
    const [remainAmount, setRemainAmount] = useState(0)
    const [cryptoPaymentType, setCryptoPaymentType] = useState('')
    const [tipAmount, setTipAmount] = useState(0)
    const textareaRef = useRef(null)
    const [isPayPerMessageEnabled, setIsPayPerMessageEnabled] = useState(false)
    const [payPerMessageAmount, setPayPerMessageAmount] = useState('')
    const [personalizedMessage, setPersonalizedMessage] = useState('')
    const isInputDisabled = props.subscriptionStatus === '0'

    const dispatch = useDispatch()

    const resetForm = () => {
        setMessage('')
        setLoading(false)
    }

    const tipUsingCrypto = async (amount, walletBalance, tipMessage) => {
        setCryptoPaymentType('tips')
        setTipAmount(amount)
        setPersonalizedMessage(tipMessage)
        const tipAmount = Number(parseFloat(amount)).toFixed(2)
        if (walletBalance >= tipAmount) {
            const data = {
                payment_for: 'tips',
                amount: tipAmount.toString(),
                tipMessage: tipMessage.trim()
            }
            const userId = chat.selectedUserId
            const userDomain = chat.userList.find(obj => obj._id === userId)
            data.domain = userDomain.domain
            data.email = auth.user.email
            const res = await purchaseFromWallet(auth.user.domain, data, dispatch)
            if (res.success === 1) {
                dispatch(updateWalletAmount(res.data.wallet_balance))
                setShowAddFundPopup(false)
                setRemainAmount(0)
                setCryptoPaymentType('')
                setTipAmount(0)
                setPersonalizedMessage('')
                return res
            } else {
                const message = _.get(res, 'message', 'something went wrong')
                dispatch(setSweetAlert({ description: message }))
                dispatch(toggleChatTipPopup(false))
                return res
            }
        } else {
            const remainAmount = Math.ceil(tipAmount - walletBalance)
            if (walletBalance === 0.00) {
                setShowAddFundPopup(true)
                setRemainAmount(0)
            } else {
                setShowAddFundPopup(true)
                setRemainAmount(remainAmount)
            }
            return null
        }
    }

    const tipResponseHandler = (res) => {
        if (res.success === 1) {
            dispatch(setSweetAlert({ description: res.data.message }))
            dispatch(toggleChatTipPopup(false))
            dispatch(addNewMessageInEnd({ data: res.data.messageData, user_id: chat.selectedUserId }))
            const lastMessage = `You just tipped <model_name> ${res.data.messageData.message}`
            dispatch(updateUsersLastMessage({ user_id: chat.selectedUserId, message: lastMessage, type: res.data.messageData.type, isAdmin: false }))
            scrollToBottom()
        }
    }

    const payPerMessageWalletBalanceUpdated = (amount) => {
        setCryptoPaymentType('')
        dispatch(updateWalletAmount(amount))
        dispatch(unlockContentDetail({}))
        dispatch(setSweetAlert({ description: 'Amount Successfully Added.' }))
    }

    function scrollToBottom() {
        // get the messageList container and set the scrollTop to the height of the container
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight
        }
    }

    function payPerMessageCreditRemove() {
        if (
            is_pay_per_message_enabled === true &&
            auth.user.payPerMessageCredit > 0
        ) {
            dispatch(removePayPerMessageCredit())
        }
    }

    function payPerMessageCreditAdd() {
        dispatch(addPayPerMessageCredit())
    }

    const sendMessage = (data) => {
        sendTextMessage(data, scrollToBottom, dispatch)
    }

    const handleTextMessage = (data) => {
        setLoading(true)
        dispatch(incMessageId())
        const modifiedData = {
            ...data,
            senderId: data.sender,
            receiverId: data.receiver
        }
        dispatch(addNewMessageInEnd({ data: modifiedData, user_id: data.receiver }))
        resetForm()
        dispatch(setShowAlertOnPageWrapper(false))
        dispatch(unlockContentDetail({}))
        const updatedUserList = chat.userList.map(user => {
            if (user._id === data.receiver) {
                return {
                    ...user,
                    last_message: data.message,
                    last_message_time: new Date().toISOString()
                }
            }
            return user
        })
        if (chat.userList.length > 1) {
            dispatch(updateUserList({ data: updatedUserList, domain: auth.user.domain }))
        }
        sendMessage(data)
    }

    const payPerMessageConfirmationAndAlert = (messageAmount) => {
        let confirmationMessage
        if (auth.user.payPerMessageCredit === 0) {
            const payPerMessageAmount = messageAmount === '' ? auth.appSettings.pay_per_message_amount : messageAmount
            if (auth.user.default_payment_method === 'crypto_currency') {
                confirmationMessage = `You currently have $${auth.user.wallet_amount} in your wallet. Sending this message will charge $${payPerMessageAmount}. It will be debited from your wallet balance.`
            } else {
                confirmationMessage = `Sending this message will charge $${payPerMessageAmount} to the payment method on file for your account.`
            }
        } else {
            confirmationMessage = `You have ${auth.user.payPerMessageCredit} Message credit. This message is sent free.`
        }

        dispatch(setShowAlertOnPageWrapper(true))
        dispatch(setConfirmSweetAlert({ description: confirmationMessage }))
        dispatch(unlockContentDetail({ type: 'pay_per_message' }))
    }

    const payPerMessageCryptoPayment = (data) => {
        setShowAddFundPopup(data.showAddFundPopup)
        setRemainAmount(data.remainAmount)
        setCryptoPaymentType('chat')
        setTipAmount(data.tipAmount)
    }

    useEffect(() => {
        if (message.trim() !== '') {
            scrollToBottom()
        }
    }, [chat.newChatMessage])

    const MESSAGE_TYPE = 'text'
    const MAX_MESSAGE_LENGTH = 20000

    const handleMessage = () => {
        const trimmedMessage = message.trim()
        if (!trimmedMessage && MESSAGE_TYPE === 'text') {
            const errorMessage = 'Message can\'t be empty'
            setMessage('')
            dispatch(setSweetAlert({ description: errorMessage }))
            return
        }
        // TODO: find message type

        if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
            dispatch(setSweetAlert({ description: 'Message is too long.' }))
            return
        }
        // Check if the pay-per-message feature is enabled on the other server's website while sending a message from the current website to another website
        const userId = chat.selectedUserId
        const selectedUser = chat.userList.find(obj => obj._id === userId)

        if (!selectedUser?.domain) {
            dispatch(setSweetAlert({ description: 'User domain not found.' }))
            return
        }

        const data = {
            email: auth.user.email,
            isUniversal: true,
            modelDomain: selectedUser.domain,
            currentDomain: auth.user.domain
        }

        if (auth.user.domain !== selectedUser.domain) {
            socket.off('PAY_PER_MESSAGE_STATUS')
            socket.emit('IS_ENABLE_PAY_PER_MESSAGE', data)
            socket.once('PAY_PER_MESSAGE_STATUS', response => {
                const { isPayPerMessageEnabled, payPerMessageAmount } = response

                setIsPayPerMessageEnabled(isPayPerMessageEnabled)

                if (isPayPerMessageEnabled) {
                    setPayPerMessageAmount(payPerMessageAmount)
                    checkPayPerMessageEnable(true, payPerMessageAmount)
                } else {
                    sendMessageToAdmin(MESSAGE_TYPE, false)
                }
            })
        } else {
            if (is_pay_per_message_enabled) {
                checkPayPerMessageEnable(is_pay_per_message_enabled)
            } else {
                sendMessageToAdmin(MESSAGE_TYPE)
            }
        }
    }

    useEffect(() => {
        if (unlockPaymentData.isPayPerMessage === true) {
            const messageType = 'text'
            sendMessageToAdmin(messageType, true)
        }
    }, [unlockPaymentData.isPayPerMessage, isPayPerMessageEnabled])

    const checkPayPerMessageEnable = (isEnablePayPerMessage, messageAmount = '') => {
        if (isEnablePayPerMessage === true && isAdmin === false) {
            if (auth.user.default_payment_method === 'crypto_currency') {
                const wallet_amount = auth.user.wallet_amount
                const pay_per_message_amount = messageAmount === '' ? auth.appSettings.pay_per_message_amount : messageAmount
                if (wallet_amount < pay_per_message_amount) {
                    setCryptoPaymentType('chat')
                    dispatch(setShowAlertOnPageWrapper(true))
                    dispatch(setConfirmSweetAlert({ description: 'Your wallet balance is low. Please add funds to send message.' }))
                    dispatch(unlockContentDetail({ type: 'add_funds_for_pay_per_message_text' }))
                    return
                }
            }
            const confirmation = payPerMessageConfirmationAndAlert(messageAmount)
            return confirmation
        }
    }

    useEffect(() => {
        if (unlockPaymentData.addFundsForPayPerMessageText) {
            const wallet_amount = auth.user.wallet_amount
            const pay_per_message_amount = payPerMessageAmount === '' ? auth.appSettings.pay_per_message_amount : payPerMessageAmount
            const remainAmount = wallet_amount === 0.00 ? 0 : Math.ceil(pay_per_message_amount - wallet_amount)
            dispatch(setShowAlertOnPageWrapper(false))
            dispatch(unlockContentDetail({}))
            payPerMessageCryptoPayment({ showAddFundPopup: true, remainAmount: remainAmount, tipAmount: pay_per_message_amount })
        }
    }, [unlockPaymentData.addFundsForPayPerMessageText])

    const sendMessageToAdmin = (messageType, isEnablePayPerMessage = false) => {
        if (messageType === 'text') {
            const data = {
                type: messageType,
                fromAdmin: false,
                message: message,
                receiver: chat.selectedUserId,
                canChat: true,
                messageFrom: 'chat',
                userId: auth.user._id,
                _id: 'user' + messageId,
                uniqueId: 'user' + messageId,
                sender: auth.user._id,
                domain: chat.userList.find(user => user._id === chat.selectedUserId)?.domain,
                email: auth.user.email,
                isPayPerMessageEnabled: isEnablePayPerMessage,
                currentDomain: auth.user.domain
            }
            setLoading(true)
            handleTextMessage(data)
        }
    }

    useEffect(() => {
        dispatch(setSelectedChatModelId(chat.selectedModelId || auth.appSettings.model_id))
    }, [])

    return (
        <>
            <div id='chat-input' className='sticky bottom-0 z-10 w-full px-3 pt-3 pb-5 bg-[linear-gradient(58deg,rgba(242,227,247,1)_-50%,rgba(231,236,246,1)_100%)]' style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                <div className='flex items-center gap-2 w-full '>
                    {/* Image button */}
                    <button
                        type='button'
                        className={`btn flex items-center justify-center flex-shrink-0 bg-white h-[50px] w-[50px] rounded-full ${isInputDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => setInputType('photo')}
                        disabled={loading || isInputDisabled}
                    >
                        <Images strokeWidth={1.5} className='text-[#ff1a9d]' />
                    </button>

                    {/* Tip button */}
                    {isAdmin === false && (
                        <button
                            type='button'
                            className={`btn flex items-center justify-center flex-shrink-0 bg-white h-[50px] w-[50px] rounded-full text-[#ff1a9d] cursor-pointer`}
                            onClick={() => setInputType('tip')}
                            disabled={loading}
                        >
                            {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                        </button>
                    )}

                    {/* Message input */}
                    <div className='bg-white rounded-xl p-3 w-full'>
                        <div className='relative flex-1'>
                            <ChatInputTextArea
                                textareaRef={textareaRef}
                                value={message}
                                setValue={setMessage}
                                disabled={false}
                                chat={chat}
                                clearChatTextInput={clearChatTextInput}
                                subscriptionStatus={props.subscriptionStatus}
                            />

                            {/* Send button */}
                            {['1', '2'].includes(props.subscriptionStatus) &&
                                <button
                                    type='button'
                                    className='absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer'
                                    onClick={handleMessage}
                                    disabled={loading}
                                >
                                    <Send size={26} strokeWidth={1.5} className='text-[#ff1a9d]' />
                                </button>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {role !== 'live_stream_manager' &&
                <ChatInputHandler
                    onSend={handleMessage}
                    isAdmin={isAdmin}
                    scrollToBottom={scrollToBottom}
                    payPerMessageCreditRemove={payPerMessageCreditRemove}
                    payPerMessageCreditAdd={payPerMessageCreditAdd}
                    payPerMessageCryptoPayment={payPerMessageCryptoPayment}
                    inputType={inputType}
                    setInputType={setInputType}
                    message={message}
                    setMessage={setMessage}
                    tipUsingCrypto={tipUsingCrypto}
                    subscriptionStatus={props.subscriptionStatus}
                    setIsPopupOpen={props.setIsPopupOpen}
                />
            }
            {
                showAddFundPopup === true &&
                <ModalPopUp handleClose={() => {
                    setShowAddFundPopup(false)
                    setRemainAmount(0)
                }}>
                    <div className='modal-body'>
                        <div className='container'>
                            <AddFundPopup
                                onHideAddFund={() => setShowAddFundPopup(false)}
                                type={cryptoPaymentType}
                                transactionAmount={Number(tipAmount)}
                                remainAmount={remainAmount}
                                onCompleteTransaction={
                                    async (updatedBalance) => {
                                        setShowAddFundPopup(false)
                                        if (updatedBalance) {
                                            if (cryptoPaymentType === 'tips') {
                                                const tipResponse = await tipUsingCrypto(tipAmount, updatedBalance, personalizedMessage)
                                                if (tipResponse?.success === 1) {
                                                    tipResponseHandler(tipResponse)
                                                }
                                            }

                                            if (cryptoPaymentType === 'chat') {
                                                payPerMessageWalletBalanceUpdated(updatedBalance)
                                            }
                                        }
                                    }
                                }
                            />
                        </div>
                    </div>
                </ModalPopUp >
            }
        </>
    )
}