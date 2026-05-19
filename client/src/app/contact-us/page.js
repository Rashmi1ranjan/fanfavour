'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { submitContactUs } from '../../action/api'

export default function ContactUsPage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        body: ''
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const res = await submitContactUs(formData, dispatch)
        if (res?.status) {
            setFormData({ name: '', email: '', subject: '', body: '' })
            router.push('/')
        }
        setLoading(false)
    }

    return (
        <div className='min-h-[calc(100dvh-var(--navbar-height))] flex items-center justify-center bg-[#1a0033] px-4 py-8'>
            <div className='w-full max-w-[500px] flex flex-col bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white rounded-2xl shadow-2xl overflow-hidden'>
                <div className='flex-1 px-8 pt-10 pb-6'>
                    <h1 className="text-2xl font-bold text-[#f8f8f8] mb-2">Contact Us</h1>
                    <p className="text-sm opacity-80 mb-6">We would love to hear from you. Please fill out the form below.</p>

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <input
                            name='name'
                            type='text'
                            placeholder='Your Name'
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d]'
                        />
                        <input
                            name='email'
                            type='email'
                            placeholder='Your E-mail'
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d]'
                        />
                        <input
                            name='subject'
                            type='text'
                            placeholder='Subject'
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d]'
                        />
                        <textarea
                            name='body'
                            placeholder='Message'
                            rows='5'
                            value={formData.body}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#ff1a9d] resize-none'
                        ></textarea>

                        <button 
                            type='submit' 
                            disabled={loading}
                            className={`w-full mt-4 ${loading ? 'bg-pink-400' : 'bg-[#ff1a9d] hover:opacity-90'} text-white text-[14px] font-semibold py-4 rounded-md transition cursor-pointer tracking-[2px]`}
                        >
                            {loading ? 'SENDING...' : 'SEND MESSAGE'}
                        </button>
                        
                        <div className='w-full flex justify-center mt-4' onClick={() => router.push('/')}>
                            <span className='text-[#fff] text-[12px] cursor-pointer text-center hover:underline opacity-80'>Return to Home</span>
                        </div>
                    </form>
                </div>

                <p className='text-[12px] px-8 pb-6 opacity-50 text-center text-[#ffffff]/40'>
                    ©Highlife Media. All Rights Reserved.
                </p>
            </div>
        </div>
    )
}
