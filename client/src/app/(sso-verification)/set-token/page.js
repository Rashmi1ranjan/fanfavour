'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ssoLogin } from '@/action/sso.action'
import { useDispatch } from 'react-redux'
import SSOLoading from '@/components/common/SSOLoading'

export default function SetToken() {
    const searchParams = useSearchParams()
    const dispatch = useDispatch()

    useEffect(() => {
        async function loginIntoFF() {
            const token = searchParams.get('t')
            const redirect = searchParams.get('redirect')
            if (token) {
                const data = {
                    token: token,
                    source_domain: redirect
                }
                await ssoLogin(data, dispatch)
                const protocol = window.location.hostname === 'localhost' ? 'http' : 'https'
                return window.location.replace(`${protocol}://${redirect}/`)
            }
        }
        loginIntoFF()
    }, [searchParams, dispatch])

    return <SSOLoading />
}
