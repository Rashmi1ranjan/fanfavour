import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { emailRegex } from '@/lib/constant'
import { forgotPassword } from '@/action/auth.action'
import { getAuthImages } from '@/action/api'
import { setFeedImages, setLoader } from '../../../../store/slices/modelSlice'
import ForgotPasswordPage from './ForgotPasswordPage'
import ForgotPasswordContent from './ForgotPasswordContent'

export default function ForgotPasswordEntry(props) {
    const [errors, setErrors] = useState({ email: '' })
    const [isLoading, setIsLoading] = useState(false)
    const { modelList, featuredModel, feedImages, loader } = useSelector((state) => state.models)
    const searchParams = useSearchParams()
    const model_name = searchParams.get('name')
    const allModels = [...modelList, ...featuredModel]
    const hasFetched = useRef(false)

    const dispatch = useDispatch()

    const model = useMemo(() => {
        return allModels.find(model => model.website_url === model_name)
    }, [model_name, modelList, featuredModel])

    const handleChange = (e) => {
        const { name } = e.target
        setErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const email = e.target.email.value.trim().toLowerCase()

        const emailErrors = {}
        if (!email) {
            emailErrors.email = 'Email is required.'
        } else if (!emailRegex.test(email)) {
            emailErrors.email = 'Enter a valid email address.'
        }
        setErrors(emailErrors)
        if (Object.keys(emailErrors).length > 0) return

        setIsLoading(true)
        const data = {
            email: email,
            domain: model?.website_url || model_name || '',
            requestFrom: 'forgot_password'
        }
        const response = await forgotPassword(data, dispatch)
        if (response && response.status === true) {
            props.handleBackToLogin()
        }
        setIsLoading(false)
    }

    const isDesktop = useSyncExternalStore(
        (callback) => {
            const media = window.matchMedia('(min-width: 768px)')
            media.addEventListener('change', callback)
            return () => media.removeEventListener('change', callback)
        },
        () => window.matchMedia('(min-width: 768px)').matches,
        () => false // SSR fallback
    )

    useEffect(() => {
        if (!model_name) return
        if (hasFetched.current) return

        const getFeedImage = async () => {
            try {
                dispatch(setLoader(true))
                const response = await getAuthImages(model_name)
                if (response.success === 1) {
                    dispatch(setFeedImages(response.data))
                }
                dispatch(setLoader(false))
            } catch (err) {
                dispatch(setLoader(false))
            }
        }

        if (feedImages.length === 0) {
            getFeedImage()
        }
        hasFetched.current = true

    }, [model_name])

    // Guard: Don't show forgot password popup if user is already authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('AuthToken') !== null) {
        return null
    }

    return (
        <>
            {isDesktop ? (
                !loader &&
                <ForgotPasswordPage
                    {...props}
                    model={model}
                    handleSubmit={handleSubmit}
                    handleChange={handleChange}
                    errors={errors}
                    isLoading={isLoading}
                    feedImages={feedImages}
                    loader={loader}
                />
            ) : (
                <ForgotPasswordContent
                    {...props}
                    model={model}
                    handleSubmit={handleSubmit}
                    handleChange={handleChange}
                    errors={errors}
                    isLoading={isLoading}
                />
            )}
        </>
    )
}
