import { ADD_ACCOUNT, LOGIN, MERGE_ACCOUNT } from '@/lib/constant';
import UniversalLoginAddAccountPopup from '@/components/modules/universal-login/UniversalLoginAddAccountPopup';
import UniversalLoginForgotPasswordPopup from '@/components/modules/universal-login/UniversalLoginForgotPasswordPopup';
import UniversalLoginMergeAccountPopup from '@/components/modules/universal-login/UniversalLoginMergeAccountPopup';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import AuthContent from './AuthContent';
import SignInPage from './LoginPage';
import { loginButtonLoading } from '../../../../store/slices/loginSlice';
import { loginUser } from '@/action/auth.action';
import { validateAllFields, validateField } from '@/lib/form-validation';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthImages } from '@/action/api';
import { setFeedImages, setLoader } from '../../../../store/slices/modelSlice';

export default function AuthEntry(props) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({ email: '', password: '' })
    const [touched, setTouched] = useState({})
    const { modelList, featuredModel, feedImages, loader } = useSelector((state) => state.models)
    const { showUniversalLoginPopup, showOldUserMergeAccountPopup, showUniversalLoginForgotPasswordPopup } = useSelector((state) => state.universalLogin)
    const { loginUserInfo, isLoading } = useSelector((state) => state.userLogin)
    const auth = useSelector((state) => state.auth)
    const searchParams = useSearchParams()
    const model_name = searchParams.get('name')
    const allModels = [...modelList, ...featuredModel]
    const hasFetched = useRef(false)

    const router = useRouter()
    const dispatch = useDispatch()

    const model = useMemo(() => {
        return allModels.find(model => model.website_url === model_name)
    }, [model_name])


    const handleChange = (e) => {
        const { name, value } = e.target

        const formattedValue = name === 'email' ? value.trim().toLowerCase() : value.trim()

        setFormData(prev => ({ ...prev, [name]: formattedValue }))

        setErrors((prevErrors) => {
            const rest = Object.fromEntries(
                Object.entries(prevErrors).filter(([key]) => key !== name)
            )
            return rest
        })

        if (touched[name]) {
            const fieldError = validateField(name, value, formData)
            setErrors((prev) => ({ ...prev, ...fieldError }))
        }
    }

    const validateAll = () => {
        const allErrors = validateAllFields(formData)
        setErrors(allErrors)
        return Object.keys(allErrors).length === 0
    }

    const requestData = () => {
        let requestFrom = 'newRegisterPage'
        if (auth.appSettings.enable_ccbill_rest_api === true) {
            requestFrom = 'ccbillRestApi'
        }
        if (auth.appSettings.is_sticky_io_enabled === true) {
            requestFrom = 'stickyIo'
        }
        return requestFrom
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setTouched({
            email: true,
            password: true
        })
        const isValid = validateAll()
        if (!isValid) return
        const userData = {
            ...formData,
            sourceDomain: model?.website_url || model_name
        }
        dispatch(loginButtonLoading(true))
        const requestFrom = requestData()
        const response = await loginUser(userData, dispatch, router, requestFrom)
        if (response && response.status === true) {
            props.handleCleanRef()
        }
    }

    const loginAndAddUserInUniversalLogin = async () => {
        const { email, password, sourceDomain } = loginUserInfo

        const userData = {
            email: email,
            password: password,
            sourceDomain: sourceDomain
        }

        showOldUserMergeAccountPopup ? userData.action = MERGE_ACCOUNT : userData.action = ADD_ACCOUNT
        dispatch(loginButtonLoading(true))
        const requestFrom = requestData()
        const response = await loginUser(userData, dispatch, router, requestFrom)
        if (response && response.status === true) {
            props.handleCleanRef()
        }
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

    // Guard: Don't show login popup if user is already authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('AuthToken') !== null) {
        return null
    }

    return (
        <>
            {isDesktop ? (
                !loader &&
                <SignInPage
                    {...props}
                    model={model}
                    handleSubmit={handleSubmit}
                    handleChange={handleChange}
                    errors={errors}
                    isLoading={isLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    formData={formData}
                    feedImages={feedImages}
                    loader={loader}
                />
            ) : (
                <AuthContent
                    {...props}
                    model={model}
                    handleSubmit={handleSubmit}
                    handleChange={handleChange}
                    errors={errors}
                    isLoading={isLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    formData={formData}

                />
            )}
            {
                showUniversalLoginPopup &&
                <UniversalLoginAddAccountPopup
                    loginUserAndAddInUniversalLogin={loginAndAddUserInUniversalLogin}
                    requestFrom={LOGIN}
                />
            }
            {
                showUniversalLoginForgotPasswordPopup &&
                <UniversalLoginForgotPasswordPopup
                    requestFrom={LOGIN}
                    website_url={model?.website_url || model_name}
                />
            }
            {
                showOldUserMergeAccountPopup &&
                <UniversalLoginMergeAccountPopup
                    loginUserAndAddInUniversalLogin={loginAndAddUserInUniversalLogin}
                    requestFrom={LOGIN}
                    website_url={model?.website_url || model_name}
                />
            }
        </>
    )
}