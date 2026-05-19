'use client'
import Image from 'next/image'
import React, { useEffect, useState, Suspense, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../../action/users.action'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut, User, WalletMinimal, MessageCircle, Newspaper, Home, Mail } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { setMainScreenLoader } from '../../../store/slices/modelSlice'
import { resetChatData, showCloseButtonOnChatScreen } from '../../../store/slices/chatSlice'
import { setReadyForRedirect } from '../../../store/slices/authSlice'
import { logoutUserAction } from '../../action/auth.action'
import BackButton from './BackButton'
import Link from 'next/link'
import { getCloudFrontAssetsUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// NOTE: Don't call any API in this component since it's used in the layout and will be rendered on every page. Only use data from the Redux store or props passed down from the parent component (layout).
export function NavbarContent() {
    const [isOpen, setIsOpen] = useState(false)
    const auth = useSelector(state => state.auth)
    const chat = useSelector(state => state.chat)
    const { isAuthenticated } = auth
    const { email } = auth.user

    const dispatch = useDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const domainName = searchParams?.get('name')
    const slug = pathname.split('/').pop()

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', isOpen)
    }, [isOpen])

    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

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
        if (isOpen) {
            setIsOpen(false)
        }
    }

    const handleBack = () => {
        router.back()
    }

    useEffect(() => {
        const { pathname, search } = window.location
        if (pathname === '/' && search) {
            const params = new URLSearchParams(search)
            if (!params.has('name') && !params.has('popup') && !params.has('ffr')) {
                router.replace('/')
            }
            return
        }
    }, [pathname, router])

    const handleRedirectHome = () => {
        router.replace('/')
        dispatch(resetChatData())
    }

    const renderNavIcon = () => {
        const isChatOpen = pathname.startsWith('/private-chat')

        if (isChatOpen) {
            return (
                <div
                    className='relative flex items-center justify-center cursor-pointer'
                    onClick={handleRedirectToChat}
                    title="Model Profile"
                >
                    <Newspaper size={32} color='white' strokeWidth={1.5} />
                </div>
            )
        }

        return (
            <div
                className='relative flex items-center justify-center cursor-pointer'
                onClick={handleRedirectToChat}
                title="Chat"
            >
                <MessageCircle size={32} color='white' strokeWidth={1.5} />
                {(auth.counts?.userUnreadMessage > 0) && (
                    <span className='absolute -top-1 -right-2 bg-[#ff1a9d] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md'>
                        {auth.counts.userUnreadMessage > 99 ? '99+' : auth.counts.userUnreadMessage}
                    </span>
                )}
            </div>
        )
    }

    const handleRedirectToChat = () => {
        if (pathname.startsWith('/private-chat')) {
            const selectedUser = chat?.userList?.find(u => u._id === chat?.selectedUserId)
            const targetDomain = selectedUser?.domain || auth.user?.domain
            router.push(`/model-profile/${targetDomain}?name=${targetDomain}`)
            return
        }

        if (pathname.startsWith('/model-profile/')) {
            const modelDomain = pathname.split('/').filter(Boolean).pop()
            const selectedModel = chat?.userList?.find(
                user =>
                    user.domain === modelDomain ||
                    user.website_url === modelDomain
            )
            const targetWebsiteId = selectedModel?.website_id || modelDomain

            router.push(`/private-chat/${targetWebsiteId}?name=${auth.user?.domain}`)
            return
        }

        router.push(`/private-chat?name=${auth.user?.domain}`)
    }
    const handleRedirectFeed = () => {
        dispatch(setReadyForRedirect(false))
        dispatch(showCloseButtonOnChatScreen(true))
        router.push(`/feed?name=${auth.user?.domain}`)
    }
    useEffect(() => {
        const authToken = localStorage.getItem('AuthToken')
        if (authToken && authToken.startsWith('Bearer ')) {
            localStorage.removeItem('AuthToken')
            router.push('/')
        }
    }, [])

    const navbarRef = useRef(null)

    useEffect(() => {
        if (!navbarRef.current) return

        const updateHeight = () => {
            const height = navbarRef.current.offsetHeight
            document.documentElement.style.setProperty('--navbar-height', `${height}px`)
        }

        const resizeObserver = new ResizeObserver(updateHeight)
        resizeObserver.observe(navbarRef.current)
        updateHeight()

        return () => resizeObserver.disconnect()
    }, [])

    return (
        <div ref={navbarRef} className={`navbar sticky top-0 z-20 xl:top-0 xl:left-0 w-full bg-[#1a0033] px-4 md:px-10`}>
            <div className='relative flex h-16 items-center'>
                {/* LEFT (Hamburger + Back Button) */}
                <div className='flex items-center gap-2'>
                    {/* Mobile Hamburger */}
                    <button
                        className='md:hidden p-2 z-101'
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isOpen ?
                            <span className='h-12 w-12'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 24 24'
                                    className='h-5 w-5'
                                    fill='none'
                                    stroke='white'
                                    strokeWidth='2.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                >
                                    <path d='M6 6l12 12M18 6L6 18' />
                                </svg>
                            </span>
                            :
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='w-6 h-6'
                                fill='white'
                                viewBox='0 0 24 24'
                                stroke='white'
                                strokeWidth={2}
                            >
                                <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h16' />
                            </svg>
                        }
                    </button>

                    {isAuthenticated && (
                        <Suspense fallback={null}>
                            <BackButton slug={slug} handleBack={handleBack} />
                        </Suspense>
                    )}
                </div>

                {/* CENTER LOGO (TRUE CENTER) */}
                <div className='absolute left-1/2 -translate-x-1/2 z-101'>
                    <Image
                        src={`${getCloudFrontAssetsUrl('static-images/logo.png')}`}
                        alt='Logo'
                        className='w-32 sm:w-36 md:w-40 cursor-pointer'
                        width={400}
                        height={400}
                        draggable={false}
                        priority
                        onClick={handleRedirectHome}
                    />
                </div>

                {/* RIGHT (Mobile Icons + Desktop Menu) */}
                <div className='ml-auto flex items-center gap-4'>

                    {isAuthenticated && (
                        <div className='flex md:hidden items-center gap-4'>
                            <button
                                className={cn('relative flex items-center justify-center', pathname.startsWith('/feed') ? 'opacity-50' : 'cursor-pointer')}
                                onClick={handleRedirectFeed}
                                title="Home"
                                disabled={pathname.startsWith('/feed')}
                            >
                                <Home size={32} color='white' strokeWidth={1.5} />
                            </button>
                            {renderNavIcon()}
                        </div>
                    )}

                    {/* Desktop User Menu */}
                    {isAuthenticated && (
                        <div className='hidden md:flex items-center gap-4 text-white'>
                            {/* {auth.user.default_payment_method === 'crypto_currency' && (
                                <div className='flex flex-row gap-1 items-center'>
                                    <WalletMinimal />
                                    <span className='text-sm font-medium'>${Number(auth.user.wallet_amount || 0).toFixed(2)}</span>
                                </div>
                            )} */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className='flex items-center gap-1 text-sm font-medium cursor-pointer'>
                                        <span className='truncate max-w-[200px]'>{email}</span>
                                        <span
                                            className='inline-block w-0 h-0
                                                border-l-[4px] border-l-transparent
                                                border-r-[4px] border-r-transparent
                                                border-t-[6px] border-t-[#F59E0B]'
                                        />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end' sideOffset={8} className='w-40'>
                                    <DropdownMenuItem className='cursor-pointer' onClick={() => { router.push(`/profile/update?name=${auth.user.domain}`) }}>
                                        <User className='mr-2 h-4 w-4' />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer' onClick={() => { router.push(`/contact-us?name=${auth.user.domain}`) }}>
                                        <Mail className='mr-2 h-4 w-4' />
                                        Contact us
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className='cursor-pointer' onClick={handleLogout}>
                                        <LogOut className='mr-2 h-4 w-4' />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <span className='h-14 w-[1.7px] bg-[#fff]/22' />
                            {/* Desktop Home & Bell */}
                            <button
                                className={cn('relative flex items-center justify-center', pathname.startsWith('/feed') ? 'opacity-50' : 'cursor-pointer')}
                                onClick={handleRedirectFeed}
                                title="Home"
                                disabled={pathname.startsWith('/feed')}
                            >
                                <Home size={32} color='white' strokeWidth={1.5} />
                            </button>
                            {renderNavIcon()}
                            {/* <svg
                                className='w-12 h-12 cursor-pointer'
                                viewBox='-4 -4 64 64'
                                xmlns='http://www.w3.org/2000/svg'
                                onClick={handleRedirectToChat}
                            >
                                <circle cx='32' cy='34' r='22' fill='white' />
                                <path
                                    d='M32 46c1.5 0 2.7-1.2 2.7-2.7h-5.4c0 1.5 1.2 2.7 2.7 2.7zm8-7v-7.2c0-4.1-2.2-7.6-6.1-8.5v-.9c0-1.1-.9-2-2-2s-2 .9-2 2v.9c-3.9.9-6.1 4.4-6.1 8.5V39l-2.7 2.7v1.3h19.6v-1.3L40 39z'
                                    fill='none'
                                    stroke='#7b3fe4'
                                    strokeWidth='1'
                                />
                                <circle cx='12' cy='12' r='15' fill='#ff1a9d' />
                                <text x='12' y='17' textAnchor='middle' fontSize='13' fontWeight='700' fill='white'>
                                    {auth.counts.userUnreadMessage > 99 ? '99+' : (auth.counts.userUnreadMessage || 0)}
                                </text>
                            </svg> */}
                        </div>
                    )}
                </div>
            </div>
            {/* Mobile menu */}
            {isOpen && (
                <div className='fixed top-0 pt-20 right-0 w-full bg-[#1a0033] flex items-start justify-center p-6 max-w-full h-full mt-0 z-100'>
                    <div className='py-1' role='none'>
                        <div className='fixed top-0 pt-20 right-0 w-full flex items-start justify-center p-6 max-w-full h-full mt-0'>
                            <div className='py-1 w-full divide-y divide-white/60' role='none'>
                                <a
                                    href='https://www.highlife.media'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-white-700 block px-4 py-2 text-lg hover:underline w-full text-center text-white'
                                    role='menuitem'
                                    tabIndex='-1'
                                    title='Become a model'
                                >
                                    Become a model
                                </a>
                                <a
                                    href='https://instagram.com/_highlifemedia'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-white-700 block px-4 py-2 text-lg hover:underline w-full text-center text-white'
                                    role='menuitem'
                                    tabIndex='-1'
                                    title='Instagram'
                                >
                                    Instagram
                                </a>
                                <Link
                                    href={domainName ? `/contact-us?name=${domainName}` : '/contact-us'}
                                    className='text-white-700 block px-4 py-2 text-lg hover:underline w-full text-center text-white'
                                    role='menuitem'
                                    tabIndex='-1'
                                    title='Contact Us'
                                >
                                    Contact Us
                                </Link>
                                {isAuthenticated &&
                                    <>
                                        <div
                                            onClick={() => { router.push(`/profile?name=${auth.user.domain}`); setIsOpen(!isOpen) }}
                                            className='text-white-700 block px-4 py-2 text-lg w-full text-center text-white cursor-pointer'
                                        >
                                            Profile
                                        </div>
                                        <div
                                            onClick={() => handleLogout()}
                                            className='text-white-700 block px-4 py-2 text-lg w-full text-center text-white cursor-pointer'
                                        >
                                            Logout
                                        </div>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div >
    )
}

export default function Navbar() {
    const pathname = usePathname()
    
    // Paths where navbar should NOT be shown
    const excludedPaths = ['/check', '/set-token', '/logout']
    
    const isExcludedPath = excludedPaths.some(path => pathname === path)
    
    if (isExcludedPath) {
        return null
    }
    
    return (
        <Suspense fallback={null}>
            <NavbarContent />
        </Suspense>
    )
}
