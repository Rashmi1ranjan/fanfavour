'use client'
import SweetAlert from 'react-bootstrap-sweetalert'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { removeConfirmSweetAlert, setAlertLoader, setShowAlertOnPageWrapper } from '../../../store/slices/sweetAlertSlice'
import { unlockContentDetail } from '../../../store/slices/chatSlice'
import { cn } from '../../lib/utils'

export default function ConfirmSweetAlertsWrapper(props) {
    const { confirmDescription, onConfirmUrl, showConfirmAlert, isLoading, showConfirmAlertInPageWrapper } = useSelector((state) => state.sweetAlert)
    const chat = useSelector((state) => state.chat)
    const dispatch = useDispatch()
    const router = useRouter()

    // const setSweetAlertConfirmData = () => {
    //     switch (chat.unlockPaymentData.type) {
    //         case 'unlock':
    //             // Do something
    //             dispatch(unlockContentDetail({
    //                 messageId: chat.unlockPaymentData.messageId,
    //                 isUnlockPayment: true,
    //                 type: 'unlock'
    //             }))
    //             break
    //         case 'pay_per_message':
    //             // Do something
    //             dispatch(unlockContentDetail({
    //                 isPayPerMessage: true,
    //                 type: 'pay_per_message'
    //             }))
    //             break
    //         case 'pay_per_message_media':
    //             // Do something
    //             dispatch(unlockContentDetail({
    //                 isPayPerMessageMedia: true,
    //                 type: 'pay_per_message_media'
    //             }))
    //             break
    //         case 'tips_from_chat':
    //             // Do something
    //             dispatch(unlockContentDetail({
    //                 isTipFromChat: true,
    //                 type: 'tips_from_chat'
    //             }))
    //             break
    //         case 'add_funds_for_pay_per_message_text':
    //             dispatch(unlockContentDetail({
    //                 addFundsForPayPerMessageText: true,
    //                 type: 'add_funds_for_pay_per_message_text'
    //             }))
    //             break
    //         case 'add_funds_for_pay_per_message_media':
    //             dispatch(unlockContentDetail({
    //                 addFundsForPayPerMessageMedia: true,
    //                 type: 'add_funds_for_pay_per_message_media'
    //             }))
    //             break
    //         default:
    //             break
    //     }
    // }


    const onConfirm = () => {
        props.onConfirm()
        if (onConfirmUrl !== '') {
            router.push(onConfirmUrl)
        }
    }

    const onCancel = () => {
        props.onCancel()
        dispatch(removeConfirmSweetAlert())
    }

    return (
        <>
            {showConfirmAlert === true &&
                <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
                    {/* Modal Container */}
                    <SweetAlert
                        title={''}
                        hideCloseButton
                        closeOnClickOutside={false}
                        openAnim={false}
                        allowEscape={false}
                        showConfirm={false}
                        customClass='bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 bg-[linear-gradient(525deg,#170c3e,#120629)]'
                    >
                        {confirmDescription !== '' &&
                            <p className='text-[#fff] text-[15px] mt-[0px] whitespace-pre-line'>{confirmDescription}</p>
                        }
                        <div className='p-4'>
                            <button
                                type='button'
                                className={cn(
                                    'capitalize btn text-[#000] hover:bg-gray-300 px-4 py-2 rounded-md cursor-pointer',
                                    isLoading ? 'bg-gray-100' : 'bg-gray-200'
                                )}
                                onClick={onCancel}
                                disabled={isLoading}
                            >CANCEL</button>
                            <button
                                className={cn(
                                    'btn ml-3 text-white px-4 py-2 rounded-md cursor-pointer',
                                    isLoading ? 'bg-pink-300' : 'bg-pink-400'
                                )}
                                type='button'
                                variant='primary'
                                onClick={onConfirm}
                                disabled={isLoading}
                                style={{
                                    width: '70px'
                                }}
                            >
                                {isLoading ?
                                    <>
                                        <span className='spinner-border spinner-border-sm'></span>OK
                                    </>
                                    :
                                    'OK'
                                }
                            </button>
                        </div>
                    </SweetAlert>
                </div>
            }
        </>
    )
}