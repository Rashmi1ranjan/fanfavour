import { closeCopyToClipboardToast, openCopyToClipboardToast } from "../../store/slices/toastSlice"


export const openCopyToClipboard = (toastType = 'copy') => dispatch => {
    dispatch(openCopyToClipboardToast(toastType))
    setTimeout(() => {
        dispatch(closeCopyToClipboardToast())
    }, 2000)
}