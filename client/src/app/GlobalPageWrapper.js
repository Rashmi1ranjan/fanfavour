'use client'
import _ from 'lodash'
import { useEffect, useRef } from 'react'
import socket from '../lib/socket'
import { useDispatch, useSelector } from 'react-redux'
import { addNewMessageInEnd, setShowAddFundPopup, setUpdatedBalance, unlockContentDetail, updateUnreadMessageCountInUserList } from '../../store/slices/chatSlice'
import { readMessage, updateUsersLastMessage } from '../action/chat.action'
import { ROLE_USER } from '@/lib/constant'
import { updateUnreadCountInNavbar } from '../../store/slices/authSlice'
import { setAlertLoader, setShowAlertOnPageWrapper } from '../../store/slices/sweetAlertSlice'
import ConfirmSweetAlertsWrapper from '../components/modals/ConfirmSweetAlertsWrapper'
import ModalPopUp from '../components/modals/ModalPopUp'
import AddFundPopup from '../components/modules/crypto/AddFundPopup'
import { getAllPromotionOffers } from '../action/promotion.action'
import { usePathname } from 'next/navigation'

export default function GlobalPageWrapper({ children }) {
    const pathname = usePathname()
    const auth = useSelector(state => state.auth)
    const chat = useSelector(state => state.chat)
    const { showConfirmAlertInPageWrapper } = useSelector((state) => state.sweetAlert)

    const authRef = useRef(auth)
    const chatRef = useRef(chat)

    useEffect(() => {
        authRef.current = auth
    }, [auth])

    useEffect(() => {
        chatRef.current = chat
    }, [chat])

    const dispatch = useDispatch()

    useEffect(() => {
        socket.on('ONLINE_USER_LIST', (users) => {
            if (auth.user._id === undefined) {
                return
            }
            if (users.length > 1) {
                for (const user of users) {
                    if (user !== '' && user !== null) {
                        const roomData = {
                            roomId: user,
                            userId: auth.user._id
                        }
                        socket.emit('JOIN_ROOM', roomData)
                    }
                }
            } else {
                if (users !== '' && users !== null) {
                    const roomData = {
                        roomId: users,
                        userId: auth.user._id
                    }
                    // add the user in the admin chat room
                    socket.emit('JOIN_ROOM', roomData)
                }
            }
        })
    }, [socket, auth.user._id])

    useEffect(() => {
        if (typeof auth.user._id !== 'undefined' && auth.user.isAdmin === false && auth.user.role !== 'proxy_user') {
            socket.emit('USER_ONLINE', { userId: auth.user._id, email: auth.user.email, isUniversal: true, channel: auth.user.domain })
        }
    }, [auth.user])

    useEffect(() => {
        socket.on('MESSAGE_RECEIVE', handleMessageReceive)

        return () => {
            socket.off('MESSAGE_RECEIVE', handleMessageReceive)
        }
    }, [])

    const handleMessageReceive = (msg) => {
        if (authRef.current.user._id !== undefined) {
            const userIdString = authRef.current.user._id.toString()
            const { receiverId, senderId } = msg
            const receiverIdString = receiverId.toString()
            const { selectedUserId, selectedModelId } = chatRef.current
            const userId = authRef.current.user.isAdmin ? (msg.fromAdmin === true ? receiverId : senderId) : (msg.fromAdmin === true ? senderId : receiverId)
            const isAdmin = authRef.current.user.isAdmin

            let data = { userId: selectedUserId }
            if (isAdmin === true) {
                data.modelId = authRef.current.appSettings.model_id || selectedModelId
            }

            let shouldAddMessageInStore = false
            if (isAdmin && msg.isMassMessage) {
                shouldAddMessageInStore = true
            } else if (isAdmin === true && msg.type !== 'text') {
                shouldAddMessageInStore = receiverIdString === selectedUserId
            } else if (msg.fromAdmin === true && (msg.contentLeftForProcessing === undefined || msg.contentLeftForProcessing === 0)) {
                shouldAddMessageInStore = receiverIdString === userIdString
            }

            let isSameDomain = false
            let userDomain = ''
            if (isAdmin === false && chatRef.current.userList.length > 0 && selectedUserId) {
                const currentDomain = chatRef.current.userList.find(user => user._id === selectedUserId)
                userDomain = currentDomain.domain
            }

            const senderUserId = (chatRef.current.userList.length === 1 || msg.type === 'text' || isSameDomain) ? senderId : msg.userID
            if (shouldAddMessageInStore === false && msg.fromAdmin === false && (authRef.current.user._id === senderUserId)) {
                // check user need to add message in list while message send by user
                const id = isAdmin ? senderId : selectedModelId
                shouldAddMessageInStore = checkIfUserExistsInUserList(id)
            }

            if (shouldAddMessageInStore) {
                const processedMessages = new Set()
                if (msg.isResend === true && !processedMessages.has(msg.udid)) {
                    processedMessages.add(msg.udid)
                    dispatch(deleteSingleResendMassMessage(userId, msg.udid))
                }
                addMessage(msg, userId)

                const lastMessage = msg.type === 'tips'
                    ? `<user_name> just tipped you ${msg.message}!`
                    : msg.type === 'GO_LIVE_STREAM' && msg.message === '' ? 'Go Live Stream with <user_name> has ended.' : msg.message
                const isMassMessage = _.get(msg, 'isMassMessage', false)

                if (isAdmin === false && msg.type !== 'system' && msg.type !== 'GO_LIVE_STREAM') {
                    dispatch(updateUsersLastMessage({
                        user_id: userId,
                        message: lastMessage,
                        type: msg.type,
                        isAdmin: msg.fromAdmin,
                        isMassMessage: isMassMessage,
                        domain: authRef.current.user.domain,
                        admin: false
                    }))
                }

            }
            data.domain = userDomain ? userDomain : authRef.current.domain
            data.currentDomain = authRef.current.domain
            updateMessageUnreadCount(msg, shouldAddMessageInStore, data, userId)
        }
    }

    const addMessage = (message, selectedUserId) => {
        if (message && !message.isRotated) {
            dispatch(addNewMessageInEnd({ data: message, user_id: selectedUserId }))
            if (selectedUserId == chatRef.current.selectedUserId) {
                setTimeout(() => { scrollToBottom() }, 0)
            }
        }
    }

    const checkIfUserExistsInUserList = (userId) => {
        let isExistUser = false
        let userIndex = -1
        if (chatRef.current.userList !== undefined) {
            userIndex = chatRef.current.userList.findIndex(obj => obj._id === userId)
        }
        if (userIndex !== -1 || userId === authRef.current.user._id) {
            isExistUser = true
        }
        return isExistUser
    }

    const updateMessageUnreadCount = (msg, shouldAddMessageInStore, data, userId) => {
        const isAdmin = authRef.current.user.isAdmin
        const modelId = authRef.current.appSettings.model_id
        const { receiverId, senderId } = msg
        const receiverIdString = receiverId.toString()
        const senderIdString = senderId.toString()
        const { selectedUserId } = chatRef.current

        if (msg.isMassMessage === false || (msg.isMassMessage && shouldAddMessageInStore)) {
            let shouldReadMessage = false
            if (isAdmin && [receiverIdString, senderIdString].includes(selectedUserId)) {
                shouldReadMessage = true
            }
            if (isAdmin === false && [receiverIdString, senderIdString].includes(selectedUserId)) {
                shouldReadMessage = true
            }
            const role = _.get(authRef.current, 'user.role', ROLE_USER)
            if ([ROLE_USER].includes(role) && shouldReadMessage === true && window.location.pathname.includes('/private-chat')) {
                data.email = authRef.current.user.email
                readMessage(data, isAdmin, dispatch)
            } else if (role === ROLE_USER || senderIdString !== modelId) {
                if (msg.tipFrom !== 'menu' || isAdmin === true) {
                    dispatch(updateUnreadMessageCountInUserList({ userId, isAdmin }))
                    // if (msg.type === 'tips' && msg.fromAdmin === false) {
                    //     dispatch(updateModelTipsUnreadCount(1))
                    // }
                    if (role === ROLE_USER && shouldAddMessageInStore === false) return
                    dispatch(updateUnreadCountInNavbar(1))
                }
            }
        }
    }

    const scrollToBottom = () => {
        // get the message-list container and set the scrollTop to the height of the container
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight
        }
    }

    const setSweetAlertConfirmData = () => {
        switch (chatRef.current.unlockPaymentData.type) {
            case 'unlock':
                // Do something
                dispatch(unlockContentDetail({
                    messageId: chatRef.current.unlockPaymentData.messageId,
                    isUnlockPayment: true,
                    type: 'unlock'
                }))
                break
            case 'pay_per_message':
                // Do something
                dispatch(unlockContentDetail({
                    isPayPerMessage: true,
                    type: 'pay_per_message'
                }))
                break
            case 'pay_per_message_media':
                // Do something
                dispatch(unlockContentDetail({
                    isPayPerMessageMedia: true,
                    type: 'pay_per_message_media'
                }))
                break
            case 'tips_from_chat':
                // Do something
                dispatch(unlockContentDetail({
                    isTipFromChat: true,
                    type: 'tips_from_chat'
                }))
                break
            case 'add_funds_for_pay_per_message_text':
                dispatch(unlockContentDetail({
                    addFundsForPayPerMessageText: true,
                    type: 'add_funds_for_pay_per_message_text'
                }))
                break
            case 'add_funds_for_pay_per_message_media':
                dispatch(unlockContentDetail({
                    addFundsForPayPerMessageMedia: true,
                    type: 'add_funds_for_pay_per_message_media'
                }))
                break
            default:
                break
        }
    }

    useEffect(() => {
        if (pathname === '/logout') return

        if (authRef.current.domain) {
            getAllPromotionOffers(authRef.current.domain, dispatch)
        }
    }, [authRef.current.domain, pathname])

    return (
        <>
            {showConfirmAlertInPageWrapper &&
                <ConfirmSweetAlertsWrapper
                    onConfirm={() => {
                        dispatch(setAlertLoader(true))
                        setSweetAlertConfirmData()
                    }}
                    onCancel={() => dispatch(setShowAlertOnPageWrapper(false))}
                />
            }
            {chat.showAddFundPopup &&
                <ModalPopUp handleClose={() => {
                    dispatch(setShowAddFundPopup(false))
                    dispatch(setShowAlertOnPageWrapper(false))
                }}>
                    <div className='modal-body'>
                        <div className='container'>
                            <AddFundPopup
                                onHideAddFund={() => { dispatch(setShowAddFundPopup(false)) }}
                                type='chat'
                                transactionAmount={Number(chat.unlockData.amount)}
                                remainAmount={chat.remainAmount}
                                onCompleteTransaction={
                                    (updatedBalance) => {
                                        dispatch(setShowAddFundPopup(false))
                                        if (updatedBalance) {
                                            dispatch(setUpdatedBalance({ updatedBalance: updatedBalance, isUpdateBalance: true }))
                                        }
                                    }
                                }
                            />
                        </div>
                    </div>
                </ModalPopUp>
            }
            {children}
        </>
    )
}
