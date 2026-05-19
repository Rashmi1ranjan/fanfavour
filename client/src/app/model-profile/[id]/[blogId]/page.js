'use client'

import moment from 'moment'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'next/navigation'
import { getWebsiteBlogInfo, removeWebsiteBlogComment, saveWebsiteBlogComment } from '@/action/blog.action'
import Loader from '@/components/common/Loader'
import { withPrivateRoute } from '@/components/layout/PrivateRoute'
import { ALLOW_ALL } from '@/lib/constant'
import { cn } from '@/lib/utils'
import BlogData from '../../../feed/BlogData'
import FullScreenModelPopUpDialog from '@/components/modals/FullScreenModelDialogPopup'
import FullScreenGalleryDialog from '@/components/gallery/FullScreenGalleryDialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { blogPurchasePayment } from '@/action/hybrid-payment.action'
import { purchaseFromWallet } from '@/action/crypto-payment.action'
import { updateWalletAmount } from '../../../../../store/slices/authSlice'
import { setAlertLoader, setConfirmSweetAlert, setSweetAlert } from '../../../../../store/slices/sweetAlertSlice'
import cleanDomain from '@/lib'
import { googleAnalyticsTrackEvent } from '@/lib/google-analytics-event'
import useUnlockContent from '@/hook/useUnlockContent'
import ModalPopUp from '@/components/modals/ModalPopUp'
import AddFundPopup from '@/components/modules/crypto/AddFundPopup'
import ConfirmSweetAlertsWrapper from '@/components/modals/ConfirmSweetAlertsWrapper'
import { getCloudFrontAssetsUrl } from '@/lib/assets'

const getCommentText = (comment) => {
    if (typeof comment === 'string') return comment
    return (
        comment?.comment ||
        comment?.text ||
        comment?.message ||
        comment?.description ||
        comment?.body ||
        comment?.content ||
        ''
    )
}

const getCommentAuthor = (comment) => {
    if (typeof comment === 'string') return 'Anonymous'
    return (
        comment?.user_info?.name ||
        comment?.user?.name ||
        comment?.author?.name ||
        comment?.name ||
        comment?.username ||
        comment?.createdBy?.name ||
        'Anonymous'
    )
}

const getCommentAvatar = (comment) => {
    if (typeof comment === 'string') return getCloudFrontAssetsUrl('faces/avatar.png')
    return (
        comment?.user_info?.avatarUrl ||
        comment?.user?.avatarUrl ||
        comment?.author?.avatarUrl ||
        comment?.avatar ||
        comment?.profile_image ||
        getCloudFrontAssetsUrl('faces/avatar.png')
    )
}

const getCommentTime = (comment) => {
    if (typeof comment === 'string') return ''
    return comment?.createdAt || comment?.date || comment?.created_at || comment?.timestamp || ''
}

const extractComments = (blog) => {
    const candidates = [
        blog?.comments,
        blog?.commentList,
        blog?.comment_list,
        blog?.feedComments,
        blog?.commentData,
        blog?.comments?.data,
        blog?.comments?.rows,
        blog?.comments?.items,
        blog?.comments?.comments
    ]

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate
        }
    }

    return []
}

const normalizeBlogInfoResponse = (response, websiteUrl) => {
    const responseData = response?.data || response
    const blogInfo = responseData?.blog_info || responseData?.blog || responseData
    const blogComments = responseData?.blog_comments
    const feedLikes = responseData?.feed_likes
    const comments = blogComments?.comments || extractComments(blogInfo)

    if (!blogInfo || typeof blogInfo !== 'object') {
        return null
    }

    return {
        ...blogInfo,
        comments,
        total_comments: Number(blogInfo?.total_comments ?? blogComments?.total ?? comments?.length ?? 0),
        total_likes: Number(blogInfo?.total_likes ?? 0),
        user_feed_like: Number(feedLikes?.user_feed_like ?? blogInfo?.user_feed_like ?? 0),
        is_feed_like_enabled: feedLikes?.is_feed_like_enabled,
        should_display_like: feedLikes?.should_display_like,
        user: {
            ...blogInfo?.user,
            website_url: blogInfo?.user?.website_url || websiteUrl
        }
    }
}

function SelectedBlogCard({
    blog,
    auth,
    openDlgBlog,
    blogUnlockButtonTextFontSize,
    promotionPercentage,
    unlockContent,
    getDiscountPrice
}) {
    const [truncated, setTruncated] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const captionRef = useRef(null)

    useEffect(() => {
        const el = captionRef.current
        if (!el) return
        setTruncated(el.scrollHeight > el.clientHeight)
    }, [blog?.description])

    if (!blog) return null

    const profileDomain = cleanDomain(blog?.user?.website_url)
    const modelProfileHref = profileDomain
        ? `/model-profile/${profileDomain}?name=${profileDomain}`
        : '#'

    return (
        <div className='relative w-full overflow-hidden flex flex-col p-2'>
            <Link
                href={modelProfileHref}
                className='flex items-center gap-3 px-2 py-2'
            >
                <div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100'>
                    <img
                        src={blog?.user?.avatarUrl || getCloudFrontAssetsUrl('faces/avatar.png')}
                        alt={blog?.user?.name || 'Model avatar'}
                        className='h-full w-full object-cover'
                    />
                </div>
                <div className='min-w-0'>
                    <h3 className='truncate text-base text-[#1a0033]'>
                        {blog?.user?.name || blog?.author || 'Model'}
                    </h3>
                </div>
            </Link>
            <div className='relative w-full overflow-hidden rounded-2xl'>
                <BlogData
                    media={blog.media}
                    locked={!blog.public}
                    contentURL={blog?.url}
                    lock={
                        auth.isAuthenticated && auth.user.payment.membership === true
                            ? false
                            : !blog.public
                    }
                    blur={blog.privateBlur}
                    thumbnailUrl={blog?.thumbnailUrl}
                    blurUrl={blog?.blurUrl}
                    isLocked={blog.isLocked}
                    isPostLocked={blog.isLocked}
                    index={0}
                    id={blog._id}
                    openDlgBlog={openDlgBlog}
                    blogType={blog.blogType}
                    contentCount={blog.contentCount}
                    role={auth.user.role}
                    isDesktop={false}
                    currentMediaIndex={0}
                    content_length={blog.content_length}
                    unlockButtonFontSize={blogUnlockButtonTextFontSize}
                    promotionPercentage={promotionPercentage}
                    show_content_length={blog.show_content_length}
                    media_preview={blog.media_preview}
                    amount={blog.amount}
                    getDiscountPrice={getDiscountPrice}
                    description={blog.description}
                    unlockContent={unlockContent}
                    website_url={blog.user.website_url}
                    total_likes={blog.total_likes}
                    total_comments={blog.total_comments}
                    user_feed_like={blog.user_feed_like}
                    showLikeAndComments={true}
                    disableFixedHeight={true}
                    disableCommentNavigation={true}
                />
            </div>
            <div className='py-3 bg-white px-2'>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <h4
                                ref={captionRef}
                                className={cn(
                                    'text-sm leading-5',
                                    !expanded && 'max-h-[60px] overflow-hidden',
                                    blog.captionBlur && !auth.isAuthenticated ? 'text-transparent' : 'text-gray-800'
                                )}
                                style={
                                    blog.captionBlur && !auth.isAuthenticated
                                        ? { textShadow: `0 0 ${auth.appSettings.post_caption_blur_intensity}px #000` }
                                        : undefined
                                }
                            >
                                {blog.description}
                            </h4>
                        </TooltipTrigger>
                        {blog.captionBlur && !auth.isAuthenticated && truncated && (
                            <TooltipContent className='max-w-lg break-words'>
                                {blog.description}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
                {truncated && (
                    <button
                        type='button'
                        className='mt-1 text-sm font-medium text-blue-600 cursor-pointer hover:underline'
                        onClick={() => setExpanded((prev) => !prev)}
                    >
                        {expanded ? 'Show Less' : 'Read More...'}
                    </button>
                )}
            </div>
        </div>
    )
}

function ModelProfileBlogDetailPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [selectedBlog, setSelectedBlog] = useState(null)
    const [commentList, setCommentList] = useState([])
    const [commentInput, setCommentInput] = useState('')
    const [isAnonymousComment, setIsAnonymousComment] = useState(false)
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)
    const [removingCommentId, setRemovingCommentId] = useState('')
    const [isBlogOpen, setIsBlogOpen] = useState(false)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const dispatch = useDispatch()
    const params = useParams()
    const auth = useSelector((state) => state.auth)

    const { id: websiteUrl, blogId } = params

    let blogUnlockButtonTextFontSize = auth.appSettings.blog_unlock_button_text_font_size.split('|')
    if (blogUnlockButtonTextFontSize.length !== 4) {
        blogUnlockButtonTextFontSize = ['12px', '12px', '12px', '12px']
    }

    // Promotions are disabled here so the detail page always shows the base price.
    let promotionPercentage = 0

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
        isSingleWebsiteBlogs: true
    })

    const getDiscountPrice = (amount) => {
        return Math.ceil(amount * (100 - promotionPercentage) / 100)
    }

    useEffect(() => {
        const fetchBlogDetails = async () => {
            try {
                setIsLoading(true)
                const response = await getWebsiteBlogInfo(websiteUrl, blogId, dispatch)
                const blog = normalizeBlogInfoResponse(response, websiteUrl)
                setSelectedBlog(blog)
                setCommentList(extractComments(blog))
            } finally {
                setIsLoading(false)
            }
        }

        if (!websiteUrl || !blogId) return
        fetchBlogDetails()
    }, [websiteUrl, blogId, dispatch])

    const openDlgBlog = (_index, nextGalleryIndex = 0) => {
        if (selectedBlog?.processing === false) {
            setIsBlogOpen(true)
            setGalleryIndex(nextGalleryIndex)
        }
    }

    const closeDialogBlog = () => {
        setIsBlogOpen(false)
        setGalleryIndex(0)
    }

    const totalComments = Number(selectedBlog?.total_comments ?? commentList.length ?? 0)

    const handleSubmitComment = async () => {
        const trimmedComment = commentInput.trim()

        if (!trimmedComment) {
            dispatch(setSweetAlert({ description: 'Type a comment.' }))
            return
        }

        try {
            setIsSubmittingComment(true)
            const response = await saveWebsiteBlogComment(
                websiteUrl,
                blogId,
                trimmedComment,
                isAnonymousComment,
                dispatch
            )

            if (!response) return

            setCommentInput('')
            const refreshedResponse = await getWebsiteBlogInfo(websiteUrl, blogId, dispatch)
            const refreshedBlog = normalizeBlogInfoResponse(refreshedResponse, websiteUrl)

            if (refreshedBlog) {
                setSelectedBlog(refreshedBlog)
                setCommentList(extractComments(refreshedBlog))
            }
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleRemoveComment = async (commentId) => {
        if (!commentId) return

        try {
            setRemovingCommentId(commentId)
            const response = await removeWebsiteBlogComment(websiteUrl, blogId, commentId, dispatch)
            if (!response) return

            const refreshedResponse = await getWebsiteBlogInfo(websiteUrl, blogId, dispatch)
            const refreshedBlog = normalizeBlogInfoResponse(refreshedResponse, websiteUrl)

            if (refreshedBlog) {
                setSelectedBlog(refreshedBlog)
                setCommentList(extractComments(refreshedBlog))
            }
        } finally {
            setRemovingCommentId('')
        }
    }

    return (
        <div className='min-h-[calc(100vh-var(--navbar-height))] overflow-y-auto bg-[linear-gradient(40deg,#c7e1f2,#e9d5ff)]'>
            <div className='mx-auto w-full max-w-4xl px-4 py-5 md:py-8'>
                {isLoading ? (
                    <div className='flex min-h-[50vh] items-center justify-center'>
                        <Loader isLoading={true} color='#000' />
                    </div>
                ) : selectedBlog ? (
                    <div className='rounded-2xl bg-white shadow-md overflow-hidden'>
                        <SelectedBlogCard
                            blog={selectedBlog}
                            auth={auth}
                            openDlgBlog={openDlgBlog}
                            blogUnlockButtonTextFontSize={blogUnlockButtonTextFontSize}
                            promotionPercentage={promotionPercentage}
                            unlockContent={handleUnlockContent}
                            getDiscountPrice={getDiscountPrice}
                        />

                        <div className='border-t'>
                            <div className='px-5 py-2 border-b bg-[#fcfbff]'>
                                <div className='flex items-start gap-3'>
                                    <div className='relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100'>
                                        <img
                                            src={auth?.user?.avatarUrl || getCloudFrontAssetsUrl('faces/avatar.png')}
                                            alt={auth?.user?.name || 'Your avatar'}
                                            className='h-full w-full object-cover'
                                        />
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <textarea
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            placeholder='Add a comment...'
                                            rows={3}
                                            maxLength={500}
                                            className='min-h-[96px] w-full resize-none rounded-2xl border border-[#d8d8e8] bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#ff1a9d]'
                                        />
                                        <div className='mt-3 flex items-center justify-between gap-3'>
                                            <label className='flex cursor-pointer items-center gap-2 text-xs text-gray-600'>
                                                <input
                                                    type='checkbox'
                                                    checked={isAnonymousComment}
                                                    onChange={(e) => setIsAnonymousComment(e.target.checked)}
                                                    className='h-4 w-4 cursor-pointer rounded border-[#d8d8e8]'
                                                />
                                                Comment anonymously
                                            </label>
                                            <button
                                                type='button'
                                                className='cursor-pointer rounded-full bg-[#ff1a9d] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                                                onClick={handleSubmitComment}
                                                disabled={!commentInput.trim() || isSubmittingComment}
                                            >
                                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='divide-y'>
                                {commentList.length > 0 ? (
                                    commentList.map((comment, index) => {
                                        const commentText = getCommentText(comment)
                                        const commentAuthor = getCommentAuthor(comment)
                                        const commentAvatar = getCommentAvatar(comment)
                                        const commentTime = getCommentTime(comment)
                                        const isOwnComment = comment?.user_id === auth?.user?._id

                                        return (
                                            <div key={comment?._id || comment?.id || `${index}-${commentText}`} className='flex items-start gap-3 px-5 py-3'>
                                                <div className='relative mt-1 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100'>
                                                    <img
                                                        src={commentAvatar}
                                                        alt={commentAuthor}
                                                        className='h-full w-full object-cover'
                                                    />
                                                </div>
                                                <div className='min-w-0 flex-1'>
                                                    <p className='text-sm leading-6 text-gray-700 break-words'>
                                                        <span className='mr-2 font-semibold text-[#1a0033]'>
                                                            {commentAuthor}
                                                        </span>
                                                        <span className='whitespace-pre-wrap'>
                                                            {commentText}
                                                        </span>
                                                    </p>
                                                    <div className='mt-1 flex items-center gap-3 text-xs text-gray-500'>
                                                        {commentTime && moment(commentTime).isValid() ? (
                                                            <div>
                                                                {moment(commentTime).fromNow()}
                                                            </div>
                                                        ) : null}
                                                        {isOwnComment && comment?._id && (
                                                            <button
                                                                type='button'
                                                                className='cursor-pointer font-medium text-[#ff1a9d] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50'
                                                                onClick={() => handleRemoveComment(comment._id)}
                                                                disabled={removingCommentId === comment._id}
                                                            >
                                                                {removingCommentId === comment._id ? 'Removing...' : 'Remove'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : totalComments > 0 ? (
                                    <div className='px-5 py-8 text-center text-sm text-gray-500'>
                                        {totalComments} comment{totalComments === 1 ? '' : 's'} exist for this post, but the response did not include the individual comment records.
                                    </div>
                                ) : (
                                    <div className='px-5 py-8 text-center text-sm text-gray-500'>
                                        No comments yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='rounded-2xl bg-white px-5 py-10 text-center shadow-md'>
                        <h1 className='text-xl font-semibold text-[#1a0033]'>Post not found</h1>
                        <p className='mt-2 text-sm text-gray-500'>We could not find that post.</p>
                    </div>
                )}
            </div>

            {isBlogOpen === true && selectedBlog && selectedBlog.blogType !== 'gallery' && (
                <FullScreenModelPopUpDialog
                    type={selectedBlog.blogType === 'video' ? 'video' : 'photo'}
                    url={selectedBlog.media[0].url}
                    handleClose={closeDialogBlog}
                />
            )}
            {isBlogOpen === true && selectedBlog && selectedBlog.blogType === 'gallery' && (
                <FullScreenGalleryDialog
                    galleryImages={selectedBlog.gallery}
                    closeDialogBlog={closeDialogBlog}
                    userId={auth.user._id}
                    galleryIndex={galleryIndex}
                    isPreviewEnable={selectedBlog.isPreviewEnable}
                    previewEnableImages={selectedBlog.previewEnableImages}
                    isLocked={selectedBlog.isLocked}
                    contentCount={selectedBlog.contentCount}
                    thumbImages={selectedBlog.thumbnailUrlGallery}
                    media={selectedBlog.media}
                    contentFrom='blog'
                />
            )}
            {showAddFundPopup === true && (
                <ModalPopUp handleClose={() => { setShowAddFundPopup(false) }}>
                    <div className='modal-body'>
                        <div className='container'>
                            <AddFundPopup
                                onHideAddFund={() => setShowAddFundPopup(false)}
                                type='blog'
                                transactionAmount={Number(unlockData.amount)}
                                remainAmount={remainAmount}
                                onCompleteTransaction={(updatedBalance) => {
                                    setShowAddFundPopup(false)
                                    if (updatedBalance) {
                                        unlockBlogUsingCrypto(updatedBalance)
                                    }
                                }}
                            />
                        </div>
                    </div>
                </ModalPopUp>
            )}
            {showAlert && (
                <ConfirmSweetAlertsWrapper
                    onConfirm={() => { sendUnlockContentRequest(unlockData) }}
                    onCancel={() => { setShowAlert(false) }}
                />
            )}
        </div>
    )
}

export default withPrivateRoute(ModelProfileBlogDetailPage, ALLOW_ALL)
