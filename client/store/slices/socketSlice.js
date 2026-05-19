import { createSlice } from '@reduxjs/toolkit'
import _ from 'lodash'

const initialState = {
    isSocketConnected: false,
    isSocketInitiallyConnected: false
}

export const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setSocketConnected: (state) => {
            state.isSocketConnected = true,
                state.isSocketInitiallyConnected = true
        },
        setSocketDisconnected: (state) => {
            state.isSocketConnected = false
        }
    }
})

export const { setSocketConnected, setSocketDisconnected } = socketSlice.actions
export default socketSlice.reducer