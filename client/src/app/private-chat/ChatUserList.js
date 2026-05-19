'use client'

import _ from 'lodash'
import { cn } from '@/lib/utils'
import moment from 'moment'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import { ROLE_USER, ROLE_LIVE_STREAM_MANAGER, ROLE_MODEL, ROLE_CONTENT_MANAGER } from '@/lib/constant'
import { getMessages, readMessage, setSelectedUserId } from '../../action/chat.action'
import { chatUserProfileInfo, clearChatTextInput, filterUsersByTab, isChatScrollToBottom, setActiveTab, setIsChatScreenOpen, showCloseButtonOnChatScreen, updateIsMessagesLoading } from '../../../store/slices/chatSlice'
import { Lock } from 'lucide-react'
import Loader from '../../components/common/Loader'
import LastMessage from './LastMessage'
import socket from '../../lib/socket'
import Button from '../../components/common/Button'
import { getCloudFrontAssetsUrl } from '@/lib/assets'
import { isMobileOnly } from 'react-device-detect'
import classNames from 'classnames'

// Styled components removed - migrated to Tailwind + globals.css

export default function ChatUserList(props) {
    const tabs = props.tabs ? props.tabs : ['All Messages', 'Read', 'Unread']
    const chat = useSelector(state => state.chat)
    const auth = useSelector(state => state.auth)
    const {
        hide_earnings
    } = auth.appSettings
    const role = _.get(auth, 'user.role', ROLE_USER)
    const userCCBillSubscriptionStatus = _.get(auth.user, 'ccbillSubscriptionStatus', '0')
    const {
        userList,
        isLoading,
        selectedUserId,
        newChatMessage,
        isMessagesLoading
    } = chat

    const dispatch = useDispatch()
    const pathname = usePathname()
    const router = useRouter()

    let hideEarnings = false
    if (role === 'content_manager' && hide_earnings) {
        hideEarnings = true
    }

    if (role === ROLE_LIVE_STREAM_MANAGER) {
        hideEarnings = true
    }

    // Scroll to bottom whenever messages change
    const scrollToBottom = () => {
        const objDiv = document.getElementById('message-list')
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight
        }
    }

    const redirectOnChatClick = (userId, website_id, domain) => {
        if (userCCBillSubscriptionStatus === '0') {
            router.push(`/model-profile/${domain}?name=${domain}`)
            return
        }
        if (userId === selectedUserId) return
        chat.activeTab === 'Unread' ? onTabChange('All Messages') : onTabChange(props.tabs && props.tabs.includes(chat.activeTab) ? 'All Messages' : chat.activeTab)
        dispatch(setSelectedUserId(userId, router, website_id))
        dispatch(clearChatTextInput(true))
        dispatch(setIsChatScreenOpen(true))
        dispatch(isChatScrollToBottom(true))
        if (props.requestFrom && props.requestFrom === 'feed') {
            dispatch(showCloseButtonOnChatScreen(true))
        }
        const messages = _.isEmpty(newChatMessage[userId]) === false ? newChatMessage[userId].messages : []
        const modelId = auth.appSettings.model_id
        const role = _.get(auth, 'user.role', ROLE_USER)
        if (messages.length > 0) {
            scrollToBottom()
            if ([ROLE_MODEL, ROLE_CONTENT_MANAGER, ROLE_USER].includes(role)) {
                const data = {
                    userId: userId,
                    modelId: modelId,
                    domain: auth.user.domain,
                    currentDomain: auth.user.domain
                }
                let userSubscriptionStatus = auth.user.ccbillSubscriptionStatus || '0'
                if (role === ROLE_USER && chat.userList.length > 1) {
                    const userDomain = chat.userList.find(obj => obj._id === userId)
                    data.domain = userDomain.domain
                    data.email = auth.user.email
                    userSubscriptionStatus = userDomain.ccbill_subscription_status || '0'
                }
                if (userSubscriptionStatus !== '0') {
                    readMessage(data, auth.user.isAdmin, dispatch)
                }
            }
            return
        }
        dispatch(updateIsMessagesLoading(true))

        let data = {
            userId: userId,
            selectedUserId: userId,
            selectedModelId: modelId,
            pageNum: 1,
            role: auth.user.role ? auth.user.role : ROLE_USER,
            ccbillSubscriptionStatus: auth.user.ccbillSubscriptionStatus || '0'
        }

        if (auth.user.isAdmin === false) {
            const userDomain = chat.userList.find(obj => obj._id === userId)
            data.domain = userDomain.domain
            data.email = auth.user.email
            data.currentDomain = auth.user.domain
            data.ccbillSubscriptionStatus = userDomain.ccbill_subscription_status || '0'
        }
        getMessages(data, auth.user.isAdmin, dispatch)
    }

    const path = pathname.split('/')[1]
    useEffect(() => {
        if (selectedUserId !== '' && selectedUserId !== undefined && [ROLE_MODEL, ROLE_CONTENT_MANAGER, ROLE_USER].includes(role)) {
            let data = { userId: selectedUserId, currentDomain: auth.user.domain }
            if (auth.user.isAdmin === true) {
                data.modelId = auth.appSettings.model_id || chat.selectedModelId
            }
            let userSubscriptionStatus = auth.user.ccbillSubscriptionStatus || '0'
            if (auth.user.isAdmin === false) {
                const selectedUserDomain = userList.find(user => user._id === selectedUserId)
                if (selectedUserDomain) {
                    data.domain = selectedUserDomain.domain
                    userSubscriptionStatus = selectedUserDomain.ccbill_subscription_status || '0'
                }
                data.email = auth.user.email
            }
            if (userSubscriptionStatus !== '0') {
                readMessage(data, auth.user.isAdmin, dispatch)
            }
        }
    }, [path])

    const onTabChange = (tab) => {
        dispatch(setActiveTab(tab))
        if (props.tabs) {
            return
        }
        dispatch(filterUsersByTab(tab))
    }

    useEffect(() => {
        dispatch(setActiveTab(props.requestFrom === 'feed' ? tabs[0] : chat.activeTab))
    }, [tabs])

    const handleRedirectToSubscriptionPage = (e) => {
        e.stopPropagation()
        router.push(`/subscription?name=${auth.user.domain}`)
    }

    return (
        <div className='relative'>
            <div className='bg-white text-black p-9 md:p-6 md:max-w-full !pb-24'>
                <div className='border-b'>
                    <div className='flex justify-between text-center text-sm pb-2 sticky top-0'>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={`
                                        text-base cursor-pointer
                                            ${chat.activeTab === tab
                                        ? 'text-[#000] font-normal'
                                        : 'text-[#a6a6a6]'}
                            `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                {(isLoading && props.loadMoreUser === false)
                    ?
                    <div className='pt-5 flex justify-center'>
                        <Loader
                            color='#000'
                            loading={true}
                            size='10' />
                    </div>
                    :
                    userList.length > 0 ? userList.map((user, i) => {
                        const ccbillSubscriptionStatus = _.get(user, 'ccbill_subscription_status', '0')
                        return (
                            <div
                                className={cn('relative user gap-3', {
                                    'chat-user-list-selected-user': selectedUserId === user._id,
                                    'disabled': isMessagesLoading,
                                    'opacity-80': isMessagesLoading
                                })}
                                key={i}>
                                <div
                                    style={{ opacity: isMessagesLoading ? '0.8' : '' }}
                                    className={cn('flex items-center py-2 p-1 relative min-h-[88px] text-sm cursor-pointer chat-user-list-message-row', {
                                        'border-b': i !== userList.length - 1
                                    })}
                                    onClick={() => redirectOnChatClick(user._id, user.website_id, user.domain)}
                                >
                                    <div className='relative h-12 w-12 shrink-0'>
                                        <Image
                                            src={user.avatarUrl || getCloudFrontAssetsUrl('faces/avatar.png')}
                                            alt='Avatar'
                                            fill
                                            className='rounded-full object-cover'
                                            draggable={false}
                                        />
                                        <span
                                            className={`absolute -top-0.5 -left-0.4 h-3 w-3 rounded-full
                                            ${props.onlineUserList.includes(user._id) ? 'bg-[#26a17b]' : 'bg-[#f7931a]'}`}
                                        />
                                    </div>
                                    <div className='flex-1 w-3/5 gap-3 px-3 py-4'>
                                        <p className='text-lg font-normal truncate text-black'>{user.name}</p>
                                        <div className='flex w-full justify-between items-center openSans min-w-0 flex-1' title={user.user_last_message}>
                                            <LastMessage lastMessage={user.user_last_message}></LastMessage>
                                        </div>
                                    </div>
                                    {userCCBillSubscriptionStatus !== '0' && (
                                        ccbillSubscriptionStatus === '0' ? (
                                            <div className='flex items-center gap-1 shrink-0' onClick={handleRedirectToSubscriptionPage}>
                                                <Lock size={16} className='text-[#ff1a9d]' />
                                                <span className='text-[13px] text-[#a6a6a6] font-medium whitespace-nowrap'>
                                                    Resubscribe <br /> for more
                                                </span>
                                            </div>
                                        ) : (
                                            user.user_unread_message ? (
                                                <span className='absolute right-2 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[#ff1a9d] text-white text-[10px] font-semibold leading-none'>
                                                    {user.user_unread_message > 99 ? '99+' : user.user_unread_message}
                                                </span>
                                            ) : null
                                        )
                                    )}
                                </div>
                            </div>
                        )
                    }) : <div className='text-center text-base pt-5'>No Records Found</div>
                }
                {props.loadMoreUser === true &&
                    <div className='text-center p-3'>
                        <Loader
                            color='#000'
                            isLoading={props.loadMoreUser}
                            size={10} />
                    </div>
                }
                {<div className={classNames('fixed bottom-0 right-0 left-0 w-full max-w-[450px] bg-white pb-4 p-4', {
                    'hidden md:block': props.requestFrom === 'feed'
                })}>
                    <Button classes='w-full px-3 py-5 bg-[#ff1a9d] font-semibold text-[#fff] rounded-lg text-sm tracking-[2px]' onClick={() => router.push('/')}>
                        FIND NEW CREATORS
                    </Button>
                </div>}
            </div>
        </div>
    )
}
