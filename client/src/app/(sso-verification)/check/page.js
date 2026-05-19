'use client'
import { generateWebsiteTempToken } from '@/action/sso.action'
import SSOLoading from '@/components/common/SSOLoading'
import _ from 'lodash'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

export default function Check() {
    const searchParams = useSearchParams()
    const auth = useSelector(state => state.auth)
    const email = _.get(auth, 'user.email', '')

    useEffect(() => {
        if (localStorage.getItem('AuthToken')) {
            const getToken = async (email) => {
                const token = await getWebsiteTempToken(email)
                return window.location.replace(`${searchParams.get('redirect')}/set-token?counter=1&token=${token}&source-domain=${window.location.hostname}`)
            }
            if (email) {
                getToken(email)
            }
        } else {
            window.location.replace(`${searchParams.get('redirect')}/${searchParams.get('page')}?&counter=1`)
        }
    }, [email])

    const getWebsiteTempToken = async (email) => {
        const data = {
            access_token: localStorage.getItem('AuthToken'),
            source_domain: window.location.hostname,
            email: email
        }

        return await generateWebsiteTempToken(data)
    }
    return <SSOLoading />
}
