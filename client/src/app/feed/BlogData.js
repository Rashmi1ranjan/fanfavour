import _ from 'lodash'
import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter } from 'next/navigation'
import { Video, Image, Eye, MessageCircle, HeartIcon } from 'lucide-react'
import { getCloudFrontAssetsUrl } from "../../lib/assets"
import { cn } from "../../lib/utils"
import BlogMedia from "./BlogMedia"
import FullScreenModelPopUpDialog from '../../components/modals/FullScreenModelDialogPopup'
import Button from '../../components/common/Button'
import clsx from 'clsx'
import cleanDomain from '@/lib'
import { likeOrDislikeBlog } from '@/action/blog.action'


export default function BlogData(props) {
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [isDialogueOpen, setIsDialogueOpen] = useState(false)
    const [isFeedLikeEnabled, setIsFeedLikeEnabled] = useState(false)
    const [isFeedCommentEnabled, setIsFeedCommentEnabled] = useState(false)
    const [enableLike, setEnableLike] = useState(true)
    const auth = useSelector(state => state.auth)
    const dispatch = useDispatch()
    const router = useRouter()
    const pathname = usePathname()
    const {
        media,
        isLocked,
        isPreviewEnable,
        is_published,
        openDlgBlog,
        lock,
        blur,
        index,
        id,
        userIndex,
        contentCount,
        role,
        isDesktop,
        currentMediaIndex,
        blogType,
        amount,
        lineThroughColor,
        isPaymentProcessing,
        unlockContent,
        getDiscountPrice,
        promotionPercentage,
        content_length,
        show_content_length,
        media_preview,
        description,
        website_url,
        total_likes,
        total_comments,
        user_feed_like,
        showLikeAndComments = true,
        showLike = true,
        showComment = true,
        disableFixedHeight = false,
        disableCommentNavigation = false,
        showMedia = true,
        isSubscribedToWebsite
    } = props
    const [likeCount, setLikeCount] = useState(Number(total_likes || 0))
    const [userFeedLikeState, setUserFeedLikeState] = useState(Number(user_feed_like || 0))
    const [isLikeUpdating, setIsLikeUpdating] = useState(false)

    const userSubscriptionStatus = _.get(auth, 'user.ccbillSubscriptionStatus', '0')
    const isAuthenticated = auth.isAuthenticated && userSubscriptionStatus === '0'

    const {
        show_media_count_in_exclusive_content,
        currency_symbol,
        is_feed_comment_enabled,
        is_feed_like_enabled,
        comment_visibility,
        like_visibility,
        enable_like_count_for_private_locked_post,
        enable_comment_count_for_private_locked_post
    } = auth.appSettings

    const subscribe_text = auth.appSettings.subscribe_text_for_locked_content ? auth.appSettings.subscribe_text_for_locked_content : 'Please Subscribe to See Content'

    useEffect(() => {
        setLikeCount(Number(total_likes || 0))
    }, [total_likes])

    useEffect(() => {
        setUserFeedLikeState(Number(user_feed_like || 0))
    }, [user_feed_like])

    const getGalleryPhotoAndVideoCount = (isLocked = false, position = 'absolute') => {
        const photo = _.get(contentCount, 'photo', 0)
        const video = _.get(contentCount, 'video', 0)

        let photoCount = photo
        let videoCount = video
        if ((role === 'user' || role === undefined || role === 'proxy_user') && !show_media_count_in_exclusive_content) {
            photoCount = ''
            videoCount = ''
        }

        const { watermark_position } = auth.appSettings
        const positionClass = position === 'absolute' ? 'absolute' : 'relative'
        const topBottomClass = (watermark_position === 'bottom-left' || watermark_position === 'bottom-right' || isLocked === true) ? 'top-[5px]' : 'bottom-[5px]'
        const mediaPositionClass = position === 'absolute' ? (isLocked === true ? 'bottom-[60px] left-1/2 -translate-x-1/2' : 'left-0 right-0 mx-auto mt-[5px]') : 'mx-auto'

        return <div
            className={cn('text-sm text-center text-black', positionClass, topBottomClass, mediaPositionClass)}
        >
            <div className='flex items-center gap-2 whitespace-nowrap bg-[#ddddddaa] text-black rounded-[6px] px-2 py-[3px]'>
                {photo > 0 && (
                    <span className='flex items-center gap-1'>
                        <Image />
                        {photoCount}
                    </span>
                )}

                {photo > 0 && video > 0 && (
                    <span>|</span>
                )}

                {video > 0 && (
                    <span className='flex items-center gap-1'>
                        <Video />
                        {videoCount}
                    </span>
                )}

            </div>
        </div>
    }

    const openFullScreenDlgBlog = (media) => {
        setUrl(media.url)
        setType(media.content_type)
        setIsDialogueOpen(!isDialogueOpen)
        if (props.setIsPopupOpen) props.setIsPopupOpen(!isDialogueOpen)
    }

    const getVideoLength = (length) => {
        if (length < 60) {
            return `The video is ${length} second${length === 1 ? '' : 's'}.`
        }

        const minutes = Math.floor(length / 60)
        const seconds = length % 60

        const minuteText = `minute${minutes === 1 ? '' : 's'}`
        const secondText = `second${seconds === 1 ? '' : 's'}`

        return `The video is ${minutes} ${minuteText} ${seconds} ${secondText}.`
    }

    const mediaPreview = (media, isPaymentProcessing) => {
        return <div>
            <button
                onClick={() => openFullScreenDlgBlog(media)}
                disabled={isPaymentProcessing}
                className='w-full px-4 py-2 text-md text-[#fff] bg-[#ff1a9d] shadow-md transition cursor-pointer rounded-lg'>
                Preview
            </button>
        </div>
    }

    const redirectToSubscriptionPageOrUnlockContent = () => {
        const targetDomain = cleanDomain(website_url || auth.user.domain)

        if (isSubscribedToWebsite === false) {
            if (pathname?.startsWith('/model-profile')) {
                router.push(`/subscription?name=${targetDomain}`)
                return
            }
            router.push(`/model-profile/${targetDomain}?name=${targetDomain}`)
            return
        }

        const hasValidSubscription = ['1', '2'].includes(userSubscriptionStatus)
        if (isDesktop && auth.isAuthenticated && hasValidSubscription) {
            const isPromotional = promotionPercentage !== 0
            const updatedAmount = isPromotional ? getDiscountPrice(amount) : amount
            unlockContent(id, updatedAmount, blogType, description, isPromotional, website_url)
            return
        }

        if (!isAuthenticated) return
        router.push(`/subscription?name=${targetDomain}`)
    }

    const checkIsFeedLikeAndCommentEnabled = (isSettingEnabled, visibility) => {
        const subscriptionStatus = _.get(auth, 'user.ccbillSubscriptionStatus', '0')

        const registeredAndSubscribers = ['0', '1', '2']
        const activeSubscriber = ['1', '2']

        if (!isSettingEnabled || !auth.isAuthenticated) return false

        if (visibility === 'everyone') return true

        if (
            visibility === 'registered_and_subscribers' &&
            registeredAndSubscribers.includes(subscriptionStatus)
        ) {
            return true
        }

        if (
            visibility === 'subscribers' &&
            activeSubscriber.includes(subscriptionStatus)
        ) {
            return true
        }

        return false
    }

    useMemo(() => {
        if (is_feed_comment_enabled) {
            setIsFeedCommentEnabled(checkIsFeedLikeAndCommentEnabled(is_feed_comment_enabled, comment_visibility))
        }
        if (is_feed_like_enabled) {
            setIsFeedLikeEnabled(checkIsFeedLikeAndCommentEnabled(is_feed_like_enabled, like_visibility))
        }
    }, [auth.isAuthenticated])

    const redirectToCurrentFeed = (isCommentEnable) => {
        if (isCommentEnable === true) {
            const targetDomain = cleanDomain(website_url || auth.user.domain)
            router.push(`/model-profile/${targetDomain}/${id}?name=${targetDomain}`)
            return
        }
        return
    }

    const handleLockIconClick = (event) => {
        if (isSubscribedToWebsite !== false) return

        event.stopPropagation()
        const targetDomain = cleanDomain(website_url || auth.user.domain)
        if (pathname?.startsWith('/model-profile')) {
            router.push(`/subscription?name=${targetDomain}`)
            return
        }
        router.push(`/model-profile/${targetDomain}?name=${targetDomain}`)
    }

    const showPreview = !_.isEmpty(media_preview) && !isDesktop
    let enableLikeComment = false
    const desktopHeightClass = disableFixedHeight ? '' : 'h-36'
    const mediaContainerHeightClass = !isDesktop ? 'h-[480px]' : desktopHeightClass

    let blogContent = null
    if (showMedia === false) {
        enableLikeComment = !lock && !isLocked
    } else if (lock) {
        blogContent = <div className={clsx('cursor-pointer block text-center overflow-hidden relative', mediaContainerHeightClass)} onClick={() => redirectToSubscriptionPageOrUnlockContent()}>
            {blur ?
                <BlogMedia
                    media={media}
                    isLocked={lock}
                    isPreviewEnable={isPreviewEnable}
                    is_published={is_published}
                    openDlgBlog={openDlgBlog}
                    userIndex={userIndex}
                    i={index}
                    currentMediaIndex={currentMediaIndex}
                    isDesktop={isDesktop}
                    disableFixedHeight={disableFixedHeight}
                />
                :
                <img key={id} draggable={false} className='w-full rounded-xl object-cover' src={getCloudFrontAssetsUrl('blog/lockback.jpg')} alt='Lock Background' style={{ height: 'calc(70vh - 80px)' }} />
            }
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full'>
                <img
                    src={getCloudFrontAssetsUrl('lock.svg')}
                    alt='Lock'
                    className={clsx('w-10 h-10', isSubscribedToWebsite === false && 'cursor-pointer')}
                    onClick={handleLockIconClick}
                />
                {(isDesktop !== true && isSubscribedToWebsite === false) && <div className='mt-3 text-base font-medium text-[#000] unlock-text relative text-center w-[100%]'>{subscribe_text}</div>}
            </div>
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-2'>
                {isDesktop !== true && getGalleryPhotoAndVideoCount(true, 'relative')}
                {showPreview && (
                    <div className='w-full px-4' onClick={(e) => e.stopPropagation()}>
                        {mediaPreview(media_preview[0], isPaymentProcessing)}
                    </div>
                )}
            </div>
        </div>
    } else if (isLocked) {
        blogContent =
            <div className='cursor-pointer block' onClick={() => redirectToSubscriptionPageOrUnlockContent()}>
                <div className='text-center overflow-hidden relative'>
                    {/* Image Section */}
                    <div className={clsx('relative w-full', mediaContainerHeightClass)}>
                        {blur ? (
                            <BlogMedia
                                media={media}
                                isLocked={isLocked}
                                isPreviewEnable={isPreviewEnable}
                                is_published={is_published}
                                openDlgBlog={openDlgBlog}
                                userIndex={userIndex}
                                i={index}
                                currentMediaIndex={currentMediaIndex}
                                isDesktop={isDesktop}
                                disableFixedHeight={disableFixedHeight}
                            />
                        ) : (
                            <img
                                key={id}
                                draggable={false}
                                className={clsx('w-full rounded-xl object-cover', mediaContainerHeightClass)}
                                src={getCloudFrontAssetsUrl('blog/lockback.jpg')}
                                alt='Lock Background'
                            />
                        )}
                        {/* CENTER CONTENT */}
                        {!isDesktop ?
                            <>
                                <div className={clsx('absolute inset-x-0 top-0 gap-2 z-1 flex flex-col justify-between px-4 text-center', media_preview && media_preview.length > 0 ? 'bottom-4' : 'bottom-0 p-4')}>
                                    <div className='flex-1 flex flex-col items-center justify-center'>
                                        <img
                                            src={getCloudFrontAssetsUrl('lock.svg')}
                                            alt='Lock'
                                            className={clsx('w-10 h-10', isSubscribedToWebsite === false && 'cursor-pointer')}
                                            onClick={handleLockIconClick}
                                        />
                                        <div className='mt-3 text-base font-medium text-[#000] unlock-text relative text-center w-[100%]'>
                                            {promotionPercentage === 0 ? (
                                                auth.user.default_payment_method === 'crypto_currency'
                                                    ? `${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${amount} will be debited from wallet balance.`
                                                    : `${_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}${amount} will be charged to your previous payment method.`
                                            ) : (
                                                auth.user.default_payment_method === 'crypto_currency'
                                                    ? `$${getDiscountPrice(amount)} will be debited from wallet balance.`
                                                    : `$${getDiscountPrice(amount)} will be charged to your previous payment method.`
                                            )}
                                        </div>
                                        <div className='mt-4'>
                                            {getGalleryPhotoAndVideoCount(true, 'relative')}
                                        </div>
                                    </div>
                                    <div className='w-full'>
                                        {isPaymentProcessing ? (
                                            <Button
                                                classes='btn btn-block bg-[#ff1a9d] py-2 font-medium rounded-lg w-full text-[#fff]'
                                                loading={isPaymentProcessing}
                                            >
                                                Payment Processing
                                            </Button>
                                        ) : promotionPercentage === 0 ? (
                                            <Button
                                                classes='btn btn-block bg-[#ff1a9d] font-medium py-2 rounded-lg w-full text-[#fff]'
                                                onClick={() =>
                                                    unlockContent(id, amount, blogType, description, false, website_url)
                                                }
                                            >
                                                UNLOCK THIS {blogType.toUpperCase()} FOR{' '}
                                                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                                {amount}
                                            </Button>
                                        ) : (
                                            <button
                                                className='btn btn-block bg-[#ff1a9d] font-medium py-2 rounded-lg w-full text-[#fff] '
                                                onClick={() =>
                                                    unlockContent(
                                                        id,
                                                        getDiscountPrice(amount),
                                                        blogType,
                                                        description,
                                                        true,
                                                        website_url
                                                    )
                                                }
                                            >
                                                UNLOCK THIS {blogType.toUpperCase()} FOR{' '}
                                                <span
                                                    className={`line-through mx-[5px] decoration-${lineThroughColor}`}
                                                >
                                                    {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                                    {amount}
                                                </span>
                                                {_.isEmpty(currency_symbol.trim()) ? '$' : currency_symbol.trim()}
                                                {getDiscountPrice(amount)}
                                            </button>
                                        )}
                                    </div>
                                    {showPreview && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            {mediaPreview(media_preview[0], isPaymentProcessing)}
                                        </div>
                                    )}
                                </div>
                            </>
                            :
                            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center'>
                                <img
                                    src={getCloudFrontAssetsUrl('lock.svg')}
                                    alt='Lock'
                                    className={clsx('w-10 h-10', isSubscribedToWebsite === false && 'cursor-pointer')}
                                    onClick={handleLockIconClick}
                                />
                            </div>
                        }
                    </div>
                    {(!isDesktop && show_content_length === true && blogType === 'video') &&
                        <span className='mb-2 mt-2 flex text-sm openSans text-[#3c3b6e]'>
                            {getVideoLength(content_length)}
                        </span>
                    }
                </div>
            </div>
    } else {
        enableLikeComment = true
        blogContent = <div className={clsx('relative overflow-hidden', mediaContainerHeightClass)}>
            <BlogMedia
                media={media}
                isLocked={false}
                isPreviewEnable={isPreviewEnable}
                is_published={is_published}
                openDlgBlog={openDlgBlog}
                userIndex={userIndex}
                i={index}
                currentMediaIndex={currentMediaIndex}
                isDesktop={isDesktop}
                disableFixedHeight={disableFixedHeight}
            />
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-2'>
                {isDesktop !== true && getGalleryPhotoAndVideoCount(true, 'relative')}
                {showPreview && (
                    <div className='w-full px-4' onClick={(e) => e.stopPropagation()}>
                        {mediaPreview(media_preview[0], isPaymentProcessing)}
                    </div>
                )}
            </div>
        </div>
    }


    const handleLikeOrDislikedPostFeed = async (id) => {
        if (['1', '2'].includes(userSubscriptionStatus) && enableLikeComment === false) {
            return false
        }

        if (isLikeUpdating) return false

        const nextIsLike = userFeedLikeState === 0 ? 1 : 0
        const nextLikeCount = Math.max(0, likeCount + (nextIsLike === 1 ? 1 : -1))
        const payload = {
            id,
            is_like: nextIsLike,
            total_likes: nextLikeCount
        }

        setIsLikeUpdating(true)
        setUserFeedLikeState(nextIsLike)
        setLikeCount(nextLikeCount)

        const response = await likeOrDislikeBlog(
            cleanDomain(website_url || auth.user.domain),
            payload,
            dispatch
        )

        if (response === null) {
            setUserFeedLikeState(Number(user_feed_like || 0))
            setLikeCount(Number(total_likes || 0))
        }

        setIsLikeUpdating(false)
    }

    const showLikeCount = enable_like_count_for_private_locked_post || enableLikeComment
    const showCommentCount = enable_comment_count_for_private_locked_post || enableLikeComment

    return (
        <div>
            {blogContent}
            {showLikeAndComments && (isFeedCommentEnabled || isFeedLikeEnabled) &&
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
                    {isFeedLikeEnabled && showLike && (
                        <div
                            className={clsx(
                                'flex items-center gap-2 transition',
                                !(enableLike && enableLikeComment) || isLikeUpdating
                                    ? 'pointer-events-none opacity-50'
                                    : 'opacity-100 cursor-pointer'
                            )}
                            onClick={() => {
                                if (!auth.isAuthenticated) return
                                handleLikeOrDislikedPostFeed(id)
                            }}
                        >
                            <HeartIcon
                                className={clsx(
                                    'transition',
                                    !enableLikeComment ? 'opacity-50' : 'opacity-100 cursor-pointer',
                                    userFeedLikeState !== 0 && 'fill-[#ff1a9d] stroke-0'
                                )}
                            />
                            {showLikeCount && (
                                <span>
                                    {likeCount}
                                </span>
                            )}
                        </div>
                    )}

                    {/* COMMENT */}
                    {isFeedCommentEnabled && showComment && (
                        <div
                            className={clsx(
                                'flex items-center gap-2 transition',
                                !(enableLike && enableLikeComment)
                                    ? 'pointer-events-none opacity-50'
                                    : disableCommentNavigation
                                        ? 'opacity-100'
                                        : 'opacity-100 cursor-pointer'
                            )}
                            onClick={() => {
                                if (disableCommentNavigation) return
                                redirectToCurrentFeed(enableLikeComment)
                            }}
                        >
                            <MessageCircle
                                className={clsx(
                                    'transition',
                                    !enableLikeComment ? 'opacity-30' : disableCommentNavigation ? 'opacity-100' : 'opacity-100 cursor-pointer'
                                )}
                            />
                            {showCommentCount && (
                                <span>
                                    {total_comments || 0}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            }
            {
                isDialogueOpen === true &&
                <FullScreenModelPopUpDialog
                    url={url}
                    handleClose={() => { openFullScreenDlgBlog('') }}
                    type={type}
                />
            }
        </div >
    )
}
