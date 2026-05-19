'use client'
import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { getUserList, setSelectedChatId, setSelectedUserId } from '@/action/chat.action'
import { useParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { chatUserProfileInfo, setIsChatScreenOpen } from '../../../store/slices/chatSlice'
import socket from '@/lib/socket'
import _ from 'lodash'
import Loader from '@/components/common/Loader'
import { withPrivateRoute } from '@/components/layout/PrivateRoute'
import { ALLOW_ALL } from '@/lib/constant'
import FeedLayout from '@/app/feed/FeedLayout'

import ChatUserList from '@/app/private-chat/ChatUserList'
import ChatMessage from '@/app/private-chat/ChatMessage'

function ChatLayout(props) {
    const chat = useSelector(state => state.chat)
    const auth = useSelector(state => state.auth)
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const {
        selectedUserId,
        isChatScreenOpen,
        userList,
        searchedUsername,
        originalUserList,
        isLoading
    } = chat

    const [page, setPage] = useState(1)
    const [loadMoreUser, setLoadMoreUser] = useState(false)
    const [onlineUserList, setOnlineUserList] = useState([])
    const ccbillSubscriptionStatus = _.get(auth, 'user.ccbillSubscriptionStatus', '0')
    // const { website_url } = auth.appSettings
    const messageListRef = useRef(null)
    const domain = auth.domain
    const router = useRouter()
    const dispatch = useDispatch()
    const params = useParams()
    const id = params.id || null
    useEffect(() => {
        if (userList && userList.length === 0) {
            let data = {
                pageNum: chat.currentPage === 0 ? 1 : chat.currentPage,
                sortBy: chat.sortBy === '' ? 'last_message_time' : chat.sortBy,
                userName: searchedUsername,
                sortBySubscribers: chat.sortBySubscribers === '' ? 'all' : chat.sortBySubscribers,
                isFilter: true
            }
            if (auth.user.isAdmin === false) {
                data.email = auth.user.email
                data.universal_login = auth.user.universal_login
            }

            // if ((auth.user.isAdmin === true) || (!auth.user.isAdmin && ['1', '2'].includes(ccbillSubscriptionStatus))) {
            getUserList(domain, data, dispatch)
            // }
        }

    }, [])

    useEffect(() => {
        if (!auth.user.isAdmin && id) {
            const paramsId = Number(id)
            let userDetail = userList.find(obj =>
                obj.website_id === paramsId ||
                obj.domain === id ||
                obj.website_url === id
            )
            if (userDetail) {
                dispatch(setSelectedChatId(userDetail?._id, null, userDetail.website_id))
                dispatch(chatUserProfileInfo(userDetail))
            }
        }
    }, [userList])

    useEffect(() => {
        // Open chat screen directly for user, if there is only one model to chat with
        // if (!auth.user.isAdmin && userList && userList.length === 1) {
        //     dispatch(setSelectedChatId(userList[0]._id, null, userList[0].website_id))
        //     dispatch(setIsChatScreenOpen(true))
        // }
        if (auth.user && !auth.user.isAdmin && ccbillSubscriptionStatus !== '0' && userList?.length > 1) {
            userList.forEach(user => {
                const data = {
                    userId: auth.user._id,
                    channel: user.domain,
                    isUniversal: true,
                    email: auth.user.email
                }
                socket.emit('USER_ONLINE', data)
            })

        }
    }, [userList])

    useEffect(() => {
        if (!auth.user.isAdmin && userList?.length > 1) {
            const selectedUserDomain = userList.find(obj => obj._id === selectedUserId)
            if (selectedUserDomain && selectedUserDomain.domain !== auth.user.domain) {
                socket.on('SEND_MESSAGE_RES', (data) => {
                    if (data.type === 'text' && data.receiverId === selectedUserId) {
                        updateUsersLastMessage({ user_id: selectedUserId, message: data.message, type: data.type, isAdmin: false })
                    }
                    const objDiv = document.getElementById('message-list')
                    if (objDiv) {
                        objDiv.scrollTop = objDiv.scrollHeight
                    }

                    const updatedWalletBalance = _.get(data, 'wallet_balance', false)
                    if (updatedWalletBalance !== false) {
                        updateWalletAmount(updatedWalletBalance)
                    }
                    // TODO: Handle data/errors if needed
                })
            }
        }
    }, [chat.userList])

    const handleScroll = (e) => {
        e.preventDefault()
        if (chat.totalPages > page) {
            let winScroll = 0
            let height = 0

            // Use the event target to get scrollTop and height
            winScroll = e.target.scrollTop
            height = e.target.scrollHeight - e.target.clientHeight
            const scrolled = winScroll / height
            if (scrolled > 0.98) {
                setPage(props.chat.currentPage + 1)
            }
        }
    }

    useEffect(() => {
        document.body.style.overflowY = 'hidden'
        const el = document.getElementById('chat-list')
        if (el) {
            el.addEventListener('scroll', handleScroll)
        }

        return () => {
            document.body.style.overflowY = 'auto'
            if (el) {
                el.removeEventListener('scroll', handleScroll)
            }
        }
    })

    useEffect(() => {
        if (page > 1) {
            setLoadMoreUser(true)
            const fetchData = async () => {
                let data = {
                    pageNum: page,
                    sortBy: chat.sortBy === '' ? 'last_message_time' : chat.sortBy,
                    userName: searchedUsername,
                    sortBySubscribers: chat.sortBySubscribers === '' ? 'all' : chat.sortBySubscribers,
                    isInfiniteScroll: true
                }
                await getUserList(data)
                setLoadMoreUser(false)
            }
            fetchData()
        }
    }, [page])

    useEffect(() => {
        // updateChatInputHeight()

        if (id !== undefined) {
            if (auth.user.isAdmin && selectedUserId !== id) {
                dispatch(setSelectedUserId(id, null, ''))
                dispatch(setIsChatScreenOpen(true))
            }
            if (!auth.user.isAdmin) {
                const paramsId = Number(id)
                const userDetail = userList.find(obj =>
                    obj.website_id === paramsId ||
                    obj.domain === id ||
                    obj.website_url === id
                )
                const userId = userDetail?._id
                // here need to update to set open chat screen
                if (selectedUserId !== userId) {
                    dispatch(setSelectedChatId(userId, null, userDetail?.website_id || id))
                    dispatch(setIsChatScreenOpen(true))
                }
            }
        }

        if (id === undefined && auth.user.isAdmin) {
            dispatch(setSelectedUserId('', null, ''))
            dispatch(setIsChatScreenOpen(false))
        }

        if (id === undefined && !auth.user.isAdmin && userList.length > 1) {
            dispatch(setIsChatScreenOpen(false))
        }
    }, [selectedUserId, id])

    useEffect(() => {
        if (selectedUserId === '') {
            return
        }

        if (!auth.user.isAdmin && id === undefined && userList.length > 1) {
            return
        }

        dispatch(setIsChatScreenOpen(true))
    }, [selectedUserId, id, userList.length, auth.user.isAdmin])

    let showMessage = false
    if (props.requestFrom !== 'feed') {
        showMessage = auth.user.isAdmin ? _.isEmpty(id) !== true : selectedUserId
    }

    useEffect(() => {
        if (showMessage && chat.userList.length === 1) {
            router.replace(`/private-chat/1?name=${auth.user.domain}`)
        }
    }, [showMessage])

    useEffect(() => {
        if (auth.isAdmin) {
            socket.emit('MODEL_ONLINE', {})
            if (isChatScreenOpen === false) {
                sendModelOnlineEmailNotification('model-online')
            }
        }
    }, [])

    const loadSocketEvent = () => {
        socket.on('ONLINE_MODEL_LIST', (users) => {

            setOnlineUserList(prev => {
                // Normalize to array
                const usersId = Array.isArray(users) ? users : [users]

                // Merge + remove duplicates
                return Array.from(new Set([...prev, ...usersId]))
            })
        })
    }

    const redirectToChat = () => {
        let url = `/private-chat?name=${auth.user.domain}`
        if (chat.websiteId) {
            url = `/private-chat/${chat.websiteId}?name=${auth.user.domain}`
        }
        router.push(url)
    }

    useEffect(() => {
        socket.emit('GET_ONLINE_MODEL_LIST')
        loadSocketEvent()
    }, [userList])

    useEffect(() => {
        socket.on('REMOVE_MODEL_FROM_ONLINE', (userId) => {
            setOnlineUserList(prev =>
                prev.filter(id => id !== userId)
            )
        })
    }, [])
    const isModelListLoadingForUser = userList && originalUserList
    const shouldShowChatListOnMobile = auth.user.isAdmin
        ? !isChatScreenOpen
        : userList.length > 1 && id === null
    const shouldShowMessageOnMobile = auth.user.isAdmin
        ? isChatScreenOpen
        : userList.length === 1 || id !== null

    return (
        <div
            className={classNames('chat-layout-container p-0 bg-white overflow-hidden max-w-full', {
                'm-0': !auth.user.isAdmin && chat.userList && chat.userList.length !== 1
            })}
            style={{ height: 'calc(100vh - var(--navbar-height))' }}
        >
            {isLoading
                ? <div className='fixed inset-0 flex justify-center items-center'>
                    {/* full screen loader for user only  */}
                    <Loader
                        color='#000'
                        isLoading={true}
                        size={10} />
                </div>
                :
                <div
                    className={classNames(
                        'chat-layout-row w-full overflow-hidden grid grid-cols-1 min-[992px]:grid-cols-[450px_1fr]',
                        isPopupOpen ? 'chat-layout-row-popup-open' : 'chat-layout-row-popup-closed'
                    )}
                    style={{ height: 'calc(100dvh - var(--navbar-height))' }}
                >
                    <div
                        id='chat-list'
                        className={classNames(
                            'p-0 m-0 chat-list overflow-y-scroll overflow-x-hidden border-r max-[991px]:border-0 scrollbar-hide',
                            shouldShowChatListOnMobile ? 'block' : 'hidden',
                            'min-[992px]:block'
                        )}
                        style={{
                            borderRightColor: '#fff',
                            backgroundColor: '#fff',
                        }}
                    >
                        <ChatUserList
                            setIsPopupOpen={setIsPopupOpen}
                            setPage={setPage}
                            loadMoreUser={loadMoreUser}
                            tabs={props.tabs}
                            onlineUserList={onlineUserList}
                            requestFrom={props.requestFrom}
                        />
                    </div>
                    {showMessage &&
                        <div
                            id='message-list'
                            ref={messageListRef}
                            className={classNames(
                                `p-0 m-0 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide md:px-18 bg-[linear-gradient(58deg,rgba(242,227,247,1)_-50%,rgba(231,236,246,1)_100%)]`,
                                shouldShowMessageOnMobile ? 'block' : 'hidden',
                                'min-[992px]:block'
                            )}
                        >
                            <ChatMessage containerRef={messageListRef} setIsPopupOpen={setIsPopupOpen} />
                        </div>
                    }
                    {!showMessage && props.requestFrom === 'feed' &&
                        <>
                            {/* feed layout */}
                            <FeedLayout onlineUserList={onlineUserList} isChatScreenOpen={isChatScreenOpen} setIsPopupOpen={setIsPopupOpen} />

                        </>
                    }
                </div>
            }
        </div>
    )
}

export default withPrivateRoute(ChatLayout, ALLOW_ALL)
