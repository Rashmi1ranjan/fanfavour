import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import Error404 from './Error404'
import FullScreenLoader from '../common/FullScreenLoader'

const isAllowed = (
    roles,
    isAdmin,
    isContentManager,
    isModel,
    isSuperAdmin,
    isSupport,
    isSubAdmin,
    isLiveStreamManager
) => {
    let user_role = 'user'

    if (isAdmin && isContentManager) {
        user_role = 'content_manager'
    } else if (isAdmin && isModel) {
        user_role = 'model'
    } else if (isAdmin && isSuperAdmin) {
        user_role = 'admin'
    } else if (isAdmin && isSupport) {
        user_role = 'support'
    } else if (isAdmin && isSubAdmin) {
        user_role = 'sub_admin'
    } else if (isAdmin && isLiveStreamManager) {
        user_role = 'live_stream_manager'
    }

    return roles.includes(user_role)
}

const redirectRoute = () => {
    if (typeof window !== 'undefined') {
        const currentRoute = window.location.href
        const actualRoute = currentRoute.split('/')
        const verificationSource = actualRoute[actualRoute.length - 2]

        if (['opt-in-email-verification', 'change-email-verification'].includes(verificationSource)) {
            localStorage.setItem('routeBeforeLogin', window.location.href)
        }
    }
}

export function withPrivateRoute(Component, allowRoles) {
    return function PrivatePage(props) {

        const router = useRouter()
        const auth = useSelector((state) => state.auth)

        if (auth.isProfileReady === false) {
            return <FullScreenLoader bgColor='#fff' />
        }

        if (!auth?.isAuthenticated) {
            redirectRoute()
            router.push('/')
        }

        const allowed = isAllowed(
            allowRoles,
            auth.isAdmin,
            auth.isContentManager,
            auth.isModel,
            auth.isSuperAdmin,
            auth.isSupport,
            auth.isSubAdmin,
            auth.user?.role === 'live_stream_manager'
        )

        if (!allowed) {
            return <Error404 />
        }
        return <Component {...props} />
    }
}
