'use client'
import _ from 'lodash'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getFeaturedModel, getModelList } from '../action/api'
import {
	storeModelList,
	setTotalPages,
	setCurrentPage,
	storeFeaturedModel,
	setFeaturedModelText,
	setFullScreenLoader,
	setFeedImages
} from '../../store/slices/modelSlice'
import Loader from '../components/common/Loader'
import React from 'react'
import { isIOS } from 'react-device-detect'
import FullScreenLoader from '../components/common/FullScreenLoader'
import AuthRegisterEntry from '../components/modules/register/AuthRegisterEntry'
import AuthEntry from '../components/modules/login/AuthEntry'
import ForgotPasswordEntry from '../components/modules/login/ForgotPasswordEntry'
import { setIsShowLoginPopup, setIsShowForgotPasswordPopup } from '../../store/slices/loginSlice'
import { setIsShowRegisterPopup } from '../../store/slices/registerSlice'
import Link from 'next/link'

const ModelCard = React.memo(function ModelCard({ model, handleClick, handleProfileRedirect }) {
	return (
		<div className='relative h-[300px] md:h-auto rounded-lg overflow-hidden shadow-lg group cursor-pointer'>
			{model.image ?
				<Image
					src={model.image || ''}
					alt={model.model_name}
					className='w-full h-[400px] object-cover rounded-lg group-hover:opacity-90 select-none'
					width={800}
					height={800}
					onContextMenu={(e) => e.preventDefault()}
					style={{ WebkitTouchCallout: 'none' }}
					onClick={() => handleClick(model.website_url)}
					draggable={false}
				/> : null}
			<div className='absolute bottom-3 left-2 flex items-center gap-3 text-sm'>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 24 24'
					fill='none'
					stroke='white'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
					className='w-6 h-6'
				>
					<path d='M20.8 4.6c-1.9-1.7-4.8-1.5-6.5.3L12 7.3l-2.3-2.4c-1.7-1.8-4.6-2-6.5-.3-2.1 1.8-2.2 5-0.3 7L12 21.3l9.1-9.6c1.9-2 1.8-5.2-0.3-7z' />
				</svg>
				<span className='text-white font-semibold'>{model.likes}</span>
			</div>
			<button
				type='button'
				aria-label={`Open ${model.model_name} profile`}
				onClick={() => handleProfileRedirect(model.website_url)}
				className='rounded-full absolute bottom-3 right-2 flex items-center gap-3 text-sm bg-pink-600 cursor-pointer'
			>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 24 24'
						fill='none'
						stroke='white'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className='w-7 h-7 rotate-270'
					>
						<polyline points='6 9 12 15 18 9' />
					</svg>
			</button>
		</div>
	)
})

const FeaturedModelCard = React.memo(function FeaturedModelCard({ model, featuredModelText, handleClick, handleProfileRedirect }) {
	return (
		<div className='col-span-2 md:col-span-1 md:h-auto'>
			<div className='relative w-full rounded-lg overflow-hidden border-3 border-[#FFD700]'>
				<Image
					src={model.image}
					alt={model.model_name}
					className='w-full h-[400px] object-cover rounded-lg group-hover:opacity-90 select-none cursor-pointer'
					width={800}
					height={800}
					onContextMenu={(e) => e.preventDefault()}
					style={{ WebkitTouchCallout: 'none' }}
					onClick={() => handleClick(model.website_url)}
					draggable={false}
				/>
				<div className='absolute top-2 left-2 px-3 py-1 text-3xl'>
					⭐
				</div>
				<div className='absolute top-2 right-2 bg-pink-500 text-white text-xs px-3 py-1 rounded-full shadow'>
					{featuredModelText || '🔥 Hot'}
				</div>
				<button
					type='button'
					aria-label={`Open ${model.model_name} profile`}
					onClick={() => handleProfileRedirect(model.website_url)}
					className='rounded-full absolute bottom-3 right-2 flex items-center gap-3 text-sm bg-pink-600 cursor-pointer'
				>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 24 24'
							fill='none'
							stroke='white'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='w-7 h-7 rotate-270'
						>
							<polyline points='6 9 12 15 18 9' />
						</svg>
				</button>
			</div>
		</div>
	)
})

export default function HomePage() {
	const [loading, setLoading] = useState(false)
	const ref = useRef()
	const fullScreenLoaderRef = useRef(false)
	const { modelList, currentPage, totalPages, featuredModel, featuredModelText, fullScreenLoader, loader } = useSelector((state) => state.models)
	const auth = useSelector((state) => state.auth)
	const { isShowLoginPopup, isShowForgotPasswordPopup } = useSelector((state) => state.userLogin)
	const { isShowRegisterPopup } = useSelector((state) => state.userRegister)

	const loadingRef = useRef(false)
	const prevPageRef = useRef(0)
	const isInitialLoad = useRef(true)
	const dispatch = useDispatch()
	const router = useRouter()
	const searchParams = useSearchParams()
	const domain = searchParams.get('name')
	const popup = searchParams.get('popup')

	const handleClick = (website_url) => {
		if (localStorage.getItem('AuthToken') !== null) {
			router.push(`/model-profile/${website_url}?name=${website_url}`)
		} else {
			router.push(`?name=${website_url}&popup=login`)
		}
	}

	const handleProfileRedirect = (website_url) => {
		router.push(`/model-profile/${website_url}?name=${website_url}`)
	}

	useEffect(() => {
		const isAuthenticated = localStorage.getItem('AuthToken') !== null
		
		if (popup) {
			// Only show auth popups for unauthenticated users
			if (isAuthenticated) {
				router.push(`/`, { shallow: true })
				dispatch(setIsShowLoginPopup(false))
				dispatch(setIsShowRegisterPopup(false))
				dispatch(setIsShowForgotPasswordPopup(false))
				return
			}
			
			if (!domain) {
				router.push('/', { shallow: true })
				dispatch(setIsShowLoginPopup(false))
				dispatch(setIsShowRegisterPopup(false))
				dispatch(setIsShowForgotPasswordPopup(false))
			} else {
				if (popup === 'login') {
					dispatch(setIsShowLoginPopup(true))
					dispatch(setIsShowRegisterPopup(false))
					dispatch(setIsShowForgotPasswordPopup(false))
				} else if (popup === 'register') {
					dispatch(setIsShowRegisterPopup(true))
					dispatch(setIsShowLoginPopup(false))
					dispatch(setIsShowForgotPasswordPopup(false))
				} else if (popup === 'forgot-password') {
					dispatch(setIsShowForgotPasswordPopup(true))
					dispatch(setIsShowLoginPopup(false))
					dispatch(setIsShowRegisterPopup(false))
				} else {
					router.push(`/?name=${domain}`, { shallow: true })
					dispatch(setIsShowLoginPopup(false))
					dispatch(setIsShowRegisterPopup(false))
					dispatch(setIsShowForgotPasswordPopup(false))
				}
			}
		} else {
			dispatch(setIsShowLoginPopup(false))
			dispatch(setIsShowRegisterPopup(false))
			dispatch(setIsShowForgotPasswordPopup(false))
			if (domain && !localStorage.getItem('AuthToken')) {
			    // According to req: `/?name=localplatform.com -> ❌ Invalid -> Redirect to /` 
				// However, if we just closed a popup, "Keep name intact: /?name=localplatform.com"
				// Not pushing strictly for `/?name=...` unless we need to clear state
			}
		}
	}, [popup, domain, dispatch, router])

	const handleRegisterPopup = () => {
		if (domain) router.push(`?name=${domain}&popup=register`, { scroll: false })
	}

	const handleLoginPopup = () => {
		if (domain) router.push(`?name=${domain}&popup=login`, { scroll: false })
	}

	const handleForgotPasswordPopup = () => {
		if (domain) router.push(`?name=${domain}&popup=forgot-password`, { scroll: false })
	}

	const handleBackToLogin = () => {
		if (domain) router.push(`?name=${domain}&popup=login`, { scroll: false })
	}

	const handleCleanRef = () => {
		ref.current = ''
	}

	const onClosePopup = () => {
		ref.current = ''
		if (domain) {
			router.push(`?name=${domain}`, { scroll: false })
		} else {
			router.push('/', { scroll: false })
		}
		
		dispatch(setIsShowLoginPopup(false))
		dispatch(setIsShowRegisterPopup(false))
		dispatch(setIsShowForgotPasswordPopup(false))
		dispatch(setFeedImages([]))
	}

	useEffect(() => {
		if ((localStorage.getItem('AuthToken') === null || auth.user.domain !== domain)) {
			const nav = performance.getEntriesByType('navigation')[0]
			ref.current = ''
			if (nav?.type === 'reload') {
				// Keep current query params if popup is open to avoid clearing the popup
				if (!popup) {
					router.push('/', { shallow: true })
				}
			}
		}
	}, [router, popup, domain, auth.user.domain])

	const loadMoreModels = async () => {
		if (loadingRef.current) return
		loadingRef.current = true
		setLoading(true)
		try {
			const response = await getModelList(currentPage)
			const existingIds = new Set(modelList.map(m => m._id))
			const newItems = response.data.rows.filter(m => !existingIds.has(m._id))
			dispatch(storeModelList([...modelList, ...newItems]))
			dispatch(setTotalPages(response.data.totalPages))
			const page = currentPage + 1
			dispatch(setCurrentPage(page))
			prevPageRef.current = page - 1
		} catch (err) {
			console.error('Failed to load models', err)
		} finally {
			setLoading(false)
			loadingRef.current = false
			isInitialLoad.current = false
		}
	}

	const featureModel = async () => {
		try {
			const response = await getFeaturedModel()
			dispatch(storeFeaturedModel(response.data.data))
			dispatch(setFeaturedModelText(response.data.text))
		} catch (err) {
			console.error('Failed to load models', err)
		}
	}

	useEffect(() => {
		loadMoreModels()
		featureModel()
	}, [])

	const handleScroll = () => {
		if (!loadingRef.current && currentPage < totalPages && prevPageRef.current === currentPage - 1) {
			const winScroll = document.documentElement.scrollTop || document.body.scrollTop
			const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
			const scrolled = winScroll / height
			if (scrolled > 0.98 || (isIOS === false && scrolled > 0.93)) loadMoreModels()
		}
	}

	useEffect(() => {
		window.addEventListener('scroll', handleScroll)
		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	})

	useEffect(() => {
		const referralValue = searchParams.get('ffr')

		if (referralValue) {
			localStorage.setItem('referral_value', referralValue)

			router.replace(window.location.pathname)
		}
	}, [searchParams])

	useEffect(() => {
		fullScreenLoaderRef.current = fullScreenLoader
	}, [fullScreenLoader])

	useEffect(() => {
		return () => {
			if (fullScreenLoaderRef.current) {
				dispatch(setFullScreenLoader(false))
			}
		}
	}, [dispatch])

	// Memoize the JSX for models so it doesn't rebuild every time
	const modelsJSX = useMemo(() => {
		return (
			<>
				{modelList && modelList.length > 0 && (
					<>
						<div className='grid grid-cols-2 gap-6 mb-6 md:hidden'>
							{modelList.slice(0, 2).map((model) => (
								<ModelCard loader={loader} key={model._id} model={model} handleClick={(name) => handleClick(name)} handleProfileRedirect={(name) => handleProfileRedirect(name)} />
							))}
						</div>
						<div className='hidden md:grid md:grid-cols-3 gap-6 mb-6'>
							{modelList.slice(0, 3).map((model) => (
								<ModelCard key={model._id} model={model} handleClick={(name) => handleClick(name)} handleProfileRedirect={(name) => handleProfileRedirect(name)} />
							))}
						</div>
					</>
				)}

				{featuredModel && featuredModel.length > 0 && (
					<>
						<h2 className='text-lg font-semibold mb-2 text-center'>⭐ Featured</h2>
						<div className='grid grid-cols-2 md:grid-cols-3 gap-6 mb-6'>
							{featuredModel.map((model, index) => (
								<FeaturedModelCard
									key={`featured-${model._id}`}
									model={model}
									featuredModelText={featuredModelText}
									handleClick={(name) => handleClick(name)}
									handleProfileRedirect={(name) => handleProfileRedirect(name)}
								/>
							))}
						</div>
					</>
				)}

				{modelList && modelList.length > 2 && (
					<div className='grid grid-cols-2 gap-6 md:hidden'>
						{modelList.slice(2).map((model) => (
							<ModelCard key={model._id} model={model} handleClick={(name) => handleClick(name)} handleProfileRedirect={(name) => handleProfileRedirect(name)} />
						))}
					</div>
				)}
				{modelList && modelList.length > 3 && (
					<div className='hidden md:grid md:grid-cols-3 gap-6'>
						{modelList.slice(3).map((model) => (
							<ModelCard key={model._id} model={model} handleClick={(name) => handleClick(name)} handleProfileRedirect={(name) => handleProfileRedirect(name)} />
						))}
					</div>
				)}
			</>
		)
	}, [modelList, featuredModel, featuredModelText])

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
		let mainComponent = document.getElementById('mainComponent')
		if (!isDesktop && (isShowLoginPopup || isShowRegisterPopup || isShowForgotPasswordPopup)) {
			mainComponent.classList.add('overflow-hidden')
			mainComponent.classList.add('max-h-[calc(100dvh-var(--navbar-height))]')
		} else {
			mainComponent.classList.remove('overflow-hidden')
			mainComponent.classList.remove('max-h-[calc(100dvh-var(--navbar-height))]')
		}

		return () => {
			mainComponent.classList.remove('overflow-hidden')
			mainComponent.classList.remove('max-h-[calc(100dvh-var(--navbar-height))]')
		}
	}, [isDesktop, isShowLoginPopup, isShowRegisterPopup, isShowForgotPasswordPopup])

	return (
		<div id='mainComponent'>

			{(loader || fullScreenLoader) && <FullScreenLoader />}
			{isShowLoginPopup && <AuthEntry onClosePopup={onClosePopup} handleRegisterPopup={handleRegisterPopup} handleForgotPasswordPopup={handleForgotPasswordPopup} handleCleanRef={handleCleanRef} />}
			{isShowRegisterPopup && <AuthRegisterEntry onClosePopup={onClosePopup} handleLoginPopup={handleLoginPopup} handleCleanRef={handleCleanRef} />}
			{isShowForgotPasswordPopup && <ForgotPasswordEntry onClosePopup={onClosePopup} handleBackToLogin={handleBackToLogin} />}
			<div className='min-h-[calc(100dvh-var(--navbar-height))] bg-[#1a0033] text-white px-4 md:px-10 pt-3'>
				<div className='md:col-span-3'>
					<div className='max-w-[1000px] mx-auto'>
						<h2 className='text-lg font-semibold mb-4 text-center'>🚀 Trending</h2>
						<div className='pb-6'>
							{modelsJSX}
							<div className='p-6 wi-full text-center'>
								<Loader isLoading={loading} size={10} />
							</div>
						</div>
					</div>
				</div>
				<div className='w-full border-pink-300 text-center z-50 hidden sm:block'>
					<div className='flex flex-row flex-wrap justify-center items-center gap-2 md:gap-4 py-6 text-sm text-gray-700'>
						<a
							href='https://instagram.com/_highlifemedia'
							target='_blank'
							rel='noopener noreferrer'
							className='underline text-[#fff] text-[14px] md:text-[16px]'
						>
							Instagram
						</a>
						<a
							href='https://www.highlife.media'
							target='_blank'
							rel='noopener noreferrer'
							className='underline text-[#fff] text-[14px] md:text-[16px]'
						>
							Powered by Highlife Media
						</a>
						<Link
							href={domain ? `/contact-us?name=${domain}` : '/contact-us'}
							className='underline text-[#fff] text-[14px] md:text-[16px]'
						>
							Contact Us
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
