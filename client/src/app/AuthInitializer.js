'use client'

import _ from "lodash"
import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { setAuthToken } from "../lib/set-auth-token"
import { appSettings, setIsProfileReadyAction, setReadyForRedirect } from "../../store/slices/authSlice"
import { getCurrentUserSession } from "../action/api"
import { getUserDetails, logoutUser } from "../action/users.action"
import { getAppSettings } from "../action/app-setting.action"
import { showCloseButtonOnChatScreen } from "../../store/slices/chatSlice"
import { useDispatch, useSelector } from "react-redux"
import store from "../../store"
import { logoutUserAction } from "../action/auth.action"
import { setMainScreenLoader } from "../../store/slices/modelSlice"
import { setSweetAlert } from "../../store/slices/sweetAlertSlice"

export default function AuthInitializer({ children }) {
    const dispatch = useDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const domain = searchParams.get('name')
    const auth = useSelector(state => state.auth)
    const chat = useSelector(state => state.chat)

    const getAppSettingsData = async (domain) => {
        const appSettingsData = await getAppSettings(domain)
        if (appSettingsData.success) {
            dispatch(appSettings(appSettingsData.data))
            return true
        } else {
            dispatch(setSweetAlert({ description: appSettingsData.message }))
            return false
        }
    }

    useEffect(() => {
        if (pathname === '/logout') {
            dispatch(setIsProfileReadyAction())
            return
        }

        const authToken = localStorage.getItem('AuthToken')
        if (!authToken) {
            dispatch(setIsProfileReadyAction())
            return
        }
        const userDomain = domain || localStorage.getItem('currentDomain')
        if (!userDomain) return

        setAuthToken(authToken)

        let isMounted = true

        const init = async () => {
            try {
                const response = await getCurrentUserSession(authToken, dispatch)
                if (response === undefined || response === null || response?.success === 0) {
                    handleLogout()
                    return
                }
                const email = response?.data?.email || ''

                const isUserDetailsLoaded = await getUserDetails(dispatch, false, userDomain, email, router)
                if (!isUserDetailsLoaded) return

                const isAppSettingsLoaded = await getAppSettingsData(userDomain)
                if (!isAppSettingsLoaded) return

                if (!auth.isReady || !isMounted) return

                const { pathname } = window.location
                if (pathname === '/' && !domain) {
                    return
                }

                // 2️⃣ ALWAYS read fresh redux state
                const state = store.getState()
                const user = state.auth?.user

                if (!user?._id || state.auth.isReadyForRedirect === false) return

                dispatch(setReadyForRedirect(false))

                router.replace(`/model-profile/${userDomain}?name=${userDomain}`)
            } catch (error) {
                handleLogout()
            }
        }
        init()

        return () => {
            isMounted = false
        }
    }, [domain, pathname])

    const handleLogout = async () => {
        const access_token = localStorage.getItem('AuthToken')
        logoutUser(dispatch)

        // Logout API call
        const logoutData = {
            access_token: access_token
        }
        await logoutUserAction(logoutData, dispatch)

        router.push('/')
        dispatch(setMainScreenLoader(false))
    }

    useEffect(() => {
        if (pathname === '/logout') return

        if (!_.isEmpty(domain)) {
            getAppSettingsData(domain)
        }
    }, [domain, pathname])

    return children
}
