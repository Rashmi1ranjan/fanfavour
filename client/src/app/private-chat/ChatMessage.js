'use client'

import _ from 'lodash'
import Image from 'next/image'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useRef, useState } from 'react'
import Linkify from 'react-linkify'
import { useParams, useRouter } from 'next/navigation'
import { ROLE_CONTENT_MANAGER, ROLE_MODEL, ROLE_USER } from '@/lib/constant'
import { getCloudFrontAssetsUrl } from '../../lib/assets'
import { getAllPromotionOffers } from '../../action/promotion.action'
import ChatInput from './ChatInput'
import Loader from '../../components/common/Loader'
import socket from '../../lib/socket'
import { getMessages, loadMoreMessages, readMessage } from '../../action/chat.action'
import { updateIsMessagesLoading, updateMessageAction } from '../../../store/slices/chatSlice'
import { mediaTypes } from '../../lib/constant'
import ChatMedia from './ChatMedia'
import UnlockMessage from './UnlockMessage'
import { X, ArrowLeft } from 'lucide-react'
import punycode from 'punycode'
import { cn } from '@/lib/utils'


export default function ChatMessage(props) {
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [stickyDate, setStickyDate] = useState('')

    const auth = useSelector(state => state.auth)
    const { isAdmin, _id } = auth.user
    const { enable_promotion, promotion_settings } = auth.appSettings
    const chat = useSelector(state => state.chat)
    const { isMessagesLoading, selectedUserId, userProfileInfo, newChatMessage, showCloseButtonOnChatScreen } = chat
    const promotion = useSelector(state => state.promotion)
    const role = _.get(auth, 'user.role', ROLE_USER)
    const selectedUserProfileDetails = userProfileInfo[selectedUserId]
    const selectedChatUser = useMemo(() => {
        if (chat.userList.length <= 1) return null

        return selectedUserProfileDetails || chat.userList.find(user => user._id === selectedUserId) || null
    }, [chat.userList, selectedUserId, selectedUserProfileDetails])
    const messageRefs = useRef({})
    const contentContainerRef = useRef(null)

    const { lockedContentPromotion } = promotion
    const isMassMessagePromotionActive = enable_promotion &&
        lockedContentPromotion &&
        lockedContentPromotion.type === 'LOCKED_CONTENT' &&
        ['EXCLUSIVE_CONTENT_AND_MASS_MESSAGE', 'MASS_MESSAGE'].includes(lockedContentPromotion.applicable_to) ? true : false
    const params = useParams()
    const id = params.id || null
    const user_id = isAdmin === true ? id : chat.selectedUserId
    const messages = _.isEmpty(newChatMessage[user_id]) === false ? newChatMessage[user_id].messages : []
    const [tempLoading, setTempLoading] = useState(messages.length === 0 ? true : false)
    const { currentMessagesPage = 0, shouldLoadMoreMessages = false, isMoreMessageLoading = false } = chat.newChatMessage[chat.selectedUserId] || {}
    let messageScrollPosition = 0
    const isFetchingRef = useRef(false)
    const currentSelectedIdRef = useRef(chat.selectedUserId)
    const userSubscriptionStatus = chat.userList.length > 1 ? _.get(selectedUserProfileDetails, 'ccbill_subscription_status', '0') : _.get(auth.user, 'ccbillSubscriptionStatus', '0')

    const dispatch = useDispatch()
    const router = useRouter()

    const loadOldMessages = async () => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        recordScrollPosition()
        const modelId = auth.appSettings.model_id
        let data = {
            userId: chat.selectedUserId,
            modelId: modelId,
            pageNum: currentMessagesPage + 1
        }
        if (auth.user.isAdmin === false) {
            const userDomain = chat.userList.find(user => user._id === chat.selectedUserId)
            if (userDomain) {
                data.domain = userDomain.domain
                data.email = auth.user.email
            }
        }
        await loadMoreMessages(data, auth.user.isAdmin, dispatch)
        restoreScrollPosition()
        isFetchingRef.current = false
    }

    const handleScroll = (e) => {
        if (isAdmin === true && id !== currentSelectedIdRef.current) return
        if (!shouldLoadMoreMessages) return

        let winScroll = e.target.scrollTop
        let height = e.target.scrollHeight - e.target.clientHeight
        if (height <= 0) return
        const scrolled = winScroll / height
        if (scrolled === 0) {
            loadOldMessages()
        }
    }

    useEffect(() => {
        const msgContainer = document.getElementById('message-list')
        if (!msgContainer) return
        msgContainer.addEventListener('scroll', handleScroll)
        return () => {
            msgContainer.removeEventListener('scroll', handleScroll)
        }
    }, [currentMessagesPage, selectedUserId, shouldLoadMoreMessages])

    useEffect(() => {
        currentSelectedIdRef.current = chat.selectedUserId
    }, [chat.selectedUserId])

    const recordScrollPosition = () => {
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            messageScrollPosition = objDiv.scrollHeight + 10
        }
    }

    const restoreScrollPosition = () => {
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            const currentScrollPosition = objDiv.scrollHeight - messageScrollPosition
            objDiv.scrollTop = currentScrollPosition
        }
    }

    useEffect(() => {
        // read unread message count for the single user
        if (auth.user.isAdmin === false && chat.userList.length === 1) {
            let data = { userId: selectedUserId, email: auth.user.email, currentDomain: auth.user.domain, domain: auth.user.domain }
            let userSubscriptionStatus = auth.user.ccbillSubscriptionStatus || '0'
            if (chat.userList.length > 1) {
                const userDomain = chat.userList.find(obj => obj._id === selectedUserId)
                if (userDomain) {
                    data.domain = userDomain.domain
                    data.email = userDomain.email
                    userSubscriptionStatus = userDomain.ccbill_subscription_status || '0'
                }
            }
            if ([ROLE_MODEL, ROLE_CONTENT_MANAGER, ROLE_USER].includes(role) && userSubscriptionStatus !== '0') {
                readMessage(data, auth.user.isAdmin, dispatch)
            }
        }
    }, [chat.selectedUserId])

    useEffect(() => {
        if ((!auth.isAdmin || id !== undefined) && isMessagesLoading === false) {
            if (chatMessages.length === 0) {
                dispatch(updateIsMessagesLoading(true))
                const userId = chat.selectedUserId || id
                const modelId = auth.appSettings.model_id
                let data = {
                    userId: auth.user.isAdmin === true ? userId : chat.selectedUserId,
                    selectedUserId: userId,
                    selectedModelId: modelId,
                    pageNum: 1,
                    role: auth.user.role ? auth.user.role : ROLE_USER,
                    ccbillSubscriptionStatus: auth.user.ccbillSubscriptionStatus
                }
                if (auth.user.isAdmin === false) {
                    const userDomain = chat.userList.find(obj => obj._id === userId)
                    if (userDomain) {
                        data.domain = userDomain.domain
                        data.email = auth.user.email
                        data.currentDomain = auth.user.domain
                        data.ccbillSubscriptionStatus = userDomain.ccbill_subscription_status || '0'
                    }
                }
                getMessages(data, auth.user.isAdmin, dispatch)
            }
        }
        dispatch(updateIsMessagesLoading(false))
        getAllPromotionOffers(auth.domain, dispatch)

        // Improves UX, when user come back again on chat page
        setTempLoading(false)
        setTimeout(() => scrollToBottom(), 100)
    }, [])

    const scrollToBottom = () => {
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight
        }
    }

    const chatMessages = useMemo(() => {
        const userId = chat.selectedUserId || id
        return _.isEmpty(newChatMessage[userId]) === false ? newChatMessage[userId].messages : []
    }, [messages, chat.selectedUserId])

    useEffect(() => {
        if (chat.isChatScrollToBottom === true) {
            scrollToBottom()
        }
    }, [messages, currentSelectedIdRef])

    const handleStickyDate = (container, containerTop) => {
        const elements = Object.values(messageRefs.current)

        let activeEl = null
        let maxTop = -Infinity

        for (let el of elements) {
            if (!el) continue

            const rect = el.getBoundingClientRect()
            const offset = rect.top - containerTop

            if (offset <= 0 && offset > maxTop) {
                maxTop = offset
                activeEl = el
            }
        }

        if (!activeEl) {
            activeEl = elements.find((el) => {
                if (!el) return false
                const rect = el.getBoundingClientRect()
                return rect.bottom > containerTop
            })
        }

        if (activeEl) {
            const date = activeEl.getAttribute('data-date')
            if (date) setStickyDate(date)
        }
    }

    useEffect(() => {
        const container = props.containerRef?.current
        if (!container) return

        const onScroll = () => {
            const containerTop = container.getBoundingClientRect().top
            handleStickyDate(container, containerTop)
        }

        container.addEventListener('scroll', onScroll)
        return () => container.removeEventListener('scroll', onScroll)
    }, [props.containerRef])

    // Monitor for container growth to auto-scroll
    useEffect(() => {
        const messageList = document.getElementById('message-list')
        const contentContainer = contentContainerRef.current
        if (!messageList || !contentContainer) return

        const resizeObserver = new ResizeObserver(() => {
            const isNearBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 400
            if (isNearBottom) {
                messageList.scrollTop = messageList.scrollHeight
            }
        })
        resizeObserver.observe(contentContainer)
        return () => resizeObserver.disconnect()
    }, [chat.selectedUserId])

    const redirectToFeed = () => {
        router.push(`/feed?name=${auth.user.domain}`)
    }

    const redirectToProfile = () => {
        let targetDomain = auth.user.domain
        if (chat.userList && chat.userList.length > 0) {
            const userDomain = chat.userList.find(obj => obj._id === chat.selectedUserId)
            if (userDomain && userDomain.domain) {
                targetDomain = userDomain.domain
            }
        }
        router.push(`/model-profile/${targetDomain}?name=${targetDomain}`)
    }

    const getDiscountPrice = (amount) => {
        let promotionPercentage = 0
        if (isMassMessagePromotionActive) promotionPercentage = lockedContentPromotion.discount_percentage

        if (promotionPercentage === 0) {
            return amount
        }
        return Math.ceil(amount * (100 - promotionPercentage) / 100)
    }

    const updateMessage = () => {
        socket.on('UPDATE_MESSAGE', (msg) => {
            const messageId = _.get(msg, 'messageId', false)
            if (messageId !== false) {
                msg._id = messageId
            }
            const userId = msg.fromAdmin === true ? msg.receiverId : msg.senderId
            updateMessageAction({ data: msg, user_id: userId })
        })
    }

    const componentDecorator = (href, text, key) => (
        <a
            href={href}
            key={key}
            target='_blank'
            rel='noopener noreferrer'
            className='underline cursor-pointer text-inherit'
        >
            {punycode.toASCII(text)}
        </a>
    )

    const copyToClipboard = (value) => {
        if (auth.user.isAdmin === true) {
            let offsetForToastMessage = ''
            if (window.innerWidth > 991) {
                const messageContainer = document.getElementById('message-list')
                const { x: messageContainerStartingPoint, width } = messageContainer.getBoundingClientRect()
                offsetForToastMessage = `${(width / 2 + messageContainerStartingPoint)}px`
            }
            if (navigator.clipboard) {
                navigator.clipboard.writeText(value)
                props.openCopyToClipboardToastWithOffset('copy', offsetForToastMessage)
            }
        }
    }

    // 🔹 Date label helper
    const getDateLabel = (date) => {
        const msgDate = moment(date)
        const today = moment().startOf('day')
        const yesterday = moment().subtract(1, 'day').startOf('day')

        if (msgDate.isSame(today, 'day')) return 'Today'
        if (msgDate.isSame(yesterday, 'day')) return 'Yesterday'

        if (today.diff(msgDate, 'days') < 7) {
            return msgDate.format('dddd')
        }

        return msgDate.format('DD MMMM YYYY')
    }

    const modelName = chat.userList.length > 1
        ? selectedChatUser?.name || auth.user.domain
        : chat.userList[0]?.name || auth.user.domain

    const modelAvatar = chat.userList.length > 1
        ? selectedChatUser?.profile || getCloudFrontAssetsUrl('faces/avatar.png')
        : auth.user.modelAvatarUrl || getCloudFrontAssetsUrl('faces/avatar.png')

    const handleMobileBack = () => {
        if (showCloseButtonOnChatScreen) {
            redirectToFeed()
        } else if (chat.userList.length > 1) {
            router.push(`/private-chat?name=${auth.user.domain}`)
        } else {
            redirectToFeed()
        }
    }

    return (
        <div className='relative flex min-h-full flex-col'>
            {isMessagesLoading || tempLoading
                ?
                <div className='text-center flex items-center justify-center h-full'>
                    <Loader classes='fixed top-1/2' color='#000' isLoading={true} size={10} />
                </div>
                :
                <>
                    {/* Mobile-only header with back arrow and model name */}
                    <div className='sticky top-0 z-10 flex items-center min-[992px]:hidden bg-white px-4 py-3 shadow-sm'>
                        <button onClick={handleMobileBack} className='cursor-pointer mr-3 flex items-center justify-center'>
                            <ArrowLeft className='w-6 h-6 text-black' />
                        </button>
                        <div className='relative w-8 h-8 flex-shrink-0 overflow-hidden rounded-full mr-2'>
                            <Image
                                src={modelAvatar}
                                alt={modelName || 'Avatar'}
                                fill
                                sizes='32px'
                                className='object-cover'
                            />
                        </div>
                        <span className='text-base font-semibold text-black truncate cursor-pointer' onClick={redirectToProfile}>{modelName}</span>
                    </div>
                    {/* Desktop sticky date header */}
                    <div className='sticky top-0 z-10 text-center py-2 text-md text-[#a6a6a6] hidden min-[992px]:block'>
                        {!['Today'].includes(stickyDate) && stickyDate}
                        {showCloseButtonOnChatScreen && <div className='absolute top-0 right-0 translate-x-16 translate-y-1 z-10 cursor-pointer text-[#fff] bg-[#000]/40 rounded-full p-0.5'
                            onClick={redirectToFeed}>
                            <X className='w-6 h-6 p-0.5' stroke='white' strokeWidth={4} />
                        </div>
                        }
                    </div>
                    <div
                        id="chat-messages-container"
                        ref={contentContainerRef}
                        className={cn(
                            'relative mx-5 mt-2 flex flex-1 flex-col justify-end'
                        )}
                    >

                        {isMoreMessageLoading &&
                            <div className='flex justify-center items-center'>
                                <Loader isLoading={isMoreMessageLoading} size={10} color='#000' />
                            </div>
                        }

                        {chatMessages.length > 0 && chatMessages.map((message, i) => {
                            const currentLabel = getDateLabel(message.created)
                            const prevLabel =
                                i > 0 ? getDateLabel(chatMessages[i - 1].created) : null

                            const showDateHeader = currentLabel !== prevLabel

                            const isSenderAdmin = isAdmin ? message.fromAdmin : !message.fromAdmin
                            const isTipsMessage = message.type === 'tips'
                            const tipMessage = message.tipMessage
                            const isTextMessage = message.type === 'text'
                            const isPreviewAvailable = mediaTypes.includes(message.type) && message.media_preview.length > 0
                            let chatMessage = message.message

                            if (message.type === 'GO_LIVE_STREAM' && !props.auth.isAdmin) {
                                return <></>
                            }

                            if (isAdmin === true && message.fromAdmin === false && message.processing === true) {
                                return <></>
                            }
                            if (isTipsMessage) {
                                const receiverName = _.get(selectedUserProfileDetails, 'name', isAdmin ? 'model' : 'user')
                                const tipSender = isAdmin ? receiverName : 'You'
                                const tipReceiver = isAdmin ? 'you' : receiverName
                                chatMessage = `${tipSender} just tipped ${tipReceiver} ${message.message}!`
                            }

                            if (message.type === 'GO_LIVE_STREAM') {
                                chatMessage = `Go Live Stream with ${selectedUserProfileDetails ? selectedUserProfileDetails.name : 'user'} has ended.`
                            }
                            if (message.type !== 'system') {
                                return (
                                    <>
                                        {(showDateHeader && ['Today', 'Yesterday'].includes(currentLabel) && !isMoreMessageLoading) && (
                                            <div className='text-center my-4 text-gray-400 text-md'>
                                                {currentLabel}
                                            </div>
                                        )}
                                        <div
                                            ref={(el) => (messageRefs.current[message._id] = el)}
                                            data-date={currentLabel}
                                            id={message._id}
                                            key={message._id}
                                            className={
                                                cn('p-1 rounded-[10px] max-w-[350px] w-[calc(100%-10px)]', {
                                                    'self-start p-0 relative': !isSenderAdmin,
                                                    'self-end relative max-w-[300px]': isSenderAdmin,
                                                    'locked': message.isLocked === 'locked'
                                                })
                                            }
                                        >
                                            <div
                                                className={cn('flex items-start gap-2', {
                                                    'relative rounded-[10px] p-[10px]': !isSenderAdmin,
                                                    'justify-end': isSenderAdmin
                                                })}
                                                style={!isSenderAdmin ? {
                                                    zIndex: isPopupOpen ? 'auto' : 1,
                                                    background: 'var(--chat-receiver-message-bg, transparent)'
                                                } : undefined}
                                            >
                                                {!isSenderAdmin &&
                                                    <div
                                                        className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full cursor-pointer'
                                                        onClick={redirectToProfile}
                                                    >
                                                        <Image
                                                            src={modelAvatar}
                                                            alt='Avatar'
                                                            fill
                                                            sizes='32px'
                                                            className='object-cover'
                                                        />
                                                    </div>
                                                }
                                                <div className='flex flex-col'>
                                                    {!_.isEmpty(chatMessage) && <>
                                                        <Linkify componentDecorator={componentDecorator}>
                                                            <div onClick={() => copyToClipboard(chatMessage)} className={`px-4 text-base openSans break-all whitespace-pre-wrap ${!isSenderAdmin && isTipsMessage ? 'message-tip' : (!isSenderAdmin ? 'bg-[#f1f1f1] text-[#000]' : 'bg-[#ff1a9d]/12 text-[#3c3b6e]')} ${(isTextMessage || isTipsMessage) ? 'rounded-lg py-3' : 'rounded-t-lg rounded-bl-none rounded-br-none py-4'}`}>
                                                                {chatMessage}
                                                                {isTipsMessage && !_.isEmpty(tipMessage) && <>
                                                                    <br />
                                                                    <span onClick={() => copyToClipboard(tipMessage)}> {tipMessage}</span>
                                                                </>}
                                                            </div>
                                                        </Linkify>
                                                    </>
                                                    }
                                                    {['photo', 'video', 'gallery'].includes(message.type) && (
                                                        <div className='relative inline-flex justify-end'>
                                                            {/* MEDIA */}
                                                            <ChatMedia
                                                                buttonBackgroundColor='#ff1a9d'
                                                                buttonFontColor='#fff'
                                                                unlockButtonBackgroundColor='#ff1a9d'
                                                                unlockButtonFontColor='#fff'
                                                                message={message}
                                                                setIsPopupOpen={setIsPopupOpen}
                                                                index={i}
                                                                isReceiver={!isSenderAdmin}
                                                                isPopupOpen={props.setIsPopupOpen}
                                                            />

                                                            {/* 🔒 UNLOCK OVERLAY (CENTERED) */}
                                                            {message.isLocked === 'locked' && !auth.user.isAdmin && (
                                                                <div className='absolute inset-0 flex items-center justify-center'>
                                                                    {['1', '2'].includes(userSubscriptionStatus) ?
                                                                        <UnlockMessage
                                                                            message={message}
                                                                            isPreviewAvailable={isPreviewAvailable}
                                                                            userSubscriptionStatus={userSubscriptionStatus}
                                                                        />
                                                                        :
                                                                        <div
                                                                            className='flex justify-center items-center px-8 py-3 m-0 text-sm w-max-content sm:max-w-full bg-[#000]/80 text-white rounded-lg font-medium cursor-pointer'
                                                                            onClick={() => router.push(`/subscription?name=${auth.user.domain}`)}
                                                                        >
                                                                            Subscribe to see content
                                                                        </div>
                                                                    }
                                                                </div>
                                                            )}

                                                        </div>
                                                    )}
                                                    <div className='flex justify-between items-baseline'>
                                                        {(message.isLocked === 'locked' || message.isLocked === 'unlocked') && isAdmin &&
                                                            role !== 'live_stream_manager' &&
                                                            <span className='text-[12px] mr-[10px]'>
                                                                <i className={
                                                                    cn('fas mr-2', {
                                                                        'fa-lock': message.isLocked === 'locked',
                                                                        'fa-unlock': message.isLocked === 'unlocked'
                                                                    })
                                                                }></i>
                                                                {message.promotion_price ?
                                                                    <>
                                                                        <span className={`line-through decoration-2 decoration-[${promotion_settings.price_strike_through_color}]`}>
                                                                            ${message.amount}
                                                                        </span> ${message.promotion_price}
                                                                    </> :
                                                                    <>
                                                                        {isMassMessagePromotionActive === true && message.isMassMessage === true && message.isLocked === 'locked' ?
                                                                            <>
                                                                                <span className={`line-through decoration-2 decoration-[${promotion_settings.price_strike_through_color}]`}>
                                                                                    ${message.amount}
                                                                                </span> ${getDiscountPrice(message.amount)}
                                                                            </>
                                                                            :
                                                                            <>${message.amount} </>
                                                                        }
                                                                    </>
                                                                }
                                                            </span>
                                                        }
                                                    </div>
                                                    <div className='flex w-full justify-end sm:justify-end'>
                                                        <span className='mt-2 text-sm text-[#a6a6a6] openSans'>
                                                            {moment(message.created).format('hh:mm A')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div >
                                    </>
                                )
                            }
                        })}
                    </div>
                    {
                        role !== 'live_stream_manager' &&
                        <ChatInput subscriptionStatus={userSubscriptionStatus} setIsPopupOpen={props.setIsPopupOpen} />
                    }
                </>
            }
        </div >
    )
}
