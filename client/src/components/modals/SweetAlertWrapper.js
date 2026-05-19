'use client'
import SweetAlert from 'react-bootstrap-sweetalert'
import { removeSweetAlert } from '../../../store/slices/sweetAlertSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

export default function SweetAlertWrapper() {
    const { showAlert, description, onConfirmUrl } = useSelector(state => state.sweetAlert)
    const router = useRouter()
    const dispatch = useDispatch()

    const onConfirm = () => {
        dispatch(removeSweetAlert())
        if (onConfirmUrl !== '') {
            router.push(onConfirmUrl)
        }
    }

    return (
        <>
            {showAlert === true &&
                <div className='fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3 sm:px-0'>
                    {/* Modal Container */}
                    <div className='rounded-md w-full max-w-md max-h-[80vh] p-3 bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 bg-[linear-gradient(525deg,#170c3e,#120629)] flex flex-col'>

                        {/* Content */}
                        <div className='py-3 px-1 text-white overflow-y-auto flex-1 text-center'>
                            {typeof description === 'object' ? (
                                <p className='break-words'>{description}</p>
                            ) : (
                                <p
                                    className='break-words'
                                    dangerouslySetInnerHTML={{ __html: description }}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className='p-4 pt-0 flex justify-center'>
                            <button
                                type='button'
                                className='capitalize bg-gray-200 text-black hover:bg-gray-300 px-8 py-3 rounded-md cursor-pointer'
                                onClick={onConfirm}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            }
        </>
    )
}