import io from 'socket.io-client'
import _ from 'lodash'
import store from '../../store'
import { setSocketConnected, setSocketDisconnected } from '../../store/slices/socketSlice'
const BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL

const socket = io(BASE_URL, {
    transports: ['websocket'],
    autoConnect: true
})

socket.on('connect', () => {
    const state = store.getState()
    const userId = _.get(state, 'auth.user._id')
    const isAdmin = _.get(state, 'auth.user.isAdmin')
    const role = _.get(state, 'auth.user.role')

    if (userId && !isAdmin && role !== 'proxy_user') {
        socket.emit('USER_ONLINE', {
            userId: userId,
            email: state.auth.user.email
        })
    }

    console.log('Socket connected:', socket.id)
    store.dispatch(setSocketConnected())
})

socket.on('disconnect', () => {
    console.log('Socket disconnected')
    store.dispatch(setSocketDisconnected())
})


export default socket