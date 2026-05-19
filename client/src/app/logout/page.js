'use client'

import { useEffect } from 'react'
import { setAuthToken } from '@/lib/set-auth-token'

const getRedirectUrl = (sourceDomain) => {
    if (!sourceDomain) {
        return '/'
    }

    if (sourceDomain.startsWith('http://') || sourceDomain.startsWith('https://')) {
        return sourceDomain
    }

    const protocol = window.location.hostname === 'localhost' ? 'http' : 'https'
    return `${protocol}://${sourceDomain}`
}

export default function LogoutPage() {
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        const redirect = searchParams.get('redirect')

        localStorage.removeItem('AuthToken')
        setAuthToken(false)

        window.location.replace(getRedirectUrl(redirect))
    }, [])

    return (
        <div className='min-h-screen flex items-center justify-center bg-white'>
            <div className='text-sm font-normal mb-4 text-black'>Signing out please wait…</div>
        </div>
    )
}
