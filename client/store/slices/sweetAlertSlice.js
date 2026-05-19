import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    showAlert: false,
    description: '',
    onConfirmUrl: '',
    confirmDescription: '',
    showConfirmAlert: false,
    isLoading: false,
    showConfirmAlertInPageWrapper: false
}

export const sweetAlertSlice = createSlice({
    name: 'sweetAlert',
    initialState,
    reducers: {
        setSweetAlert: (state, action) => {
            state.showAlert = true
            state.description = action.payload.description === undefined ? state.description : action.payload.description
            state.onConfirmUrl = action.payload.onConfirmUrl === undefined ? state.onConfirmUrl : action.payload.onConfirmUrl
        },
        removeSweetAlert: (state, action) => {
            state.showAlert = false
            state.description = ''
            state.onConfirmUrl = ''
        },
        setConfirmSweetAlert: (state, action) => {
            state.isLoading = false
            state.showConfirmAlert = true
            state.confirmDescription = action.payload.description === undefined ? state.description : action.payload.description
            state.onConfirmUrl = action.payload.onConfirmUrl === undefined ? state.onConfirmUrl : action.payload.onConfirmUrl
        },
        removeConfirmSweetAlert: (state, action) => {
            state.isLoading = false
            state.showConfirmAlert = false
            state.confirmDescription = ''
            state.onConfirmUrl = ''
        },
        setAlertLoader: (state, action) => {
            state.isLoading = action.payload
        },
        setShowAlertOnPageWrapper: (state, action) => {
            state.showConfirmAlertInPageWrapper = action.payload
        }
    }
})

export const {
    setConfirmSweetAlert,
    removeConfirmSweetAlert,
    setAlertLoader,
    setSweetAlert,
    removeSweetAlert,
    setShowAlertOnPageWrapper
} = sweetAlertSlice.actions
export default sweetAlertSlice.reducer