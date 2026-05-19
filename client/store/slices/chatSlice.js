import { createSlice } from '@reduxjs/toolkit'
import { current } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    newChatMessage: [],
    userList: [],
    originalUserList: [],
    userProfileInfo: {},
    updatedBalance: {},
    unlockPaymentData: {},
    messageId: 1,
    unlockData: {},
    promotionDetails: {},
    currentPage: 1,
    totalPages: 0,
    remainAmount: 0,
    sortBy: 'DESC',
    sortBySubscribers: 'DESC',
    selectedModelId: '',
    websiteId: '',
    selectedUserId: '',
    isChatScrollToBottom: true,
    showChatTipPopup: false,
    isLoading: false,
    isChatScreenOpen: false,
    clearChatInputText: false,
    isMessagesLoading: false,
    showAddFundPopup: false,
    showCloseButtonOnChatScreen: false,
    activeTab: 'All Messages'
}

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setUserList: (state, action) => {
            const {
                userList,
                isInfiniteScroll,
                totalPages,
                currentPage,
                sortBy,
                sortBySubscribers
            } = action.payload

            // 🔹 Normalize & format messages
            const formattedUsers = userList.map(user => ({
                ...user,
                last_message: user.last_message
                    ? user.last_message.replace('<user_name>', user.name)
                    : '',
                user_last_message: user.user_last_message
                    ? user.user_last_message.replace('<model_name>', user.name)
                    : ''
            }))

            if (isInfiniteScroll) {
                const existingUserIds = new Set(
                    state.userList.map(user => user._id)
                )

                const uniqueUsers = formattedUsers.filter(
                    user => !existingUserIds.has(user._id)
                )

                state.userList.push(...uniqueUsers)
            } else {
                state.userList = formattedUsers
                state.originalUserList = formattedUsers
            }

            state.totalPages = totalPages
            state.currentPage = Number(currentPage)
            state.sortBy = sortBy
            state.sortBySubscribers = sortBySubscribers
            state.isLoading = false
        },
        updateChatMessage: (state, action) => {
            const { user_id, data, sendingId } = action.payload

            // Find user chat
            const userChat = state.newChatMessage.find(
                chat => chat.user_id === user_id
            )

            if (!userChat || !Array.isArray(userChat.messages)) return

            const targetId = sendingId || data._id?.toString()

            const message = userChat.messages.find(
                msg => msg._id === targetId
            )

            // Update ONLY message data, keep old state
            if (message) {
                Object.assign(message, data)
            }
        },
        chatUserProfileInfo: (state, action) => {
            const payload = action.payload
            const existingProfile = state.userProfileInfo[payload._id]

            state.userProfileInfo[payload._id] = {
                profile: payload.avatarUrl,
                name: payload.name,
                nick_name: payload.nick_name,
                totalAmountSpent: payload.total_amount_spent,
                isLiveStreamAvailable:
                    existingProfile?.isLiveStreamAvailable !== undefined
                        ? existingProfile.isLiveStreamAvailable
                        : payload.isLiveStreamAvailable,
                totalRefundAmount: payload.total_refund_amount ?? 0.0,
                totalVoidAmount: payload.total_void_amount ?? 0.0,
                totalChargeBackAmount: payload.total_chargeback_amount ?? 0.0,
                totalChargeBackCount: payload.total_chargeback_count ?? 0.0,
                lastSeen: payload.last_seen,
                wallet_amount: payload.wallet_amount,
                ccbill_subscription_status: action.payload.ccbill_subscription_status
            }
        },
        setMessages: (state, action) => {
            const { data } = action.payload
            const { messages, promotionDetails } = data
            let updatedPromotionDetails = state.promotionDetails
            if (promotionDetails) {
                updatedPromotionDetails = { ...updatedPromotionDetails, ...promotionDetails }
            }
            const userId = action.payload.user_id
            const groupMessagesByUserId = (messagesArray) => {
                if (messagesArray !== undefined) {
                    return messagesArray.reduce((acc, msg) => {
                        const otherUserId = msg.senderId === userId ? msg.senderId : msg.receiverId

                        // Initialize the structure for the user if it doesn't exist
                        if (!acc[otherUserId]) {
                            acc[otherUserId] = {
                                messages: [],
                                totalMessagesPage: 1,
                                currentMessagesPage: 1,
                                shouldLoadMoreMessages: false
                            }
                        }

                        const existingUserMessages = acc[otherUserId] ? acc[otherUserId].messages : []
                        const checkMessageIsExist = existingUserMessages.some(obj => obj._id === msg._id)

                        if (!checkMessageIsExist) {
                            acc[otherUserId].messages.push(msg)
                        }

                        return acc
                    }, {})
                }
                return {} // Return an empty object if messagesArray is undefined
            }

            // Get grouped messages
            const groupedMessages = groupMessagesByUserId(messages)
            return {
                ...state,
                promotionDetails: updatedPromotionDetails,
                newChatMessage: {
                    ...state.newChatMessage,
                    [userId]: {
                        messages: groupedMessages[userId]?.messages
                            ?? state.newChatMessage[userId]?.messages
                            ?? [],
                        totalMessagesPage: data.totalPages,
                        currentMessagesPage: data.currentPage,
                        shouldLoadMoreMessages: data.shouldLoadMoreMessages
                    }
                }
            }
        },
        updateReadMessageCount: (state, action) => {
            const { userId } = action.payload

            const user = state.userList.find(u => u._id === userId)

            if (user) {
                if (user.unreadcount) {
                    user.unreadcount.model_unread_message = 0
                }

                user.user_unread_message = 0
            }

            state.currentPage = parseInt(state.currentPage, 10)
            state.isLoading = false
            state.originalUserList = state.userList
        },
        setMoreMessages: (state, action) => {
            const userId = action.payload.user_id
            const incomingMessages = action.payload.data.messages || []

            const existingMessages =
                state.newChatMessage[userId]?.messages || []

            // Create a Set of existing message IDs
            const existingMessageIds = new Set(
                existingMessages.map(msg => msg._id)
            )

            // Filter only new messages
            const uniqueNewMessages = incomingMessages.filter(
                msg => !existingMessageIds.has(msg._id)
            )
            const allMessages = [...uniqueNewMessages, ...existingMessages]

            return {
                ...state,
                newChatMessage: {
                    ...state.newChatMessage,
                    [userId]: {
                        messages: allMessages,
                        totalMessagesPage: action.payload.data.totalPages,
                        currentMessagesPage: action.payload.data.currentPage,
                        isMoreMessageLoading: false,
                        shouldLoadMoreMessages:
                            action.payload.data.shouldLoadMoreMessages
                    }
                }
            }
        },
        addNewMessageInEnd: (state, action) => {
            const receiveData = action.payload.data
            const user_id = action.payload.user_id

            if (!state.newChatMessage || Array.isArray(state.newChatMessage)) {
                state.newChatMessage = []
            }

            let messages = state.newChatMessage[user_id]
                ? state.newChatMessage[user_id].messages
                : []

            // Find the message by old_message_id
            let existMessage = []
            let message_id = receiveData.old_message_id
            if (message_id) {
                existMessage = messages ? messages.filter((msg) => msg._id === receiveData.old_message_id) : []
            }

            // Helper function to group messages by user_id
            let updatedMessages = [receiveData]
            const groupMessagesByUserId = (messagesArray) => {
                return messagesArray.reduce((acc, msg) => {
                    const otherUserId = msg.senderId === user_id ? msg.senderId : msg.receiverId
                    // Check if either senderId or receiverId is already present in the accumulator
                    const userMessages = acc[otherUserId] ? acc[otherUserId].messages : []
                    if (!userMessages) {
                        acc[otherUserId].message = []
                    }
                    // Add the message to both sender's and receiver's message list
                    let isMessageExist = false
                    if (_.isEmpty(msg.uniqueId) === false && _.isEmpty(userMessages) === false) {
                        isMessageExist = acc[otherUserId].messages.some(obj => obj.uniqueId === msg.uniqueId)
                    }
                    if (isMessageExist === false && _.isEmpty(receiveData) === false) {
                        acc[otherUserId].messages.push(msg)
                    }
                    return acc[otherUserId] ? acc[otherUserId].messages : []
                }, { ...state.newChatMessage })
            }

            // Find the message by _id within the user's message array
            let message = messages ? messages.filter((msg) => msg._id === receiveData._id) : []
            // Update message if processing is true
            if (message.length > 0 && message[0].processing === true && receiveData.processing === false) {
                let copyMessage = state.newChatMessage[user_id].messages || []
                const index = copyMessage.findIndex((msg) => msg._id === receiveData._id)
                if (index > -1) {
                    copyMessage.splice(index, 1)
                }
                updatedMessages = [receiveData]
            }

            // Update message while message unlock by model
            if (existMessage.length > 0) {
                let copyMessage = state.newChatMessage[user_id].messages || []
                const index = copyMessage.findIndex((msg) => msg._id === receiveData.old_message_id)
                if (index > -1) {
                    copyMessage.splice(index, 1)
                }
                updatedMessages = [receiveData]
            }

            // If processing is false, don't update the messages
            if (message.length > 0) {
                let copyMessage = state.newChatMessage[user_id].messages || []
                const index = copyMessage.findIndex((msg) => msg._id === receiveData._id)
                if (index > -1) {
                    copyMessage.splice(index, 1)
                }
                updatedMessages = [receiveData]
            }
            // 🔥 Redux Toolkit replacement for RETURN
            state.newChatMessage[user_id] = {
                messages: groupMessagesByUserId(updatedMessages),
                totalMessagesPage: state.newChatMessage[user_id]
                    ? state.newChatMessage[user_id].totalMessagesPage
                    : 0,
                currentMessagesPage: state.newChatMessage[user_id]
                    ? state.newChatMessage[user_id].currentMessagesPage
                    : 0,
                shouldLoadMoreMessages: state.newChatMessage[user_id]
                    ? state.newChatMessage[user_id].shouldLoadMoreMessages
                    : false
            }
        },
        updateUserLastMessage: (state, action) => {
            const { user_id, type, message, isAdmin, isMassMessage, domain, admin } = action.payload

            // Update last message content
            state.userList.forEach(user => {
                if (user._id === user_id) {
                    user.last_message = message
                        ? message
                        : isAdmin
                            ? `You sent a ${type}`
                            : `${user.name} sent a ${type}`

                    user.user_last_message = message
                        ? message
                        : isAdmin
                            ? `${user.name} sent a ${type}`
                            : `You sent a ${type}`

                    user.last_message_time = new Date().toISOString()
                }
            })

            // Sort user list
            if (isMassMessage === false) {
                state.userList.sort((a, b) => {

                    // Domain priority for non-admin
                    if (admin === false) {
                        const aIsCurrentDomain = a.domain === domain ? 1 : 0
                        const bIsCurrentDomain = b.domain === domain ? 1 : 0

                        if (aIsCurrentDomain !== bIsCurrentDomain) {
                            return bIsCurrentDomain - aIsCurrentDomain
                        }
                    }

                    // Sort by latest message time
                    return new Date(b.last_message_time) - new Date(a.last_message_time)
                })
            }

        },
        updateMessageAction: (state, action) => {
            const userId = action.payload.user_id

            // Ensure container exists
            if (!state.newChatMessage[userId]) {
                state.newChatMessage[userId] = {
                    messages: [],
                    totalMessagesPage: 0,
                    currentMessagesPage: 0,
                    shouldLoadMoreMessages: false
                }
            }

            // 🔥 ALWAYS use the draft directly
            const messages = state.newChatMessage[userId].messages

            for (let index = 0; index < messages.length; index++) {
                let id = action.payload.data._id?.toString()

                if (action.payload.sendingId) {
                    id = action.payload.sendingId
                }

                if (messages[index]._id === id) {
                    messages[index] = action.payload.data
                    break
                }
            }

        },
        filterUsersByTab: (state, action) => {
            const tab = action.payload
            if (tab === 'Unread') {
                state.userList = state.originalUserList.filter(
                    user => Number(user.user_unread_message || 0) > 0
                )
            } else if (tab === 'Read') {
                state.userList = state.originalUserList.filter(
                    user => Number(user.user_unread_message || 0) === 0
                )
            } else {
                state.userList = state.originalUserList
            }
        },
        updateUnreadMessageCountInUserList: (state, action) => {
            const userId = action.payload.userId
            const isAdmin = action.payload.isAdmin
            const updatedUserList = state.userList.map(user => {
                if (user._id === userId) {
                    let updatedUser = { ...user }

                    if (isAdmin === true) {
                        updatedUser.unreadcount = {
                            model_unread_message: user.unreadcount.model_unread_message + 1
                        }
                    } else {
                        updatedUser.user_unread_message = user.user_unread_message + 1
                    }
                    return updatedUser
                }
                return user
            })

            state.userList = updatedUserList
            state.originalUserList = updatedUserList
        },
        updateUserList: (state, action) => {
            const currentDomain = action.payload.domain
            action.payload.data.sort((a, b) => {

                // Check if domain matches the current domain
                const aIsCurrentDomain = a.domain === currentDomain ? 1 : 0
                const bIsCurrentDomain = b.domain === currentDomain ? 1 : 0

                // If one of them is the current domain, prioritize it
                if (aIsCurrentDomain !== bIsCurrentDomain) {
                    return bIsCurrentDomain - aIsCurrentDomain
                }

                // Otherwise, sort by last_message_time
                return new Date(b.last_message_time) - new Date(a.last_message_time)
            })
            state.userList = action.payload.data
            state.originalUserList = action.payload.data
        },
        updateUserListForNonSubscribedUser: (state, action) => {
            const formattedUserList = action.payload.data?.map(user => ({
                ...user,
                redirectToModelProfile: true
            }))
            state.userList = formattedUserList
            state.originalUserList = formattedUserList
        },
        deleteSingleResendMassMessage: (state, action) => {
            const userId = action.payload.userId
            const udid = action.payload.udid
            let copyMessage = state.newChatMessage[userId] ? state.newChatMessage[userId].messages : []
            if (copyMessage.length > 0) {
                copyMessage = copyMessage.filter(message => message.udid !== udid && message.isLocked === 'locked')
            }
            state.newChatMessage[userId].messages = copyMessage
        },
        setIsMoreMessagesLoading: (state, action) => {
            const { user_id, isLoading } = action.payload
            state.newChatMessage[user_id].isMoreMessageLoading = isLoading
        },
        unlockContentDetail: (state, action) => {
            state.unlockPaymentData = action.payload
        },
        setUpdatedBalance: (state, action) => {
            state.updatedBalance = action.payload
        },
        setIsChatScreenOpen: (state, action) => {
            state.isChatScreenOpen = action.payload
        },
        setChatId: (state, action) => {
            state.selectedUserId = action.payload
        },
        setWebsiteId: (state, action) => {
            state.websiteId = action.payload
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload
        },
        setSelectedChatModelId: (state, action) => {
            state.selectedModelId = action.payload
        },
        clearChatTextInput: (state, action) => {
            state.clearChatInputText = action.payload
        },
        isChatScrollToBottom: (state, action) => {
            state.isChatScrollToBottom = action.payload
        },
        updateIsMessagesLoading: (state, action) => {
            state.isMessagesLoading = action.payload
        },
        setUnlockData: (state, action) => {
            state.unlockData = action.payload
        },
        incMessageId: (state, action) => {
            state.messageId = state.messageId + 1
        },
        deleteMessageAction: (state, action) => {
            const { id, user_id } = action.payload
            const messages = state.newChatMessage[user_id].messages
            const updatedMessages = messages.filter(message => message._id !== id)
            state.newChatMessage[user_id].messages = updatedMessages
        },
        toggleChatTipPopup: (state, action) => {
            state.showChatTipPopup = action.payload
        },
        setShowAddFundPopup: (state, action) => {
            state.showAddFundPopup = action.payload
        },
        setRemainAmount: (state, action) => {
            state.remainAmount = action.payload
        },
        showCloseButtonOnChatScreen: (state, action) => {
            state.showCloseButtonOnChatScreen = action.payload
        },
        setActiveTab: (state, action) => {
            state.activeTab = action.payload
        },
        resetChatData: () => initialState
    }
})

export const {
    updateChatMessage,
    toggleChatTipPopup,
    setLoading,
    setIsChatScreenOpen,
    setChatId,
    setWebsiteId,
    setUserList,
    setSelectedChatModelId,
    chatUserProfileInfo,
    clearChatTextInput,
    isChatScrollToBottom,
    updateIsMessagesLoading,
    setMessages,
    updateReadMessageCount,
    setUpdatedBalance,
    unlockContentDetail,
    setMoreMessages,
    setIsMoreMessagesLoading,
    addNewMessageInEnd,
    updateUserLastMessage,
    setUnlockData,
    updateMessageAction,
    filterUsersByTab,
    updateUnreadMessageCountInUserList,
    incMessageId,
    updateUserList,
    updateUserListForNonSubscribedUser,
    deleteMessageAction,
    setShowAddFundPopup,
    resetChatData,
    setRemainAmount,
    setUpdatedCryptoBalance,
    deleteSingleResendMassMessage,
    showCloseButtonOnChatScreen,
    setActiveTab
} = chatSlice.actions
export default chatSlice.reducer