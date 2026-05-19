import _ from 'lodash'
import { getHostName } from '../helper/index.js'
import { response } from 'express'

let ioReference = null
let isSocketEventInitiated = false
let socketToUserLookup = {}
let onlineUserLookup = {}
let adminInUserChat = {}
let streamData = {}

export const socket = async (socket, io, Redis) => {
    ioReference = io
    if (isSocketEventInitiated === false) {
        loadSocketEvent()
        isSocketEventInitiated = true
    }
    let socket_id = socket.id
    let userCacheKey = ''
    const subscriber = Redis.getSubscriber()
    // console.log(subscriber)
    // socket.on('MODEL_ONLINE', async () => {
    //     const modelDomain = getHostName()
    //     if (subscriber) {
    //         subscriber.subscribe(modelDomain, async (message) => {
    //             const parsedMessage = JSON.parse(message)
    //             const { event, data } = parsedMessage
    //             if (event === 'DISCONNECT') {
    //                 const user = await Redis.instance.hGetAll(data.userCacheKey)
    //                 const userId = user.userIdOnDestination
    //                 delete socketToUserLookup[userId]
    //                 await Redis.instance.del(data.userCacheKey)
    //                 if (onlineUserLookup[userId] !== undefined) {
    //                     let userIsOfflineOnCurrentServer = true
    //                     {   /* onlineUserLookup holds an object like this
    //                     {
    //                         '673c6b4ca8f04136a42d1596': '673c6b4ca8f04136a42d1596', // <- user online on other server [user_id:user_id]
    //                         'HHg1n-QyjaFu6wyOAAAL': '673c6b4ca8f04136a42d1596' // <- user on current server [socket_id:user_id]
    //                     }
    //                     */
    //                         // Check whether user is online on current server or not
    //                         for (const [key, value] of Object.entries(onlineUserLookup)) {
    //                             if (value === userId && value !== key) {
    //                                 userIsOfflineOnCurrentServer = false
    //                             }
    //                         }
    //                     }
    //                     let userIsOfflineOnOtherServers = true
    //                     { // Check whether user is online on other server or not
    //                         const { userCacheKey } = data
    //                         if (userCacheKey) {
    //                             const cacheKeyChunks = userCacheKey.split(':')
    //                             const userQuery = cacheKeyChunks.slice(0, cacheKeyChunks.length - 1).join(':') + ':*'
    //                             const onlineUserCacheKeys = await Redis.instance.keys(userQuery)
    //                             if (onlineUserCacheKeys && onlineUserCacheKeys.length > 0) {
    //                                 userIsOfflineOnOtherServers = false
    //                             }
    //                         }
    //                     }
    //                     if (userIsOfflineOnCurrentServer && userIsOfflineOnOtherServers) {
    //                         updateUserLastSeen(onlineUserLookup[userId])
    //                         ioReference.emit('USER_OFFLINE', onlineUserLookup[userId])
    //                     }
    //                     delete onlineUserLookup[userId]
    //                 }
    //                 return
    //             }

    //             const { email, userDomain } = data
    //             const user = await User.findOne({ email: email }, '_id pay_per_message_credit')

    //             if (user) {
    //                 const cacheKey = `universalUsers:${modelDomain}:${email}:${userDomain}`
    //                 const currentUserId = user._id.toString()
    //                 const userCache = await Redis.instance.hGetAll(cacheKey)
    //                 if (userCache?.userIdOnSource) {
    //                     userCache.userIdOnDestination = currentUserId
    //                     // Update user cache, expire key will reset automatically to 2h
    //                     Redis.instance.hSet(cacheKey, userCache)
    //                 }
    //                 if (event === 'USER_ONLINE') {
    //                     if (currentUserId !== null) {
    //                         onlineUserLookup[currentUserId] = currentUserId
    //                         ioReference.emit('ONLINE_USER_LIST', Object.values(onlineUserLookup))
    //                     }
    //                 } else if (event === 'JOIN_ROOM') {
    //                     socketToUserLookup[currentUserId] = currentUserId
    //                     socket.join(currentUserId)
    //                 } else if (event === 'IS_ENABLE_PAY_PER_MESSAGE') {
    //                     const isPayPerMessageEnabled = getAppSettings('is_pay_per_message_enabled')
    //                     const payPerMessageAmount = getAppSettings('pay_per_message_amount')
    //                     const payPerMessageCredit = user.pay_per_message_credit

    //                     const object = {
    //                         event: 'PAY_PER_MESSAGE_STATUS',
    //                         data: { isPayPerMessageEnabled, payPerMessageAmount, payPerMessageCredit }
    //                     }
    //                     Redis.publishToChannel(userDomain, object)
    //                 }
    //             }
    //         })
    //     }

    //     // Get live users that are chatting with model from other model's site
    //     const cacheKey = `universalUsers:${modelDomain}:*:*`
    //     const userCacheKeys = await Redis.instance.keys(cacheKey)
    //     userCacheKeys.forEach(async (cacheKey) => {
    //         const cachedUser = await Redis.instance.hGetAll(cacheKey)
    //         if (cachedUser?.userIdOnSource) {
    //             const cacheKeyChunks = cacheKey.split(':')
    //             const email = cacheKeyChunks[cacheKeyChunks.length - 2]
    //             const user = await User.findOne({ email: email }, '_id')
    //             const userId = user?._id.toString()
    //             if (userId) {
    //                 // 'USER_ONLINE'
    //                 onlineUserLookup[userId] = userId
    //                 ioReference.emit('ONLINE_USER_LIST', Object.values(onlineUserLookup))
    //                 // 'JOIN_ROOM'
    //                 socketToUserLookup[socket_id] = userId
    //                 socket.join(userId)
    //                 if (!cachedUser?.userIdOnDestination) {
    //                     cachedUser.userIdOnDestination = userId
    //                     // update user cache, expire key will reset automatically to 2h
    //                     Redis.instance.hSet(cacheKey, cachedUser)
    //                 }
    //             }
    //         }
    //     })
    // })

    socket.on('USER_ONLINE', (data) => {
        const { userId, email, isUniversal, channel: modelDomain } = data
        if (userId !== null) {
            if (isUniversal) {
                const userDomain = new URL(process.env.FF_CLIENT_DOMAIN).hostname || 'localhost'

                const object = {
                    event: 'USER_ONLINE',
                    data: { email, userDomain }
                }
                const userDetails = {
                    userIdOnSource: userId
                }
                userCacheKey = `universalUsers:${modelDomain}:${email}:${userDomain}`
                Redis.getClient().hSet(userCacheKey, userDetails)
                    .then(() => {
                        // Expire cache after 2h
                        Redis.getClient().expire(userCacheKey, 7200)
                    })
                Redis.publishToChannel(modelDomain, object)
                onlineUserLookup[socket_id] = userId
                ioReference.emit('ONLINE_USER_LIST', Object.values(onlineUserLookup))
            }
        }
    })

    if (subscriber) {
        const userDomain = new URL(process.env.FF_CLIENT_DOMAIN).hostname || 'localhost'
        subscriber.subscribe(userDomain, (response) => {
            const parsedResponse = JSON.parse(response)
            const { event, data } = parsedResponse
            if (event === 'SEND_MESSAGE_RES') {
                socket.emit(event, data)
            } else if (event === 'MODEL_SEND_A_MESSAGE') {
                if (data.userID === onlineUserLookup[socket_id]) {
                    socket.emit('MESSAGE_RECEIVE', data)
                }
            } else if (event === 'STREAM_STARTED_IN_OTHER_WEBSITE') {
                const { userId } = data
                if (userId === onlineUserLookup[socket_id]) {
                    socket.emit(event, data)
                }
            } else if (event === 'PAY_PER_MESSAGE_STATUS') {
                socket.emit('PAY_PER_MESSAGE_STATUS', data)
            } else if (event && data && data.userID && data.userID === onlineUserLookup[socket_id]) {
                socket.emit(event, data)
            }
        })

        subscriber.subscribe('online_users', (response) => {
            const parsedResponse = JSON.parse(response)
            const { userId, isRemove } = parsedResponse
            if (isRemove) {
                socket.emit('REMOVE_MODEL_FROM_ONLINE', userId)
            } else {
                socket.emit('ONLINE_MODEL_LIST', userId)
            }
        })
    }

    socket.on('IS_ENABLE_PAY_PER_MESSAGE', (data) => {
        const { isUniversal, modelDomain, email, currentDomain } = data
        const userDomain = new URL(process.env.FF_CLIENT_DOMAIN).hostname || 'localhost'
        if (isUniversal) {
            const object = {
                event: 'IS_ENABLE_PAY_PER_MESSAGE',
                source: userDomain,
                email: email,
                currentDomain: currentDomain,
                modelDomain: modelDomain

            }
            const updatedModelDomain = userDomain + '/api'
            Redis.publishToChannel(updatedModelDomain, object)
        }
    })

    socket.on('GET_ONLINE_MODEL_LIST', async () => {
        const data = await Redis.getClient().keys('online_users:*')
        const userIds = data.map(key =>
            key.replace('online_users:', '')
        )

        ioReference.emit('ONLINE_MODEL_LIST', Object.values(userIds))
    })

    socket.on('JOIN_ROOM', (userData) => {
        if (userData?.isUniversal && !userData?.isAdmin) {
            const object = {
                event: 'JOIN_ROOM',
                data: {
                    email: userData.email,
                    roomId: userData.roomId,
                    userId: userData.userId
                }
            }
            Redis.publishToChannel(userData?.channel, object)
        }
        socketToUserLookup[socket_id] = userData.userId
        socket.join(userData.roomId)
    })

    socket.on('LEAVE_ROOM', (userData) => {
        delete socketToUserLookup[socket_id]
        delete adminInUserChat[socket_id]
        socket.leave(userData.roomId)
    })

    socket.on('disconnect', async () => {
        const userId = onlineUserLookup[socket_id]
        let userIsOnlineOnOtherServer = false
        if (userId) {
            const userDomain = getHostName()
            // Check whether user is online on some other server or not
            const cacheQuery = `universalUsers:*:*:${userDomain}`
            let onlineUsersKeys = await Redis.getClient().keys(cacheQuery)
            for (let userKey of onlineUsersKeys) {
                const userDetails = await Redis.getClient().hGetAll(userKey)
                if (userDetails?.userIdOnDestination === userId) {
                    userIsOnlineOnOtherServer = true
                }
            }
        }

        if (userCacheKey) {
            const cacheKeyChunks = userCacheKey.split(':')
            const modelDomain = cacheKeyChunks[1]
            const data = {
                event: 'DISCONNECT',
                data: { userCacheKey }
            }
            userCacheKey = ''
            Redis.publishToChannel(modelDomain, data)
        }
        const host = getHostName()
        if (subscriber) {
            subscriber.unsubscribe(host)
        }

        if (socket_id === streamData.modelSocketId) {
            removeStreamData()
        }
        delete socketToUserLookup[socket_id]
        delete adminInUserChat[socket_id]
        if (onlineUserLookup[socket_id] !== undefined) {
            // updateUserLastSeen(onlineUserLookup[socket_id])
            if (!userIsOnlineOnOtherServer) {
                ioReference.emit('USER_OFFLINE', onlineUserLookup[socket_id])
            }
            delete onlineUserLookup[socket_id]
        }
    })

    socket.on('START_LIVE_STREAM', (userData) => {
        if (streamData.isLiveStreamStarted === true) {
            ioReference.to(userData.userId).emit('STREAM_ALREADY_STARTED')
        } else {
            streamData.isLiveStreamStarted = true
            streamData.tabToken = userData.tabToken
            streamData.modelSocketId = socket_id
            const streamWithUser = _.get(streamData, 'streamWithUser', false)
            if (streamWithUser === userData.userId) {
                ioReference.to(userData.userId).emit('LIVE_STARTED', streamData)
                const isStreamStarted = !_.isEmpty(streamData)
                sendLiveStreamStatusToLiveUniversalUsers(streamData, isStreamStarted)
            }
        }
    })

    socket.on('STOP_LIVE_STREAM', (userId) => {
        streamData.isLiveStreamStarted = false
        streamData.tabToken = null
        const streamWithUser = _.get(streamData, 'streamWithUser', false)
        if (streamWithUser === userId) {
            ioReference.to(userId).emit('LIVE_STARTED', streamData)
            sendLiveStreamStatusToLiveUniversalUsers(streamData, false)
        }
    })

    socket.on('CHECK_STREAM_STARTED', (userId) => {
        const streamWithUser = _.get(streamData, 'streamWithUser', false)
        if (streamWithUser === userId) {
            ioReference.to(userId).emit('LIVE_STARTED', streamData)
        }
    })

    socket.on('LEFT_STREAM', (userId) => {
        ioReference.to(userId).emit('USER_LEFT_STREAM')
    })

    socket.on('JOIN_STREAM', (userId) => {
        ioReference.to(userId).emit('USER_JOIN_STREAM')
    })

    socket.on('JOIN_GROUP_STREAM', (userData) => {
        const userDetail = {
            id: userData.userId,
            name: userData.name,
            socketArray: [socket_id],
            avatarUrl: userData.avatar,
            count: 1
        }
        const existUserIndex = groupLiveStreamJoinedUserData.findIndex((user) => user.id === userData.userId)
        if (userData.role !== 'model' && userData.role !== 'proxy_user' && userData.role !== 'live_stream_manager') {
            if (existUserIndex < 0) {
                groupLiveStreamJoinedUserData.push(userDetail)
            } else {
                groupLiveStreamJoinedUserData[existUserIndex].count = groupLiveStreamJoinedUserData[existUserIndex].count + 1
                groupLiveStreamJoinedUserData[existUserIndex].socketArray.push(socket_id)
            }
        }
        socket.join('GROUP_STREAM')
        ioReference.to('GROUP_STREAM').emit('USER_JOINED_GROUP_STREAM', streamData)
    })

    socket.on('ONLINE_USER', (tabTokenForGroupLiveStream) => {
        socket.join('ONLINE_SUBSCRIBED_USER')
        const enable_live_streaming = getAppSettings('enable_live_streaming')
        const enable_group_live_streaming = getAppSettings('enable_group_live_streaming')
        if (enable_live_streaming === true && enable_group_live_streaming === true) {
            const responseData = {
                streamData,
                tabTokenForGroupLiveStream
            }
            ioReference.to('ONLINE_SUBSCRIBED_USER').emit('GROUP_LIVE_STARTED', responseData)
        }
    })

    socket.on('GROUP_LIVE_STARTED', (tabToken) => {
        streamData.isLiveStreamStarted = true
        streamData.modelSocketId = socket_id
        streamData.tabToken = tabToken
        const responseData = {
            streamData,
            tabTokenForGroupLiveStream: 'All'
        }
        ioReference.to('ONLINE_SUBSCRIBED_USER').emit('GROUP_LIVE_STARTED', responseData)
    })

    socket.on('STOP_GROUP_LIVE_STREAM', () => {
        streamData.isLiveStreamStarted = false
        streamData.tabToken = null
        ioReference.to('ONLINE_SUBSCRIBED_USER').emit('GROUP_LIVE_STOPPED')
    })

    socket.on('CHECK_ONLINE_USER', () => {
        const clients = ioReference.sockets.adapter.rooms.get('ONLINE_SUBSCRIBED_USER')
        const numberOfClient = clients ? clients.size : 0
        socket.emit('ONLINE_MODEL', numberOfClient)
    })

    socket.on('CHECK_ONLINE_EVERY_USER', () => {
        const onlineUserRoom = ioReference.sockets.adapter.rooms.get('ONLINE_EVERY_USER')
        const numberOfUser = onlineUserRoom ? onlineUserRoom.size : 0
        socket.emit('ALL_USERS_COUNT', numberOfUser)
    })

    socket.on('LEAVE_GROUP_STREAM', () => {
        console.log('User leave GROUP_STREAM Room')
        socket.leave('GROUP_STREAM')
    })

    socket.on('ONLINE_EVERY_USER', () => {
        socket.join('ONLINE_EVERY_USER')
    })

    socket.on('GET_VIEWER', () => {
        const data = {
            count: groupLiveStreamJoinedUserData.length,
            userList: groupLiveStreamJoinedUserData
        }
        socket.emit('SET_VIEWER', data)
    })

    socket.on('LOGOUT_USER', () => {
        socket.leave('GROUP_STREAM')
        socket.leave('ONLINE_SUBSCRIBED_USER')
        socket.emit('LOGOUT_USER')
        socket.leave('ONLINE_EVERY_USER')
        if (onlineUserLookup[socket_id] !== undefined) {
            updateUserLastSeen(onlineUserLookup[socket_id])
            ioReference.emit('USER_OFFLINE', onlineUserLookup[socket_id])
            delete onlineUserLookup[socket_id]
        }
    })

    socket.on('BACK_FROM_STREAM', (tabToken) => {
        if (tabToken === streamData.tabToken) {
            removeStreamData()
            socket.emit('STOP_CAMERA_AUDIO')
        }
    })
    socket.on('ADMIN_IN_USER_CHAT', (data) => {
        adminInUserChat[socket_id] = data
    })
}

/**
 * Send message event to receiver user and if user not online send email to user.
 *
 * @param {string} user_id - Message receiver id
 * @param {string} event_name - Event name like MESSAGE_RECEIVE or UPDATE_MESSAGE
 * @param {object} object - Message data object
 * @param {string} channelId - Socket room id
 */
export const sendChatMessage = async (user_id, event_name, object, channelId) => {
    channelId = typeof channelId !== 'string' ? channelId.toString() : channelId
    let isUserInRoom = false
    if (ioReference) {
        const clients = ioReference.sockets.adapter.rooms.get(channelId)
        const numberOfClient = clients ? clients.size : 0
        if (numberOfClient > 0) {
            for (const clientSocketId of clients) {
                const clientSocketUserId = _.get(socketToUserLookup, clientSocketId, false)
                if (clientSocketUserId !== false && clientSocketUserId === channelId) {
                    isUserInRoom = true
                }
            }
        }

        ioReference.to(channelId).emit(event_name, object)

        const isMassMessage = _.get(object, 'isMassMessage', false)
        if (isMassMessage) {
            ioReference.emit('UPDATE_USER_LAST_MESSAGE', object)
        }

        let emailType = 'private-message'
        if (isMassMessage) {
            emailType = 'mass-message'
        }
    }
}

/**
 * Load join room and leave room events.
 */
function loadSocketEvent() {
    if (ioReference !== null) {
        ioReference.of('/').adapter.on('join-room', (room) => {
            if (room === 'ONLINE_SUBSCRIBED_USER') {
                const clients = ioReference.sockets.adapter.rooms.get('ONLINE_SUBSCRIBED_USER')
                const numberOfClient = clients ? clients.size : 0
                ioReference.emit('ONLINE_MODEL', numberOfClient)
            } else if (room === 'GROUP_STREAM') {
                const clients = ioReference.sockets.adapter.rooms.get('GROUP_STREAM')
                let numberOfClient = clients ? clients.size : 0
                numberOfClient = numberOfClient - 1
                const pastUserJoinedCount = _.get(streamData, 'joinedUserPeakCount', 0)
                if (pastUserJoinedCount < numberOfClient) {
                    streamData.joinedUserPeakCount = numberOfClient
                }
                const data = {
                    count: groupLiveStreamJoinedUserData.length,
                    userList: groupLiveStreamJoinedUserData
                }
                ioReference.emit('SET_VIEWER', data)
            } else if (room === 'ONLINE_EVERY_USER') {
                const clients = ioReference.sockets.adapter.rooms.get('ONLINE_EVERY_USER')
                const numberOfClient = clients ? clients.size : 0
                ioReference.emit('ALL_USERS_COUNT', numberOfClient)
            }
        })

        ioReference.of('/').adapter.on('leave-room', (room, id) => {
            if (room === 'ONLINE_SUBSCRIBED_USER') {
                const clients = ioReference.sockets.adapter.rooms.get('ONLINE_SUBSCRIBED_USER')
                const numberOfClient = clients ? clients.size : 0
                ioReference.emit('ONLINE_MODEL', numberOfClient)
            } else if (room === 'GROUP_STREAM') {
                const clients = ioReference.sockets.adapter.rooms.get('GROUP_STREAM')
                let numberOfClient = clients ? clients.size : 0
                numberOfClient = numberOfClient - 1
                groupLiveStreamJoinedUserData.forEach((user, i) => {
                    const index = user.socketArray.findIndex((socketId) => socketId === id)
                    if (index !== -1) {
                        user.socketArray.splice(index, 1)
                        groupLiveStreamJoinedUserData[i].count = user.count - 1
                    }
                })
                groupLiveStreamJoinedUserData = groupLiveStreamJoinedUserData.filter(user => user.count > 0)
                const data = {
                    count: numberOfClient,
                    userList: groupLiveStreamJoinedUserData
                }
                ioReference.emit('SET_VIEWER', data)
            } else if (room === 'ONLINE_EVERY_USER') {
                const clients = ioReference.sockets.adapter.rooms.get('ONLINE_EVERY_USER')
                const numberOfClient = clients ? clients.size : 0
                ioReference.emit('ALL_USERS_COUNT', numberOfClient)
            }
        })
    }
}
