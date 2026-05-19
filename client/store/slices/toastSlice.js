import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    toastType: 'copy',
    isCopyToClipboardToastOpen: false,
    // offset format => '100px', '200px', '500px' ... etc
    offset: ''
}

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    openCopyToClipboardToast: (state, action) => {
      state.isCopyToClipboardToastOpen = true,
      state.toastType = action.payload
    },
    closeCopyToClipboardToast: (state, action) => {
      state.isCopyToClipboardToastOpen = false,
      state.offset = ''
    },
  }
})

export const { openCopyToClipboardToast, closeCopyToClipboardToast } = toastSlice.actions

export default toastSlice.reducer