import _ from 'lodash'
import { FILE_SIZE_LIMIT_IN_BYTE } from '../../lib/constant'
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setConfirmSweetAlert, setShowAlertOnPageWrapper, setSweetAlert } from "../../../store/slices/sweetAlertSlice"
import { addNewMessageInEnd, toggleChatTipPopup, unlockContentDetail, updateUserList, clearChatTextInput } from "../../../store/slices/chatSlice"
import { googleAnalyticsTrackEvent } from "../../lib/google-analytics-event"
import { sendMessage, updateUsersLastMessage } from "../../action/chat.action"
import ChatInputTextArea from "./ChatInputTextArea"
import FullScreenModelPopUpDialog from "../../components/modals/FullScreenModelDialogPopup"
import ModalPopUp from "../../components/modals/ModalPopUp"
import PreviewContent from "../../components/layout/PreviewContent"
import AutoExpandingTextArea from '../../components/layout/AutoExpandingTextArea'
import classNames from 'classnames'
import { getFileExtension } from '../../lib/common'
import { getPresignedUrl } from '../../lib/generate-presign-url'
import { MP4, MOV, M4V } from '../../lib/constant'
import socket from '../../lib/socket'
import axios from 'axios'
import { TipPayment } from '../../action/hybrid-payment.action'

export default function ChatInputHandler(props) {
    const auth = useSelector(state => state.auth)
    const ccbill = useSelector(state => state.ccbill)
    const chat = useSelector(state => state.chat)
    const {
        content_color,
        content_font_color,
        card_background_color,
        site_font_color,
        tips_minimum_amount,
        tips_maximum_amount,
        button_shadow_color,
        is_pay_per_message_enabled,
        pay_per_message_amount,
        content_unlock_minimum_amount,
        content_unlock_maximum_amount,
        model_id,
        currency_symbol,
        currency_abbreviation
    } = auth.appSettings

    // const { allMedia, category } = props.media
    const { isAdmin, payPerMessageCredit, default_payment_method } = auth.user
    const { isLoading } = ccbill
    const { showChatTipPopup, unlockPaymentData } = chat
    const [openDialog, setOpenDialog] = useState(false)
    const [messageType, setMessageType] = useState('text')
    const [media, setMedia] = useState([])
    const [mediaPreview, setMediaPreview] = useState([])
    const [locked, setLocked] = useState(isAdmin ? 'locked' : 'free')
    const [amount, setAmount] = useState(20)
    const [chatInput, setChatInput] = useState('')
    const [tipMessage, setTipMessage] = useState('')
    const [isRearrangeModeEnable, setIsRearrangeModeEnable] = useState(false)
    const [isRearrangeModeEnableForMedia, setIsRearrangeModeEnableForMedia] = useState(false)
    const [dragId, setDragId] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({})
    const [isPreviewModeEnable, setIsPreviewModeEnable] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [showMediaSelectionPopup, setShowMediaSelectionPopup] = useState(false)
    const [showMediaPreviewSelectionPopup, setShowMediaPreviewSelectionPopup] = useState(false)
    const [contentManagerMedia, setContentManagerMedia] = useState([])
    const [contentManagerMediaPreview, setContentManagerMediaPreview] = useState([])
    const [contentManagerIsPreviewModeEnable, setContentManagerIsPreviewModeEnable] = useState(false)
    const [mediaPreviewId, setMediaPreviewId] = useState([])
    const [mediaIds, setMediaIds] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [payPerMessageAmount, setPayPerMessageAmount] = useState(pay_per_message_amount)

    const dispatch = useDispatch()

    const scrollToBottom = () => {
        setTimeout(() => {
            const objDiv = document.getElementById('message-list')
            if (objDiv) {
                objDiv.scrollTop = objDiv.scrollHeight
            }
        }, 0)
    }

    useEffect(() => {
        if (showChatTipPopup === false && messageType === 'tip') {
            resetForm()
        }
    }, [showChatTipPopup, type])

    const openInput = (type) => {
        setMessageType(type)
        if (openDialog === true) {
            setMessageType('text')
            setMedia([])
            setMediaPreview([])
            setContentManagerMedia([])
            setContentManagerMediaPreview([])
            setLocked(isAdmin ? 'locked' : 'free')
            setAmount(20)
            setIsPreviewModeEnable(false)
            setContentManagerIsPreviewModeEnable(false)
            setDragId(false)
            setUploadProgress({})
            dispatch(toggleChatTipPopup(false))
            setMediaPreviewId([])
            setMediaIds([])
            setSelectedCategory(null)
        }

        if (showChatTipPopup === false && type === 'tip') {
            dispatch(toggleChatTipPopup(true))
        }
        setOpenDialog(!openDialog)
    }

    useEffect(() => {
        const inputType = props.inputType
        if (props.inputType) {
            openInput(inputType)
        }
    }, [props.inputType])

    useEffect(() => {
        if (unlockPaymentData.isTipFromChat) {
            sendTip()
        }
    }, [unlockPaymentData.isTipFromChat])

    useEffect(() => {
        if (unlockPaymentData.isPayPerMessageMedia) {
            handleSendMessage(messageType, true)
        }
    }, [unlockPaymentData.isPayPerMessageMedia])

    useEffect(() => {
        if (unlockPaymentData.addFundsForPayPerMessageMedia === true) {
            const wallet_amount = props.auth.user.wallet_amount
            const remainAmount = wallet_amount === 0.00 ? 0 : Math.ceil(payPerMessageAmount - wallet_amount)
            dispatch(setShowAlertOnPageWrapper(false))
            dispatch(unlockContentDetail({}))
            props.payPerMessageCryptoPayment({ showAddFundPopup: true, remainAmount: remainAmount, tipAmount: pay_per_message_amount })
        }
    }, [unlockPaymentData.addFundsForPayPerMessageMedia])

    const resetForm = () => {
        props.setInputType('')
        props.setMessage('')
        setMessageType('text')
        setMedia([])
        setMediaPreview([])
        setContentManagerMedia([])
        setContentManagerMediaPreview([])
        setLocked(isAdmin ? 'locked' : 'free')
        setAmount(20)
        setOpenDialog(false)
        setChatInput('')
        setTipMessage('')
        setDragId(false)
        setIsPreviewModeEnable(false)
        setContentManagerIsPreviewModeEnable(false)
        setUploadProgress({})
        setUploading(false)
        dispatch(toggleChatTipPopup(false))
        setMediaPreviewId([])
        setMediaIds([])
        setSelectedCategory(null)
    }

    const submitHandler = async (e) => {
        e.preventDefault()
        if (chatInput === '' && messageType === 'text') {
            return dispatch(setSweetAlert({ description: 'Type a message' }))
        }
        if (['photo', 'video', 'gallery'].includes(messageType) && media.length === 0 && contentManagerMedia.length === 0) {
            return dispatch(setSweetAlert({ description: 'Please add media' }))
        }

        if (chatInput.length > 20000) {
            return dispatch(setSweetAlert({ description: 'Message is too long' }))
        }
        const userId = chat.selectedUserId
        const userDomain = chat.userList.find(obj => obj._id === userId)
        const domain = _.get(userDomain, 'domain', '')

        if (domain !== auth.user.domain) {
            const data = {
                email: auth.user.email,
                isUniversal: true,
                modelDomain: domain,
                currentDomain: auth.user.domain
            }

            socket.emit('IS_ENABLE_PAY_PER_MESSAGE', data)

            const handlePayPerMessageStatus = (data) => {
                const { isPayPerMessageEnabled, payPerMessageAmount, payPerMessageCredit } = data
                if (isPayPerMessageEnabled === true) {
                    setPayPerMessageAmount(payPerMessageAmount)
                    checkPayPerMessageEnable(isPayPerMessageEnabled, payPerMessageAmount, payPerMessageCredit)
                } else {
                    handleSendMessage(messageType, isPayPerMessageEnabled)
                }
                socket.off('PAY_PER_MESSAGE_STATUS', handlePayPerMessageStatus)
            }

            socket.on('PAY_PER_MESSAGE_STATUS', handlePayPerMessageStatus)
        } else {
            if (is_pay_per_message_enabled) {
                checkPayPerMessageEnable(is_pay_per_message_enabled, payPerMessageAmount)
            } else {
                handleSendMessage(messageType, is_pay_per_message_enabled)
            }
        }
    }

    const handleSendMessage = async (messageType, isPayPerMessageEnabled) => {
        let messageObject = {}
        dispatch(setShowAlertOnPageWrapper(false))
        dispatch(unlockContentDetail({}))
        if (messageType === 'text') {
            messageObject = {
                type: messageType,
                fromAdmin: false,
                message: chatInput || props.message,
                receiver: chat.selectedUserId,
                messageFrom: 'chat',
                userId: auth.user._id
            }
            setUploading(true)
            props.onSend(messageObject, () => {
                resetForm()
                props.payPerMessageCreditRemove()
            })
        } else {
            messageObject = {
                type: messageType,
                fromAdmin: false,
                message: chatInput || props.message,
                isRead: 0,
                isLocked: locked,
                amount: amount,
                receiver: chat.selectedUserId,
                messageFrom: 'chat',
                media: [],
                media_preview: [],
                processing: true
            }

            setUploading(true)
            let contentLeftForProcessing = 0
            for (let index = 0; index < media.length; index++) {

                const element = media[index]

                let fileExtension = getFileExtension(element.selectedFile.name)
                if ([M4V].includes(fileExtension.toLocaleLowerCase())) {
                    setUploading(false)
                    return dispatch(setSweetAlert({ description: 'Media format is not supported.' }))
                }

                let fileExtensionForPresignedUrl = 'photo'
                if ([MP4, MOV].includes(fileExtension.toLocaleLowerCase())) {
                    fileExtensionForPresignedUrl = 'video'
                }

                let domain = auth.user.domain
                const userList = chat.userList
                if (userList?.length > 1 && !auth.isAdmin) {
                    const selectedUser = userList.find(user => user._id === chat.selectedUserId)
                    domain = selectedUser.domain
                }

                let isUniversalChat = false
                if (auth.user.domain !== domain) {
                    isUniversalChat = true
                }
                messageObject.domain = domain
                messageObject.isUniversalChat = isUniversalChat
                let presignedUrlData = await getPresignedUrl(element.selectedFile.name, 'message', fileExtensionForPresignedUrl, auth.user.email, domain, isUniversalChat)
                if (presignedUrlData.presigned_url !== '') {
                    let uploadFile = await uploadFileUsingPresignedUrl(fileExtensionForPresignedUrl, presignedUrlData.presigned_url, element.selectedFile, index)
                    if (uploadFile === true) {
                        messageObject.media.push({
                            url: presignedUrlData.file_name,
                            thumbnail_url: '',
                            blur_url: '',
                            is_process: true,
                            content_type: fileExtensionForPresignedUrl,
                            is_error: false
                        })
                        contentLeftForProcessing++
                    } else {
                        setUploading(false)
                        return dispatch(setSweetAlert({ description: presignedUrlData.message }))
                    }
                } else {
                    setOpenDialog(false)
                    resetForm()
                    setUploading(false)
                    return dispatch(setSweetAlert({ description: presignedUrlData.message }))
                }

                messageObject.contentLeftForProcessing = contentLeftForProcessing
                const res = await sendMessage(messageObject)
                setUploading(false)

                if (res.isError === true) {
                    setUploadProgress({})
                    const allow_cascade = _.get(res.error.response.data.errors, 'cascade.allow_cascade', false)
                    // if image upload is failed then update local message credit
                    if (isPayPerMessageEnabled === true) {
                        const paymentStatus = _.get(res.error.response, 'data.errors.isPaymentDoneForPayPerMessage', false)
                        if (paymentStatus === true) {
                            props.payPerMessageCreditAdd()
                        }
                    }
                    let errorMessage = _.get(res.error.response, 'data.message', 'There was an error while uploading the image.')
                    if (allow_cascade === true) {
                        errorMessage = 'Could not send Message: Problem in card authorization please re-enter your card details or add new card.'
                    }
                    dispatch(setSweetAlert({ description: errorMessage }))
                    if (allow_cascade === true) {
                        router.push('profile/add-new-payment-method')
                    }
                } else {
                    const updatedWalletBalance = _.get(res, 'message.wallet_balance', false)
                    if (updatedWalletBalance !== false) {
                        dispatch(updateWalletAmount(updatedWalletBalance))
                    }
                    dispatch(addNewMessageInEnd({ data: res.message, user_id: chat.selectedUserId }))
                    scrollToBottom()
                    props.payPerMessageCreditRemove()
                    resetForm()
                }
            }
        }
    }

    const checkPayPerMessageEnable = (isEnablePayPerMessage, messageAmount = '', payPerMessageCredit = 0) => {
        if (isEnablePayPerMessage === true && isAdmin === false) {
            if (auth.user.default_payment_method === 'crypto_currency') {
                const wallet_amount = auth.user.wallet_amount
                const pay_per_message_amount = messageAmount === '' ? auth.appSettings.pay_per_message_amount : messageAmount
                if (wallet_amount < pay_per_message_amount) {
                    dispatch(setShowAlertOnPageWrapper(true))
                    dispatch(setConfirmSweetAlert({ description: 'Your wallet balance is low. Please add funds to send message.' }))
                    dispatch(unlockContentDetail({ type: 'add_funds_for_pay_per_message_media' }))
                    return
                }
            }
            payPerMessageConfirmationAndAlert(messageAmount, payPerMessageCredit)
            return
        }
    }

    const payPerMessageConfirmationAndAlert = (messageAmount, messageCredit) => {
        let confirmationMessage
        const payPerMediaMessageCredit = messageCredit !== 0 ? messageCredit : payPerMessageCredit
        if (payPerMediaMessageCredit === 0) {
            const payPerMessageAmount = messageAmount === '' ? pay_per_message_amount : messageAmount
            if (auth.user.default_payment_method === 'crypto_currency') {
                confirmationMessage = `You currently have ${_.isEmpty(currency_symbol) ? '$' : currency_symbol}${auth.user.wallet_amount} in your wallet.Sending this message will charge $${payPerMessageAmount}. It will be debited from your wallet balance.`
            } else {
                confirmationMessage = `Sending this message will charge ${_.isEmpty(currency_symbol) ? '$' : currency_symbol}${payPerMessageAmount} to the payment method on file for your account.`
            }
        } else {
            confirmationMessage = `You have ${payPerMediaMessageCredit} Message credit.This message is sent free.`
        }

        dispatch(setShowAlertOnPageWrapper(true))
        dispatch(setConfirmSweetAlert({ description: confirmationMessage }))
        dispatch(unlockContentDetail({ type: 'pay_per_message_media' }))
    }

    const onSendTip = async () => {
        let tipAmount = parseFloat(amount).toFixed(2)
        if (tipMessage.length > 20000) {
            return dispatch(setSweetAlert({ description: 'Message is too long.' }))
        }
        props.setInputType('')

        let amountInt = parseInt(amount, 10)
        let tipsMinimumAmount = parseInt(auth.appSettings.tips_minimum_amount, 10)
        let tipsMaximumAmount = parseInt(auth.appSettings.tips_maximum_amount, 10)

        if (!((tipsMinimumAmount <= amountInt) && (amountInt <= tipsMaximumAmount))) {
            dispatch(setSweetAlert({ description: `Choose a tip between ${tipsMinimumAmount} and ${tipsMaximumAmount} ` }))
        } else {
            if (!/^[0-9]+(\.[0-9]{1,2})$/.test(tipAmount)) {
                tipAmount = amount + '.00'
            }
            setAmount(tipAmount)
            // Set google analytics add_to_cart event for tip
            googleAnalyticsTrackEvent('add_to_cart', '', amount, 'chat', 'tip', '')
            let confirmMessage = `Please Confirm Tip of ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${tipAmount}.`
            if (auth.user.default_payment_method === 'crypto_currency') {
                confirmMessage += ` You currently have ${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${auth.user.wallet_amount} in your wallet.Amount will be debited from your wallet balance.`
            }

            if (auth.user.default_payment_method !== 'crypto_currency') {
                dispatch(setShowAlertOnPageWrapper(true))
                dispatch(setConfirmSweetAlert({ description: confirmMessage }))
                dispatch(unlockContentDetail({ type: 'tips_from_chat' }))
            } else if (auth.user.default_payment_method === 'crypto_currency' && auth.user.wallet_amount >= tipAmount) {
                dispatch(setShowAlertOnPageWrapper(true))
                dispatch(setConfirmSweetAlert({ description: confirmMessage }))
                dispatch(unlockContentDetail({ type: 'tips_from_chat' }))
            } else {
                sendTip()
            }
        }
    }

    const sendTip = async () => {
        let data = {
            amount: amount,
            recurring: false,
            email: auth.user.email,
            action: 'tips',
            tipFrom: 'chat',
            tipMessage: tipMessage.trim(),
            requestFrom: 'FF',
            domain: auth.user.domain
        }
        if (chat.userList.length > 1) {
            const userId = chat.selectedUserId
            const userDomain = chat.userList.find(obj => obj._id === userId)
            data.domain = userDomain.domain
            data.isUniversalChat = auth.user.domain !== userDomain.domain
        }

        if (auth.user.default_payment_method === 'crypto_currency') {
            const tipPaymentResponse = await props.tipUsingCrypto(amount, auth.user.wallet_amount, tipMessage)
            if (tipPaymentResponse?.success === 1) {
                tipResponseHandler(tipPaymentResponse)
                dispatch(setShowAlertOnPageWrapper(false))
                dispatch(unlockContentDetail({}))
            }
        } else {
            const payment = await TipPayment(data, auth.user._id, dispatch)
            payment.show_alert = false
            tipResponseHandler(payment)
            dispatch(setShowAlertOnPageWrapper(false))
            dispatch(unlockContentDetail({}))
        }
    }

    const tipResponseHandler = (res) => {
        if (res.success === 1) {
            dispatch(setSweetAlert({ description: res.data.message }))
            dispatch(addNewMessageInEnd({ data: res.data.messageData, user_id: chat.selectedUserId }))
            const lastMessage = `You just tipped <model_name> ${res.data.messageData.message}`
            dispatch(updateUsersLastMessage({ user_id: chat.selectedUserId, message: lastMessage, type: res.data.messageData.type, isAdmin: false }))
            scrollToBottom()
        }
        resetForm()
    }

    const handleDrop = (index) => {
        if ((isRearrangeModeEnable === true || isRearrangeModeEnableForMedia) && dragId !== '') {
            const copyNewFiles = [...media]
            const dragFile = copyNewFiles[dragId]
            copyNewFiles.splice(dragId, 1)
            copyNewFiles.splice(index, 0, dragFile)
            setMedia(copyNewFiles)
            setDragId('')
        }
        setDragId('')
    }

    const handleDeletePhoto = (index, name) => {
        if (name === 'preview') {
            setMediaPreview([])
            setMediaPreviewId([])
        } else {
            if (media.length === 2) {
                setIsRearrangeModeEnableForMedia(false)
            }
            const copyMedia = [...media]
            const updatedFilesArray = [
                ...copyMedia.slice(0, index),
                ...copyMedia.slice(index + 1)
            ]
            const updatedMediaIdsArray = [
                ...mediaIds.slice(0, index),
                ...mediaIds.slice(index + 1)
            ]
            let type = 'gallery'
            if (updatedFilesArray.length === 0 && mediaPreview.length === 0) {
                type = 'text'
            } else if (updatedFilesArray.length === 1) {
                if (['video/mp4', 'video/quicktime'].includes(updatedFilesArray[0].selectedFile.type)) {
                    type = 'video'
                } else if (['image/jpeg', 'image/jpeg', 'image/png'].includes(updatedFilesArray[0].selectedFile.type)) {
                    type = 'photo'
                }
            }
            setMessageType(type)
            setMedia(updatedFilesArray)
            setMediaIds(updatedMediaIdsArray)
        }
    }

    const uploadProgressInMb = (galleryIndex, progressNumber) => {
        let actualFileSize = 0
        let actualFileUploaded = '0'
        const type = _.get(uploadProgress, 'type', '')
        const selectedFile = type === 'original' ? media[galleryIndex].selectedFile : mediaPreview[galleryIndex].selectedFile
        actualFileSize = (_.get(selectedFile, 'size', 0) / 1024) / 1024
        actualFileUploaded = ((actualFileSize * progressNumber) / 100).toFixed(2)

        return <div className='progress-text text-white'>Uploading {actualFileUploaded} MB Of {actualFileSize.toFixed(2)} MB</div>
    }

    const handleGalleryChange = (e, name) => {
        const files = e.target.files
        if (name === 'preview') {
            if (files.length > 1) {
                return dispatch(setSweetAlert({ description: 'You can not add more than one preview.' }))
            } else {
                handleAddFile(files[0], name)
            }
        } else {
            galleryFiles(files, name)
        }
    }

    const galleryFilesFromPreview = (files) => {
        if (mediaPreview.length === 0) {
            galleryFiles([files[0]], 'preview')
        } else {
            return dispatch(setSweetAlert({ description: 'You can not add more than one preview.' }))
        }
    }

    const galleryFilesFromOriginal = (files) => {
        if (isAdmin === true) {
            galleryFiles(files, 'original')
        } else {
            if (media.length === 0) {
                galleryFiles([files[0]], 'original')
            } else {
                return dispatch(setSweetAlert({ description: 'You can not add more than one media.' }))
            }
        }
    }

    const galleryFiles = (files, name) => {
        if (isRearrangeModeEnable !== true || isRearrangeModeEnableForMedia !== true) {
            const existFilesCount = media.length
            const uploadFileCount = 45 - existFilesCount < files.length ? 45 - existFilesCount : files.length
            const totalFilesCount = files.length + existFilesCount
            let type = 'gallery'
            for (let index = 0; index < uploadFileCount; index++) {
                const acceptExtension = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/jpeg', 'image/png']
                if (!acceptExtension.includes(files[index].type)) {
                    return dispatch(setSweetAlert({ description: 'Media format is not supported.' }))
                }
                if (totalFilesCount === 1) {
                    if (['video/mp4', 'video/quicktime'].includes(files[index].type)) {
                        type = 'video'
                    } else if (['image/jpeg', 'image/jpeg', 'image/png'].includes(files[index].type)) {
                        type = 'photo'
                    }
                }
            }
            const newUploadedFiles = []
            for (let index = 0; index < uploadFileCount; index++) {
                const fileSize = _.get(files[index], 'size', -1)
                if (fileSize !== -1 && fileSize > FILE_SIZE_LIMIT_IN_BYTE) {
                    dispatch(setSweetAlert({ description: `File ${files[index].name} size is too large.` }))
                } else {
                    const file = files[index]
                    if (file) {
                        const newFileName = file.name
                        const newFileSize = file.size
                        const galleries = (name === 'original') ? media : mediaPreview
                        let findRecord = -1
                        if (name === 'original') {
                            findRecord = _.findIndex(galleries, function (n) {
                                return (n.selectedFile.name === newFileName && n.selectedFile.size === newFileSize) ? n : false
                            })
                        }
                        if (findRecord === -1) {
                            let newFile = {
                                selectedFile: file,
                                renderFile: file.format === 'modern' ? file.path : URL.createObjectURL(file)
                            }
                            if (name === 'original') {
                                newUploadedFiles.push(newFile)
                            } else {
                                setMediaPreview([newFile])
                            }
                        }
                    }
                }
            }
            if (totalFilesCount > 45) {
                dispatch(setSweetAlert({ description: `You have selected ${totalFilesCount} images, maximum 45 images allowed.` }))
            } else {
                let copyNewFiles = [...media]
                copyNewFiles = copyNewFiles.concat(newUploadedFiles)
                if (name === 'original') {
                    setMessageType(type)
                    setMedia(copyNewFiles)
                }
            }
        }
    }

    const handleAddFile = (file, name) => {
        if (file) {
            const newFileName = file.name
            const newFileSize = file.size
            const galleries = (name === 'original') ? media : mediaPreview
            let findRecord = -1
            if (name === 'original') {
                findRecord = _.findIndex(galleries, function (n) {
                    return (n.selectedFile.name === newFileName && n.selectedFile.size === newFileSize) ? n : false
                })
            }
            if (findRecord === -1) {
                let newFile = {
                    selectedFile: file,
                    renderFile: file.format === 'modern' ? file.path : URL.createObjectURL(file)
                }
                if (name === 'original') {
                    const copy = JSON.parse(JSON.stringify(media))
                    copy.push(newFile)
                    setMedia(copy)
                } else {
                    setMediaPreview([newFile])
                }
            }
        }
    }

    const uploadFileUsingPresignedUrl = async (contentType, url, body, galleryIndex = 0, type = 'original') => {
        const cancelTokenSource = axios.CancelToken.source()
        const config = {
            onUploadProgress: (progressEvent) => {
                let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                window.addEventListener('offline', function () {
                    cancelTokenSource.cancel('Network error')
                    setUploading(false)
                    return dispatch(setSweetAlert({ description: 'Seems you are offline. Please check your internet connection and post again.' }))
                })

                const object = {
                    progress: percentCompleted + '%',
                    index: galleryIndex,
                    progressNumber: percentCompleted,
                    type: type
                }
                setUploadProgress(object)
            },
            cancelToken: cancelTokenSource.token
        }
        const axiosInstance = axios.create()
        delete axiosInstance.defaults.headers.common['Authorization']
        axiosInstance.defaults.headers['Content-Type'] = contentType === 'video' ? 'video/mp4' : 'image/jpg'
        let apiResponse = await axiosInstance.put(url, body, config)
        if (apiResponse.status === 200) {
            return true
        }
        return false
    }

    const onOpenDialog = (url, type) => {
        if (uploading === true) {
            return
        }
        if (!isDialogOpen === true) {
            document.querySelector('body').style.overflow = 'hidden'
        } else {
            document.querySelector('body').style.overflow = 'visible'
        }
        setUrl(url)
        setType(type)
        setIsDialogOpen(!isDialogOpen)
    }

    useEffect(() => {
        if (props.setIsPopupOpen) props.setIsPopupOpen(isDialogOpen)
    }, [isDialogOpen])

    const handleClose = () => {
        openInput()
        props.setInputType('')
        props.setMessage('')
    }

    return (
        <>
            {showChatTipPopup && messageType === 'tip' &&
                <ModalPopUp showHeader={true} open={showChatTipPopup} handleClose={() => {
                    props.setInputType('')
                    resetForm()
                }} title='Send Tip'>
                    <div className='container p-0'>
                        <form autoComplete='off' className='space-y-4'>
                            {/* Amount input */}
                            <div className='flex'>
                                <span className='inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-sm bg-[linear-gradient(525deg,#170c3e,#120629)] text-[#fff] text-sm cursor-pointer'>
                                    {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                </span>
                                <input
                                    type='text'
                                    id='amount'
                                    name='amount'
                                    className='w-full px-3 py-2 border border-gray-300 rounded-r-sm text-[#fff] focus:outline-none'
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min={tips_minimum_amount}
                                    max={tips_maximum_amount}
                                    disabled={isLoading}
                                />
                            </div>
                            {/* Helper text */}
                            <small className='mt-2 block text-sm text-[#fff]/70'>
                                Minimum {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                {tips_minimum_amount}{' '}
                                {_.isEmpty(currency_abbreviation.trim()) ? 'USD' : currency_abbreviation.trim()}.
                                <br />
                                {default_payment_method === 'crypto_currency' ? (
                                    <>
                                        {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                        {amount} will be debited from wallet balance.
                                    </>
                                ) : (
                                    <>
                                        {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                        {amount} will be charged to the payment method you used previously on the website.
                                    </>
                                )}
                            </small>

                            {/* Message textarea */}
                            <div>
                                <label className='block text-sm font-medium text-[#fff] mb-1'>
                                    Personalized message:
                                </label>

                                <AutoExpandingTextArea
                                    className={classNames(
                                        'w-full px-3 py-2 border border-gray-300 rounded-xs resize-none focus:outline-none text-[#fff]',
                                        {
                                            [props.classes?.input_input]: props.classes
                                        }
                                    )}
                                    onChange={(e) => setTipMessage(e.target.value)}
                                    value={tipMessage}
                                    readOnly={uploading}
                                    maxLength={20000}
                                    subscriptionStatus={props.subscriptionStatus}
                                />
                            </div>

                            {/* Submit button */}
                            <button
                                type='button'
                                onClick={onSendTip}
                                disabled={isLoading}
                                className='w-full py-2.5 rounded-md font-medium disabled:opacity-60 disabled:cursor-not-allowed bg-[#ff1a9d] text-base text-[#fff] cursor-pointer'>
                                Send a tip of {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                {amount}
                            </button>

                        </form>
                    </div>
                </ModalPopUp>
            }
            {
                openDialog && messageType !== 'tip' &&
                <ModalPopUp showHeader={true} open={openDialog} handleClose={handleClose} title='Send Message'>
                    <div className='container'>
                        <div className='row justify-center'>
                            <div className='text-center'>
                                <div className='w-full'>
                                    <ChatInputTextArea
                                        value={props.message}
                                        setValue={props.setMessage}
                                        disabled={uploading}
                                        usedInModal={true}
                                        chat={chat}
                                        clearChatTextInput={clearChatTextInput}
                                        classes='border border-1-[#fff] text-[#fff] rounded-sm'
                                        subscriptionStatus={props.subscriptionStatus}
                                    />
                                </div>
                                <PreviewContent
                                    media={media}
                                    isLoading={uploading}
                                    handleDeletePhoto={handleDeletePhoto}
                                    handleDrop={handleDrop}
                                    uploadProgress={uploadProgress}
                                    uploadProgressInMb={uploadProgressInMb}
                                    handleGalleryChange={handleGalleryChange}
                                    option={locked}
                                    galleryFilesFromPreview={galleryFilesFromPreview}
                                    openDialog={onOpenDialog}
                                    galleryFilesFromOriginal={galleryFilesFromOriginal}
                                    isRearrangeModeEnableForMedia={isRearrangeModeEnableForMedia}
                                    setIsRearrangeModeEnableForMedia={setIsRearrangeModeEnableForMedia}
                                    showMarkAsPreviewButton={false}
                                    setShowMediaSelectionPopup={setShowMediaSelectionPopup}
                                    setShowMediaPreviewSelectionPopup={setShowMediaPreviewSelectionPopup}
                                    requestFrom='message'
                                />
                                <div className='mt-5'>
                                    <button
                                        type='button'
                                        onClick={submitHandler}
                                        disabled={uploading}
                                        className='bg-[#ff1a9d] text-base text-[#fff] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold cursor-pointer'
                                    >
                                        {uploading && (
                                            <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                                        )}
                                        <span>Send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalPopUp>

            }
            {
                isDialogOpen === true &&
                <FullScreenModelPopUpDialog
                    url={url}
                    handleClose={() => { onOpenDialog('', '') }}
                    type={type}
                    showWatermark={false}
                />
            }
        </>
    )
}