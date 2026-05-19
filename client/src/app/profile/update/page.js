'use client'
import _ from 'lodash'
import { updateProfile } from '../../../action/users.action'
import { dismissChangeEmailRequest, resendChangeEmailRequest } from '../../../action/email.action'
import { getCloudFrontAssetsUrl } from '@/lib/assets'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSweetAlert } from '../../../../store/slices/sweetAlertSlice'
import Button from '@/components/common/Button'
import Sidebar from '../page'
import { withPrivateRoute } from "@/components/layout/PrivateRoute";
import BackLayout from '../BackLayout'

function UpdateProfile() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [renderFile, setRenderFile] = useState(getCloudFrontAssetsUrl('faces/avatar.png'))
    const [isTimer, updateIsTimer] = useState(false)
    const [timer, updateTimer] = useState('')
    const [emailLog, setEmailLog] = useState(null)
    const [isResendMessage, setIsResendMessage] = useState(false)

    const auth = useSelector((state) => state.auth)
    const dispatch = useDispatch()

    useEffect(() => {
        if (auth.user.avatarUrl !== undefined) {
            setRenderFile(auth.user.avatarUrl)
        }
        setName(auth.user.name)
        setEmail(auth.user.email)
        setEmailLog(auth.user.emailLog)
        if (isTimer === true) {
            setInterval(() => getResendTimer(), 1000)
        }
    }, [auth.user, isTimer])

    const getResendTimer = () => {
        let date = localStorage.getItem('change_email_link_sent_date_time')
        const expectedDate = new Date(date).setMinutes(new Date(date).getMinutes() + 2)
        let diff = expectedDate - new Date()

        const getSecond = Math.floor(diff / 1000)

        updateTimer(getSecond)
        if (getSecond === 0) {
            updateIsTimer(false)
            setIsResendMessage(false)
        }
    }

    const handleAvatarChange = (event) => {
        setAvatarUrl(event.target.files[0])
        setRenderFile(URL.createObjectURL(event.target.files[0]))
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        const userEmail = email.trim()
        if (_.isEmpty(userEmail) === true) {
            return dispatch(setSweetAlert({ description: 'Email cannot be empty.' }))
        }
        const userName = name.trim()
        if (_.isEmpty(userName) === true) {
            return dispatch(setSweetAlert({ description: 'Name cannot be empty.' }))
        }
        if (userName.length > 30) {
            return dispatch(setSweetAlert({ description: 'The name must be a maximum of 30 characters.' }))
        }
        const data = new FormData()
        if (avatarUrl !== null) {
            data.set('avatarUrl', avatarUrl, avatarUrl.name)
        }
        data.set('name', userName)
        data.set('email', email)
        await dispatch(updateProfile(auth.user.domain, data, dispatch))
        setAvatarUrl(null)
        localStorage.setItem('change_email_link_sent_date_time', new Date())
    }

    const resendChangeEmail = () => {
        let date = localStorage.getItem('change_email_link_sent_date_time')
        let expectedDate = new Date(new Date(date).setMinutes(new Date(date).getMinutes() + 2))
        if (expectedDate <= new Date()) {
            dispatch(resendChangeEmailRequest(auth.user.domain))
            localStorage.setItem('change_email_link_sent_date_time', new Date())
        } else {
            updateIsTimer(true)
            setIsResendMessage(true)
        }
    }

    return (
        <div className='flex justify-center px-4 md:px-10 py-6'>
            <div className='w-full max-w-6xl'>
                <BackLayout />
                <div className='flex flex-col md:flex-row gap-6 items-start'>
                    <div className='w-full md:flex-1 hidden lg:block'>
                        <Sidebar />
                    </div>
                    <div className='w-full md:flex-[2] bg-white shadow-sm rounded-sm overflow-hidden'>
                        <div className='p-4 border-b font-medium'>
                            Update Profile
                        </div>
                        <div className='flex flex-col items-center p-6 md:p-10 space-y-4'>
                            <div className='relative w-[200px] h-[200px] rounded-full overflow-hidden'>
                                <Image
                                    src={renderFile}
                                    alt='avatar'
                                    fill
                                    className='object-cover'
                                    draggable={false}
                                />
                            </div>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleAvatarChange}
                                className='hidden'
                                id='avatar-upload'
                            />
                            <label
                                htmlFor='avatar-upload'
                                className='text-sm text-[#ff1a9d] bg-[#ff1a9d]/20 px-2 py-1 rounded-full cursor-pointer'
                            >
                                Upload Profile Photo
                            </label>
                            <div className='flex flex-col gap-5 w-full'>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>
                                        Name
                                    </label>
                                    <input
                                        type='text'
                                        value={name || ''}
                                        onChange={(e) => setName(e.target.value)}
                                        className='bg-gray-50 border rounded-sm px-3 py-2'
                                    />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='text-sm text-gray-600'>
                                        Email
                                    </label>
                                    <input
                                        type='email'
                                        value={email || ''}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className='bg-gray-50 border rounded-sm px-3 py-2'
                                    />
                                </div>
                                {emailLog !== undefined && emailLog !== null ?
                                    <div className='mt-2 gap-2'> You have requested to change your email to {emailLog.email}. Please check your email and click on the confirmation link. If you don’t see the email, be sure to check your spam folder.
                                        <div className='flex gap-4 mt-2'>
                                            <span className='underline cursor-pointer bg-[#ff1a9d]/20 text-[#ff1a9d] px-2 py-1 rounded-lg' onClick={() => resendChangeEmail()}>
                                                RESEND
                                            </span>
                                            <span className='underline cursor-pointer bg-[#ff1a9d]/20 text-[#ff1a9d] px-2 py-1 rounded-lg' onClick={() => dispatch(dismissChangeEmailRequest(auth.user.domain))}>
                                                DISMISS
                                            </span>
                                        </div>
                                        {isResendMessage === true ? <div className='text-start text-red'>Please wait {timer} second{timer > 1 ? 's' : ''}  before requesting an email resend.</div> : null}
                                    </div>
                                    : null
                                }
                                <Button
                                    type='submit'
                                    disabled={auth.profilePhotoUploading}
                                    onClick={handleUpdateProfile}
                                    classes={`bg-[#ff1a9d] w-full md:w-[200px] text-white py-3 rounded-md font-semibold text-sm mt-2 ${auth.profilePhotoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Update Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withPrivateRoute(UpdateProfile, ['user'])