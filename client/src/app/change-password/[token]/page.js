'use client'
import React, { useState } from 'react'
import _ from 'lodash'
import { Eye, EyeOff } from "lucide-react"
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { resetPasswordAction } from '../../../action/auth.action'
import { setSweetAlert } from '../../../../store/slices/sweetAlertSlice'

export default function ChangePasswordPage() {
    const params = useParams()
    const { token } = params
    const searchParams = useSearchParams()
    const queryDomain = searchParams.get('domain')
    const router = useRouter()
    const dispatch = useDispatch()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            dispatch(setSweetAlert({ description: 'Passwords do not match.' }))
            return
        }
        if (password.length < 6) {
            dispatch(setSweetAlert({ description: 'Password must be at least 6 characters long.' }))
            return
        }
        const domain = queryDomain
        if (_.isEmpty(domain)) {
            dispatch(setSweetAlert({ description: 'Invalid request.' }))
            return
        }
        const data = { token, password }
        const res = await resetPasswordAction(domain, data, dispatch)
        if (res.status) {
            router.push('/')
        }
    }

    return (
        <div className='min-h-[calc(100dvh-var(--navbar-height))] flex items-center justify-center bg-[#1a0033] px-4'>
            <div className='w-full max-w-[480px] flex flex-col bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white rounded-2xl shadow-2xl overflow-hidden'>
                <div className='flex-1 px-8 pt-10 pb-6'>
                    <h1 className="text-xl font-bold text-[#f8f8f8]">Reset Password</h1>
                    <p className="text-xl font-bold mb-3 text-[#f8f8f8]"> Enter your new password </p>
                    <p className="text-sm">Please make sure it is at least 6 characters.</p>

                    <div className='border-b-[0.5px] border-[#D9D9D9]/6 my-8'></div>

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='relative'>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='New Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d]'
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-700 hover:text-gray-900 cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className='relative'>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder='Confirm Password'
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d]'
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-700 hover:text-gray-900 cursor-pointer"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button 
                            type='submit' 
                            className='w-full mt-6 bg-[#ff1a9d] hover:opacity-90 text-white text-[14px] font-semibold py-4 rounded-md transition cursor-pointer tracking-[2px]'
                        >
                            UPDATE PASSWORD
                        </button>
                        
                        <div className='w-full flex justify-center mt-4' onClick={() => router.push('/')}>
                            <span className='text-[#fff] text-[12px] cursor-pointer text-center hover:underline opacity-80'>Return to Home</span>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className='text-[12px] px-8 pb-6 opacity-50 text-center text-[#ffffff]/40'>
                    ©Highlife Media. All Rights Reserved.
                    Disclaimer: All members and people appearing on this site are 18 years of age or older.
                </p>
            </div>
        </div>
    )
}

