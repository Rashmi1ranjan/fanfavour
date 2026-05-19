import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import UniversalLoginAddAccountPopup from '@/components/modules/universal-login/UniversalLoginAddAccountPopup';
import UniversalLoginForgotPasswordPopup from '@/components/modules/universal-login/UniversalLoginForgotPasswordPopup';
import UniversalLoginMergeAccountPopup from '@/components/modules/universal-login/UniversalLoginMergeAccountPopup';
import AuthRegisterContent from './AuthRegisterContent';
import { ADD_ACCOUNT, MERGE_ACCOUNT, REGISTER } from '@/lib/constant';
import Signup from './RegisterPage';
import { validateAllFields, validateField } from '@/lib/form-validation';
import { registerUser } from '@/action/auth.action';
import { registerButtonLoading } from '../../../../store/slices/registerSlice';
import Cookies from 'universal-cookie';
import { getAuthImages } from '@/action/api';
import { setFeedImages, setLoader } from '../../../../store/slices/modelSlice';

export default function AuthRegisterEntry(props) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirm_password: '',
        country_code: '',
        full_phone: '',
        terms: false
    })
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirm_password: '',
        country_code: '',
        terms: false
    })
    const [touched, setTouched] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const { modelList, featuredModel, feedImages, loader } = useSelector((state) => state.models)
    const auth = useSelector((state) => state.auth)
    const searchParams = useSearchParams()
    const model_name = searchParams.get('name')
    const allModels = [...modelList, ...featuredModel]
    const { showUniversalLoginPopup, showOldUserMergeAccountPopup, showUniversalLoginForgotPasswordPopup } = useSelector((state) => state.universalLogin)
    const { registerUserInfo, isLoading } = useSelector((state) => state.userRegister)
    const hasFetched = useRef(false)

    const model = useMemo(() => {
        return allModels.find(model => model.website_url === model_name)
    }, [model_name])

    const dispatch = useDispatch()
    const router = useRouter()

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target

        const fieldValue =
            type === 'checkbox'
                ? checked
                : name === 'email'
                    ? value.trim().toLowerCase()
                    : value.trim()

        const updatedFormData = {
            ...formData,
            [name]: fieldValue
        }

        setFormData(updatedFormData)

        /* ---------------- CLEAR ERRORS ---------------- */
        setErrors(prevErrors => {
            const newErrors = { ...prevErrors }

            // Remove error of current field
            delete newErrors[name]

            // 🔥 KEY FIX: remove password mismatch error when typing either field
            if (name === 'password' || name === 'confirm_password') {
                delete newErrors.password
                delete newErrors.confirm_password
            }

            return newErrors
        })

        /* ---------------- RE-VALIDATE IF TOUCHED ---------------- */
        if (touched[name]) {
            const fieldError = validateField(name, fieldValue, updatedFormData)
            setErrors(prev => ({ ...prev, ...fieldError }))
        }
    }

    const handlePhoneChange = (value, meta) => {
        if (!meta || !meta.country) return;

        const dial = `+${meta.country.dialCode}`

        // remove dial from the full formatted 'value'
        const phone = value.startsWith(dial)
            ? value.slice(dial.length).trim()
            : value
        // IMPORTANT: store full value (value) for UI
        setFormData(prev => ({
            ...prev,
            full_phone: value,        // control UI
            country_code: meta.country.iso2,       // IN
            phone_number: phone      // number without dial
        }))
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
            name: true,
            email: true,
            password: true,
            confirm_password: true,
            terms: true
        })
        const isValid = validateAll()
        if (!isValid) return
        const cookies = new Cookies()
        const utm_params = cookies.get('pcp_utm_params', { doNotParse: false })
        const userData = {
            ...formData,
            sourceDomain: model?.website_url || model_name,
            utm_params: utm_params
        }
        dispatch(registerButtonLoading(true))
        let requestFrom = requestData()
        const response = await registerUser(userData, dispatch, router, requestFrom)
        if (response && response.status === true) {
            props.handleCleanRef()
        }
    }

    const registerAndAddUserInUniversalLogin = async () => {
        const { name, email, password, confirm_password, phone_number, sourceDomain, utm_params } = registerUserInfo

        const newUser = {
            name: name,
            email: email,
            password: password,
            confirm_password: confirm_password,
            phone_number: phone_number,
            utm_params: utm_params,
            sourceDomain: sourceDomain,
            isFFUser: true
        }

        showOldUserMergeAccountPopup ? newUser.action = MERGE_ACCOUNT : newUser.action = ADD_ACCOUNT
        dispatch(registerButtonLoading(true))
        let requestFrom = requestData()
        const response = await registerUser(newUser, dispatch, router, requestFrom)
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

    // Guard: Don't show register popup if user is already authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('AuthToken') !== null) {
        return null
    }

    return (
        <>
            {isDesktop ? (
                !loader &&
                <Signup
                    {...props}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    model={model}
                    errors={errors}
                    isLoading={isLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    showConfirmPassword={showConfirmPassword}
                    formData={formData}
                    feedImages={feedImages}
                    loader={loader}
                />
            ) : (
                <AuthRegisterContent
                    {...props}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    model={model}
                    errors={errors}
                    isLoading={isLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    showConfirmPassword={showConfirmPassword}
                    formData={formData}
                />

            )}
            {showUniversalLoginPopup &&
                <UniversalLoginAddAccountPopup
                    registerUserAndAddInUniversalLogin={registerAndAddUserInUniversalLogin}
                    requestFrom={REGISTER}
                />
            }
            {showUniversalLoginForgotPasswordPopup &&
                <UniversalLoginForgotPasswordPopup
                    requestFrom={REGISTER}
                    website_url={model?.website_url || model_name}
                />
            }
            {showOldUserMergeAccountPopup &&
                <UniversalLoginMergeAccountPopup
                    registerUserAndAddInUniversalLogin={registerAndAddUserInUniversalLogin}
                    requestFrom={REGISTER}
                    website_url={model?.website_url || model_name}
                />
            }
        </>
    )
}