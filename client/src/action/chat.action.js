import _ from 'lodash'
import {
    addNewMessageInEnd,
    chatUserProfileInfo,
    deleteMessageAction,
    setChatId,
    setIsChatScreenOpen,
    setIsMoreMessagesLoading,
    setLoading,
    setMessages,
    setMoreMessages,
    setSelectedChatModelId,
    setUserList,
    setWebsiteId,
    updateIsMessagesLoading,
    updateMessageAction,
    updateReadMessageCount,
    updateUserLastMessage
} from '../../store/slices/chatSlice'
import { api } from './base-url'
import store from '../../store'
import { setSweetAlert } from '../../store/slices/sweetAlertSlice'
import { ROLE_CONTENT_MANAGER, ROLE_MODEL, ROLE_USER } from '../lib/constant'
import { removePayPerMessageCredit, setUnreadCount, updateWalletAmount } from '../../store/slices/authSlice'
import { googleAnalyticsTrackEvent } from '../lib/google-analytics-event'

// get user list
export const getUserList = async (domain, data, dispatch) => {
    try {
        const { auth, chat } = store.getState()
        const isInfiniteScroll = _.get(data, 'isInfiniteScroll', false)
        if (isInfiniteScroll === false) {
            dispatch(setLoading())
        }
        const params = {
            email: data.email,
            domain: domain,
            requestFrom: 'FF'
        }

        const res = await api.get(`/v1/chat/get_model_list`, { params })
        if (chat.userList.length === 0 && res.data.data.length === 1) {
            const user = res.data.data[0]
            dispatch(setIsChatScreenOpen(true))
            dispatch(setChatId(user._id))
            dispatch(setWebsiteId(user.website_id))
        }

        const userCCBillStatus = auth.user.ccbillSubscriptionStatus || '0'
        if (userCCBillStatus !== '0') {
            // TODO: set pages and all other things
            dispatch(setUserList({ userList: res.data.data, isAdmin: auth.user.isAdmin, userMergedDomainCount: auth.user.userMergedDomainCount }))
        }

    } catch (error) {
        const message = _.get(error, 'response.data.message', 'Error occurred while getting user list')
        dispatch(setSweetAlert({ description: message }))
    }
}

// send message
export const sendTextMessage = async (data, callback, dispatch) => {
    try {
        if (data.domain && data.domain !== data.currentDomain) {
            data.domain = data.domain + '/api'
            data.isChatUniversal = true
        }
        const res = await api.post(`/v1/chat/send_message`, data)
        if (res.data.success === 1) {
            if (!_.isEmpty(res.data.data)) {
                if (res.data.data.wallet_balance !== false) {
                    dispatch(updateWalletAmount(res.data.data.wallet_balance))
                }
                dispatch(removePayPerMessageCredit())
                if (data.type === 'text') {
                    dispatch(updateMessageAction({ data: res.data.data, user_id: data.receiver, sendingId: data._id }))
                } else {
                    dispatch(addNewMessageInEnd({ data: res.data.data, user_id: data.receiver }))
                }
                callback()
                if (res.data.data.fromAdmin === false && res.data.data.is_pay_per_message === true) {
                    const transaction_id = res.data.data.transactionId + '-' + res.data.data.senderId
                    googleAnalyticsTrackEvent('purchase', transaction_id, res.data.data.amount, 'chat', 'pay per message', '')
                }
            }
        }
    } catch (error) {
        error.message = _.get(error, 'response.data.message', error.message)
        const allow_cascade = _.get(error.response.data.errors, 'cascade.allow_cascade', false)
        // delete text message if get any error while send new text message
        if (data.type === 'text') {
            dispatch(deleteMessageAction({ id: data._id, user_id: data.receiver }))
        }
        if (allow_cascade === false) {
            dispatch(setSweetAlert({ description: `Could not send Message: ${error.message}` }))
            return callback()
        }
        dispatch(setSweetAlert({ description: 'Could not send Message: Problem in card authorization please re-enter your card details or add new card.' }))
        callback()
    }
}

// Read message
export const readMessage = async (data, isAdmin, dispatch) => {
    try {
        const url = '/v1/chat/read_message_user'
        const response = await api.post(url, data)
        if (response && response.data.success === 1) {
            refreshMessageCount(data.currentDomain, dispatch)
            dispatch(updateReadMessageCount({ userId: data.userId }))
        }
    } catch (error) {
        const message = _.get(error, 'response.data.message', 'Error occurred while read message')
        dispatch(setSweetAlert({ description: message }))
    }
}

// get messages
export const getMessages = async (data, isAdmin, dispatch) => {
    const { pageNum } = data
    dispatch(updateIsMessagesLoading(true))
    let token = localStorage.getItem('AuthToken')
    if (isAdmin === undefined && token) {
        isAdmin = dispatch(getAdminValue(token))
    }
    dispatch(setChatId(data.selectedUserId))
    let url = '/v1/chat/get_messages'
    let params = {
        selected_user_id: data.selectedUserId,
        page_num: data.pageNum,
        domain: data.domain
    }

    if (data.currentDomain !== data.domain) {
        url = '/v1/chat/universal-chat/get-user-message'
        params = {
            email: data.email,
            domain: data.domain,
            page_num: data.pageNum,
        }
    }

    const res = await api.get(url, { params })
    if (res) {
        const response = res.data
        const shouldHideInChat = _.get(response, 'data.should_hide_in_chat', false)
        if (shouldHideInChat === true) {
            dispatch(updateIsMessagesLoading(false))
            return
        }
        const promotionDetails = _.get(response, 'data.promotionDetails', {})
        if (!_.isEmpty(promotionDetails) && data.selectedUserId) {
            response.data.promotionDetails = { [data.selectedUserId]: promotionDetails }
        }
        dispatch(setMessages({ data: response.data, user_id: data.userId }))
        let readMessageData = {
            userId: data.selectedUserId,
            domain: data.domain,
            email: data.email,
            currentDomain: data.currentDomain
        }

        if (isAdmin === true) {
            readMessageData.modelId = data.selectedModelId
        }

        if ([ROLE_MODEL, ROLE_CONTENT_MANAGER, ROLE_USER].includes(data.role) && data.ccbillSubscriptionStatus !== '0') {
            readMessage(readMessageData, isAdmin, dispatch)
        }
        dispatch(updateIsMessagesLoading(false))
        const chatList = document.getElementById('message-list')
        if (pageNum === 1 && chatList) {
            chatList.scrollTop = chatList.scrollHeight
        }
    }
}

export const refreshMessageCount = async (domain, dispatch) => {
    const params = {
        domain: domain
    }
    const response = await api.get(`/v1/chat/get_unread_count`, { params })
    if (response && response.data.success === 1) {
        dispatch(setUnreadCount(response.data.data))
    }
}

export const loadMoreMessages = async (data, isAdmin, dispatch) => {
    try {
        dispatch(setIsMoreMessagesLoading({ isLoading: true, user_id: data.userId }))
        let token = localStorage.getItem('AuthToken')
        // if (isAdmin === undefined && token) {
        //     isAdmin = dispatch(getAdminValue(token))
        // }
        // const currentUrl = window.location.hostname
        let userUrl = '/v1/chat/get_messages'
        const params = {
            selected_user_id: data.userId,
            page_num: data.pageNum,
            domain: data.domain
        }

        // if (currentUrl !== data.domain) {
        //     const encodedEmail = encodeURIComponent(data.email)
        //     userUrl = `/api/universal-chat/get-user-message?domain=${data.domain}&email=${encodedEmail}&page_num=${data.pageNum}`
        // }
        // let url
        // if (isAdmin === true) {
        //     url = BASE_URL + `/api/chat/get_messages_admin?selected_user_id=${data.userId}&selected_model_id=${data.modelId}&page_num=${data.pageNum}`
        // } else {
        //     url = BASE_URL + userUrl
        // }

        const res = await api.get(userUrl, { params })
        const response = res.data
        dispatch(setMoreMessages({ data: response.data, user_id: data.userId }))
        return
    } catch (error) {
        console.log(error)
        const message = _.get(error, 'response.data.message', 'There was a problem loading messages.')
        const payload = { description: message }
        dispatch(setSweetAlert(payload))
        dispatch(setIsMoreMessagesLoading(false, data.userId))
        return
    }
}

export const chatUserProfileInfoAction = async (domain, userId, dispatch) => {
    if (userId) {
        if (window.skipLookup[userId] !== true) {
            window.skipLookup[userId] = true
            const params = {
                user_id: userId,
                domain: domain
            }

            const response = await api.get(`/v1/chat/get_user_details`, { params })
            if (response) {
                dispatch(chatUserProfileInfo(response.data))
            }
        }
    }
}

export const setSelectedUserId = (id, router, website_id = '') => dispatch => {
    const { chat, auth } = store.getState()
    if (router) {
        dispatch(setChatId(id))
        dispatch(setWebsiteId(website_id))
        dispatch(setIsChatScreenOpen(true))
        if ((id !== '' && auth.user.isAdmin) || (!auth.user.isAdmin && website_id !== '')) {
            router.push(`/private-chat/${auth.user.isAdmin ? id : website_id}?name=${auth.domain}`)
        }
    }
    if (chat.userInfo && !chat.userProfileInfo[id]) {
        dispatch(chatUserProfileInfoAction(id))
    }
}

export const setSelectedChatId = (id, router, website_id = '') => dispatch => {
    const state = store.getState()

    if (state.auth.isAdmin === true) {
        dispatch(setSelectedChatModelId(state.auth.appSettings.model_id))
        dispatch(setChatId(id))
        if (router) {
            router.push(`/private-chat/${id}/name=${state.auth.domain}`)
        }
    } else {
        dispatch(setChatId(id))
        dispatch(setWebsiteId(website_id))
        if (router) {
            router.push(`/private-chat/${website_id}/name=${state.auth.domain}`)
        }
    }
}

export const updateUsersLastMessage = data => dispatch => {
    const { message } = data
    if (message && (message.includes('<user_name>') || message.includes('<model_name>'))) {
        const { chat } = store.getState()
        const { selectedUserId, selectedModelId } = chat
        const userId = (selectedUserId && selectedModelId && selectedUserId === selectedModelId)
            ? selectedUserId
            : data.user_id
        const user = chat.userList.find(obj => obj._id === userId)
        if (_.isEmpty(user) === false) {
            const { name } = user
            data.message = message.replace(/<user_name>|<model_name>/g, name)
        }
    }
    dispatch(updateUserLastMessage(data))
}

export const sendMessage = async (data) => {
    try {
        const { chat, auth } = store.getState()
        let domain = auth.user.domain
        let isUniversalChat = false
        const userList = chat.userList
        if (userList?.length > 1 && !auth.isAdmin) {
            const selectedUser = userList.find(user => user._id === chat.selectedUserId)
            domain = selectedUser.domain
            isUniversalChat = selectedUser.domain !== auth.user.domain
        }
        // url = `v1/api/universal-chat/send-message-api?domain=${domain}&email=${auth.user.email}`
        const url = '/v1/message/send-message'
        const params = {
            domain: domain,
            email: auth.user.email,
            isUniversalChat: isUniversalChat
        }

        const res = await api.post(url, data, { params })
        return res.data.data
    } catch (error) {
        const res = { isError: true, error }
        return res
    }
}

