'use client'
import Image from 'next/image'
import moment from 'moment'
import _ from 'lodash'
import { isIOS } from 'react-device-detect'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '@/components/ui/card'
import BlogData from './BlogData'
import FullScreenModelPopUpDialog from '../../components/modals/FullScreenModelDialogPopup'
import { getAggregatedFeed } from '../../action/blog.action'
import FullScreenGalleryDialog from '../../components/gallery/FullScreenGalleryDialog'
import { getFeaturedModel, getModelList } from '../../action/api'
import { setCurrentPage, setFeaturedModelText, setTotalPages, storeFeaturedModel, storeModelList } from '../../../store/slices/modelSlice'
import Loader from '../../components/common/Loader'
import { useRouter } from 'next/navigation'
import cleanDomain from '../../lib'
import { cn } from '@/lib/utils'
import { setAlertLoader, setConfirmSweetAlert, setSweetAlert } from '../../../store/slices/sweetAlertSlice'
import { googleAnalyticsTrackEvent } from '../../lib/google-analytics-event'
import { blogPurchasePayment } from '../../action/hybrid-payment.action'
import ConfirmSweetAlertsWrapper from '../../components/modals/ConfirmSweetAlertsWrapper'
import AddFundPopup from '@/components/modules/crypto/AddFundPopup'
import ModalPopUp from '@/components/modals/ModalPopUp'
import { updateWalletAmount } from '../../../store/slices/authSlice'
import { purchaseFromWallet } from '@/action/crypto-payment.action'
import useUnlockContent from '@/hook/useUnlockContent'
import { getCloudFrontAssetsUrl } from '@/lib/assets'

export default function FeedLayout(props) {
    const [isBlogOpen, setIsBlogOpen] = useState(false)
    const [index, setIndex] = useState(0)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [truncatedMap, setTruncatedMap] = useState({})
    const [expandedMap, setExpandedMap] = useState({})
    const textRefs = useRef({})
    const loadingRef = useRef(false)
    const prevPageRef = useRef(0)
    const isInitialLoad = useRef(true)
    const scrollRef = useRef(null)
    const fetchingRef = useRef(false)
    const [feedCurrentPage, setFeedCurrentPage] = useState(1)
    const [feedTotalPages, setFeedTotalPages] = useState(1)
    const [isSubscribedEver, setIsSubscribedEver] = useState(true)
    const feedPageRef = useRef(1)

    const auth = useSelector(state => state.auth)
    const blogData = useSelector(state => state.blog)
    const { modelList, currentPage, totalPages } = useSelector(state => state.models)
    const { userList } = useSelector(state => state.chat)
    const { onlineUserList } = props
    const dispatch = useDispatch()
    const router = useRouter()

    const {
        handleUnlockContent,
        remainAmount,
        showAddFundPopup,
        setShowAddFundPopup,
        showAlert,
        setShowAlert,
        sendUnlockContentRequest,
        unlockData,
        unlockBlogUsingCrypto
    } = useUnlockContent({
        auth,
        dispatch,
        cleanDomain,
        googleAnalyticsTrackEvent,
        setConfirmSweetAlert,
        setSweetAlert,
        setAlertLoader,
        blogPurchasePayment,
        purchaseFromWallet,
        updateWalletAmount,
        isSingleWebsiteBlogs: false
    })

    useEffect(() => {
        const fetchAggregatedFeed = async () => {
            const data = await getAggregatedFeed(dispatch, 1, auth.user.ccbillSubscriptionStatus || '0')
            if (data) {
                if (typeof data.is_subscribed_ever === 'boolean') setIsSubscribedEver(data.is_subscribed_ever)
                if (data.totalPages) setFeedTotalPages(data.totalPages)
                if (data.currentPage) {
                    setFeedCurrentPage(data.currentPage)
                    feedPageRef.current = data.currentPage
                }
            }
        }
        fetchAggregatedFeed()
    }, [])

    useEffect(() => {
        const container = scrollRef.current
        if (!container) return

        container.addEventListener('scroll', handleScrollFeedData, { passive: true })
        return () => {
            container.removeEventListener('scroll', handleScrollFeedData)
        }
    }, [feedCurrentPage, feedTotalPages, isLoading])

    const handleScrollFeedData = async () => {
        if (isSubscribedEver === false) return
        if (fetchingRef.current) return
        const page = feedPageRef.current
        if (page >= feedTotalPages) return

        const container = scrollRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            fetchingRef.current = true
            setIsLoading(true)
            const data = await getAggregatedFeed(dispatch, page + 1, auth.user.ccbillSubscriptionStatus || '0')
            if (data) {
                if (typeof data.is_subscribed_ever === 'boolean') setIsSubscribedEver(data.is_subscribed_ever)
                if (data.totalPages) setFeedTotalPages(data.totalPages)
                if (data.currentPage) {
                    setFeedCurrentPage(data.currentPage)
                    feedPageRef.current = data.currentPage
                }
            }
            setIsLoading(false)
            fetchingRef.current = false
        }
    }


    const openDlgBlog = (index, galleryIndex, currentMediaIndex) => {
        if (galleryIndex === undefined) {
            galleryIndex = 0
        }
        if (blogData.aggregatedFeed[index]?.processing === false) {
            setIsBlogOpen(true)
            setIndex(index)
            setGalleryIndex(currentMediaIndex ? currentMediaIndex : galleryIndex)
            if (props.setIsPopupOpen) props.setIsPopupOpen(true)
        }
    }

    const closeDialogBlog = () => {
        setIsBlogOpen(false)
        setIndex(-1)
        if (props.setIsPopupOpen) props.setIsPopupOpen(false)
    }

    const isDesktop = useSyncExternalStore(
        (callback) => {
            const media = window.matchMedia('(min-width: 1280px)')
            media.addEventListener('change', callback)
            return () => media.removeEventListener('change', callback)
        },
        () => window.matchMedia('(min-width: 1280px)').matches,
        () => false // SSR fallback
    )

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

    const removeIds = new Set(userList.map(item => item._id))
    const filteredModelList = modelList.filter(
        model => !removeIds.has(model._id)
    )

    let blogUnlockButtonTextFontSize = auth.appSettings.blog_unlock_button_text_font_size.split('|')
    if (blogUnlockButtonTextFontSize.length !== 4) {
        blogUnlockButtonTextFontSize = ['12px', '12px', '12px', '12px']
    }

    // Promotions are disabled here so feed unlocks always use the base price.
    let promotionPercentage = 0

    const handleModelClick = (website_url) => {
        const websiteUrl = cleanDomain(website_url)
        router.push(`/model-profile/${websiteUrl}?name=${websiteUrl}`)
    }

    useEffect(() => {
        const newMap = {}
        Object.keys(textRefs.current).forEach((id) => {
            const el = textRefs.current[id]
            if (el) {
                newMap[id] = el.scrollHeight > el.clientHeight
            }
        })
        setTruncatedMap(newMap)
    }, [blogData.aggregatedFeed])

    const getDiscountPrice = (amount) => {
        return Math.ceil(amount * (100 - promotionPercentage) / 100)
    }

    const toggleExpandedCaption = (blogId) => {
        setExpandedMap((prev) => ({
            ...prev,
            [blogId]: !prev[blogId]
        }))
    }

    return (
        <div className='flex flex-col xl:flex-row h-[calc(100vh-var(--navbar-height))] px-4 md:px-10 bg-[linear-gradient(58deg,rgba(242,227,247,1)_-50%,rgba(231,236,246,1)_100%)] w-full'>
            {/* LEFT CONTENT */}
            {blogData.isBlogLoading &&
                <div className={`w-full absolute inset-0 flex items-center justify-center`}>
                    <Loader isLoading={blogData.isBlogLoading} color='#000' />
                </div>
            }
            <div className='w-full w-3/5 h-full overflow-y-auto py-6 pb-[env(safe-area-inset-bottom)]' ref={scrollRef}>
                {blogData.aggregatedFeed.length > 0 ? blogData.aggregatedFeed.map((blog, index) => {
                    const isCaptionBlurred = !!blog.captionBlur
                    const isExpanded = !!expandedMap[blog.blog_id]
                    return (
                        <div key={blog.blog_id} className='flex flex-col gap-6'>
                            <div className='flex flex-row' onTouchMove={handleScrollFeedData}></div>
                            <Card
                                className='relative w-full p-5 bg-white'
                            >
                                {/* CARD CONTENT */}
                                <div className='flex md:gap-4 gap-2 items-start flex-col xl:flex-row openSans'>
                                    {/* LEFT: AVATAR + TEXT */}
                                    <div className='flex md:gap-3 flex-1 flex-col xl:flex-row w-full'>
                                        {/* Avatar */}
                                        <div className='flex flex-row items-center xl:items-start gap-3 cursor-pointer'>
                                            <div className='relative h-14 w-14 shrink-0'>
                                                <Image
                                                    src={blog?.user?.avatarUrl || getCloudFrontAssetsUrl('faces/avatar.png')}
                                                    alt='Avatar'
                                                    fill
                                                    className='rounded-full object-cover'
                                                    onClick={() => handleModelClick(blog.domain)}
                                                />
                                                {blog.isSubscribedToWebsite !== false && (
                                                    <span
                                                        className={`absolute top-0.5 left-0 h-3 w-3 rounded-full ${onlineUserList.includes(blog.model)
                                                            ? 'bg-[#26a17b]'
                                                            : 'bg-[#b22334]'}`}
                                                    />
                                                )}
                                            </div>
                                            <p className='font-normal text-base block xl:hidden w-max-content cursor-pointer' onClick={() => handleModelClick(blog.domain)}>{blog?.user?.name}</p>
                                        </div>
                                        {/* Text */}
                                        <div className='flex flex-col gap-2'>
                                            <div className='flex-1 space-y-2'>
                                                <p className='font-normal text-base hidden xl:block cursor-pointer' onClick={() => handleModelClick(blog.domain)}>{blog?.user?.name}</p>
                                            </div>
                                            <div className='text-sm text-[#000] leading-relaxed'>
                                                <h4 ref={(el) => (textRefs.current[blog.blog_id] = el)}
                                                    className={cn(
                                                        'text-sm leading-5',
                                                        !isExpanded && 'max-h-[60px] overflow-hidden',
                                                        isCaptionBlurred ? 'text-transparent' : 'text-gray-800'
                                                    )}
                                                    style={isCaptionBlurred ? { textShadow: `0 0 ${auth.appSettings.post_caption_blur_intensity}px #000`, } : undefined}>
                                                    {blog.description}
                                                </h4>
                                                {truncatedMap[blog.blog_id] && (
                                                    <button
                                                        type='button'
                                                        className='mt-1 text-sm font-medium text-blue-600 cursor-pointer hover:underline'
                                                        onClick={() => toggleExpandedCaption(blog.blog_id)}
                                                    >
                                                        {isExpanded ? 'Show Less' : 'Read More...'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* RIGHT: MEDIA */}
                                    <div className='w-full xl:w-auto flex justify-start xl:justify-end xl:mt-0'>
                                        <div className='flex gap-2'>
                                            {isDesktop && blog?.media?.length > 1 ? (
                                                blog.media.slice(0, 2).map((item, i) => (
                                                    <div key={i} className={`relative ${isDesktop === true ? 'aspect-square' : ''} xl:w-36 rounded-md overflow-hidden mb-4`} >
                                                        <BlogData
                                                            media={[item]}
                                                            locked={!blog.public}
                                                            contentURL={blog?.url}
                                                            lock={
                                                                auth.isAuthenticated &&
                                                                    auth.user.payment.membership === true
                                                                    ? false
                                                                    : !blog.public
                                                            }
                                                            blur={blog.privateBlur}
                                                            thumbnailUrl={blog?.thumbnailUrl}
                                                            blurUrl={blog?.blurUrl}
                                                            isLocked={blog.isLocked}
                                                            isPostLocked={blog.isLocked}
                                                            index={index}
                                                            id={blog.blog_id}
                                                            openDlgBlog={openDlgBlog}
                                                            blogType={blog.blogType}
                                                            contentCount={blog.contentCount}
                                                            role={auth.user.role}
                                                            isDesktop={isDesktop}
                                                            currentMediaIndex={i}
                                                            content_length={blog.content_length}
                                                            unlockButtonFontSize={blogUnlockButtonTextFontSize}
                                                            promotionPercentage={promotionPercentage}
                                                            show_content_length={blog.show_content_length}
                                                            amount={blog.amount}
                                                            getDiscountPrice={getDiscountPrice}
                                                            media_preview={blog.media_preview}
                                                            description={blog.description}
                                                            setIsPopupOpen={props.setIsPopupOpen}
                                                            unlockContent={handleUnlockContent}
                                                            website_url={blog.domain}
                                                            total_likes={blog.total_likes}
                                                            total_comments={blog.total_comments}
                                                            user_feed_like={blog.user_feed_like}
                                                            showLikeAndComments={false}
                                                            isSubscribedToWebsite={blog.isSubscribedToWebsite}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div key={blog.blog_id} className={`relative ${isDesktop === true ? 'aspect-square' : ''} w-full xl:w-36 rounded-md overflow-hidden mb-4`} >
                                                    <BlogData
                                                        media={blog?.media}
                                                        locked={!blog.public}
                                                        contentURL={blog?.url}
                                                        lock={
                                                            auth.isAuthenticated &&
                                                                auth.user.payment.membership === true
                                                                ? false
                                                                : !blog.public
                                                        }
                                                        blur={blog.privateBlur}
                                                        thumbnailUrl={blog?.thumbnailUrl}
                                                        blurUrl={blog?.blurUrl}
                                                        isLocked={blog.isLocked}
                                                        isPostLocked={blog.isLocked}
                                                        index={index}
                                                        id={blog.blog_id}
                                                        openDlgBlog={openDlgBlog}
                                                        blogType={blog.blogType}
                                                        contentCount={blog.contentCount}
                                                        role={auth.user.role}
                                                        isDesktop={isDesktop}
                                                        content_length={blog.content_length}
                                                        unlockButtonFontSize={blogUnlockButtonTextFontSize}
                                                        promotionPercentage={promotionPercentage}
                                                        show_content_length={blog.show_content_length}
                                                        amount={blog.amount}
                                                        media_preview={blog.media_preview}
                                                        getDiscountPrice={getDiscountPrice}
                                                        description={blog.description}
                                                        setIsPopupOpen={props.setIsPopupOpen}
                                                        unlockContent={handleUnlockContent}
                                                        website_url={blog.domain}
                                                        total_likes={blog.total_likes}
                                                        total_comments={blog.total_comments}
                                                        user_feed_like={blog.user_feed_like}
                                                        showLikeAndComments={false}
                                                        isSubscribedToWebsite={blog.isSubscribedToWebsite}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
                                    <BlogData
                                        locked={!blog.public}
                                        lock={
                                            auth.isAuthenticated &&
                                                auth.user.payment.membership === true
                                                ? false
                                                : !blog.public
                                        }
                                        isLocked={blog.isLocked}
                                        id={blog.blog_id}
                                        blogType={blog.blogType}
                                        role={auth.user.role}
                                        isDesktop={isDesktop}
                                        amount={blog.amount}
                                        getDiscountPrice={getDiscountPrice}
                                        promotionPercentage={promotionPercentage}
                                        description={blog.description}
                                        unlockContent={handleUnlockContent}
                                        website_url={blog.domain}
                                        total_likes={blog.total_likes}
                                        total_comments={blog.total_comments}
                                        user_feed_like={blog.user_feed_like}
                                        showLikeAndComments={true}
                                        showLike={false}
                                        showComment={false}
                                        showMedia={false}
                                        isSubscribedToWebsite={blog.isSubscribedToWebsite}
                                    />
                                    <div className='font-normal openSans text-[#3c3b6e] text-sm whitespace-nowrap'>
                                        {blog !== null ? moment(blog?.date).format('MM/DD/YYYY hh:mm A') : ''}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                })
                    : (blogData.isBlogLoading === false && isLoading === false) && <div className='text-center my-4'><h4>No Posts Found</h4></div>}
                {isLoading === true ?
                    <div className='flex justify-center py-4'>
                        <Loader isLoading={true} color='#000' size={10} />
                    </div> : null
                }
            </div>
            <div className='hidden xl:block w-full xxl:w-2/6 xl:w-2/6 pl-6 pe-0 xl:pe-12'>
                <div className='relative w-full py-5 flex flex-col space-y-2'>
                    <div className='text-[#3c3b6e] font-bold text-xl'>🚀 Trending</div>
                    <div className='text-[#3c3b6e] font-normal text-md text-start'>
                        Meet the latest creators to join Fan Favour <span className='font-bold italic'>NOW.</span>
                    </div>
                </div>
                <div className='flex flex-col gap-4 w-full h-[calc(100vh-var(--navbar-height)-90px)] overflow-y-auto pb-16'>
                    {filteredModelList.map((item, i) => {
                        const website_url = item.website_url
                        return (
                            <div
                                key={item.id || i}
                                className='relative w-full h-68 rounded-md overflow-hidden flex-shrink-0'
                                onClick={() => handleModelClick(`https://${website_url}`)}
                            >
                                {item.image &&
                                    <Image
                                        src={item.image}
                                        alt={item.model_name}
                                        fill
                                        className='object-cover cursor-pointer'
                                        onClick={() => handleModelClick(`https://${website_url}`)}
                                    />
                                }
                                <div className='absolute bottom-1 w-full flex items-start justify-between p-2'>
                                    <div className='flex items-center gap-2 hidden'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            viewBox='0 0 24 24'
                                            fill='none'
                                            stroke='white'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            className='w-5 h-5'
                                        >
                                            <path d='M20.8 4.6c-1.9-1.7-4.8-1.5-6.5.3L12 7.3l-2.3-2.4c-1.7-1.8-4.6-2-6.5-.3-2.1 1.8-2.2 5-0.3 7L12 21.3l9.1-9.6c1.9-2 1.8-5.2-0.3-7z' />
                                        </svg>
                                        <span className='text-[#fff] font-medium text-base'>{item.likes}</span>
                                    </div>

                                    <div className='flex flex-col items-end gap-2'>
                                        <div onClick={() => handleModelClick(`https://${website_url}`)}>
                                            <div className='rounded-full absolute bottom-2 right-2 flex items-center gap-3 text-base bg-pink-600 cursor-pointer'>
                                                <svg
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    stroke='white'
                                                    strokeWidth='2'
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    className='w-6 h-6 rotate-270'
                                                >
                                                    <polyline points='6 9 12 15 18 9' />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {
                isBlogOpen === true && index >= 0 && blogData.aggregatedFeed[index]?.blogType !== 'gallery' && blogData.aggregatedFeed[index] &&
                <FullScreenModelPopUpDialog
                    type={blogData.aggregatedFeed[index].blogType === 'video' ? 'video' : 'photo'}
                    url={blogData.aggregatedFeed[index].media[0].url}
                    handleClose={closeDialogBlog}
                />
            }
            {
                isBlogOpen === true && index >= 0 && blogData.aggregatedFeed[index]?.blogType === 'gallery' &&
                <FullScreenGalleryDialog
                    galleryImages={blogData.aggregatedFeed[index].gallery}
                    closeDialogBlog={closeDialogBlog}
                    // classes={classes}
                    userId={auth.user._id}
                    galleryIndex={galleryIndex}
                    isPreviewEnable={blogData.aggregatedFeed[index].isPreviewEnable}
                    previewEnableImages={blogData.aggregatedFeed[index].previewEnableImages}
                    isLocked={blogData.aggregatedFeed[index].isLocked}
                    contentCount={blogData.aggregatedFeed[index].contentCount}
                    thumbImages={blogData.aggregatedFeed[index].thumbnailUrlGallery}
                    media={blogData.aggregatedFeed[index].media}
                    contentFrom='blog'
                />
            }
            {
                showAddFundPopup === true &&
                <ModalPopUp handleClose={() => {
                    setShowAddFundPopup(false)
                }}>
                    <div className='modal-body'>
                        <div className='container'>
                            <AddFundPopup
                                onHideAddFund={() => setShowAddFundPopup(false)}
                                type='blog'
                                transactionAmount={Number(unlockData.amount)}
                                remainAmount={remainAmount}
                                onCompleteTransaction={
                                    (updatedBalance) => {
                                        setShowAddFundPopup(false)
                                        if (updatedBalance) {
                                            unlockBlogUsingCrypto(updatedBalance)
                                        }
                                    }
                                }
                            />
                        </div>
                    </div>
                </ModalPopUp >
            }
            {showAlert && <ConfirmSweetAlertsWrapper onConfirm={() => { sendUnlockContentRequest(unlockData) }} onCancel={() => { setShowAlert(false) }} />}
        </div >
    )
}
