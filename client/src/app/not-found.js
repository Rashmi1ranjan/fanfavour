'use client'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'

export default function NotFound() {
    const router = useRouter()
    const auth = useSelector((state) => state.auth)

    const handleRedirect = () => {
        if (auth.isAuthenticated) {
            router.push(`/feed?name=${auth.user.domain}`)
        } else {
            router.push('/')
        }
    }
    return (
        <div className='min-h-[calc(100dvh-var(--navbar-height))] flex flex-col items-center justify-center bg-white text-center px-6'>

            <h1 className='text-6xl font-bold text-pink-500'>404</h1>

            <p className='mt-4 text-xl font-semibold text-gray-800'>
                Page Not Found
            </p>

            <p className='mt-2 text-gray-500'>
                The page you are looking for doesn’t exist.
            </p>

            <div
                onClick={handleRedirect}
                className='mt-6 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition'
            >
                Go Home
            </div>

        </div>
    )
}