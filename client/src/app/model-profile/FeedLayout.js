import { useDispatch, useSelector } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'
import _ from 'lodash'
import BlogData from '../feed/BlogData'
import ChatMessageButton from '../../components/layout/ChatMessageButton'
import { chatUserProfileInfo, showCloseButtonOnChatScreen } from '../../../store/slices/chatSlice'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEffect, useRef, useState } from 'react'
import { googleAnalyticsTrackEvent } from '../../lib/google-analytics-event'
import { blogPurchasePayment } from '../../action/hybrid-payment.action'
import ConfirmSweetAlertsWrapper from '../../components/modals/ConfirmSweetAlertsWrapper'
import { setAlertLoader, setConfirmSweetAlert, setSweetAlert } from '../../../store/slices/sweetAlertSlice'
import { setSelectedChatId } from '../../action/chat.action'
import { updateWalletAmount } from '../../../store/slices/authSlice'
import { purchaseFromWallet } from '@/action/crypto-payment.action'
import cleanDomain from '@/lib'
import { cn } from '@/lib/utils'
import ModalPopUp from '@/components/modals/ModalPopUp'
import AddFundPopup from '@/components/modules/crypto/AddFundPopup'
import useUnlockContent from '@/hook/useUnlockContent'

export default function FeedLayout(props) {
    const [truncatedMap, setTruncatedMap] = useState({})
    const [expandedMap, setExpandedMap] = useState({})
    const websiteBlogData = useSelector((state) => state.websiteBlog)
    const modelInfo = useSelector((state) => state.blog.modelInfo)
    const auth = useSelector((state) => state.auth)
    const chat = useSelector((state) => state.chat)
    const params = useParams()
    const { id: website_url } = params
    const textRefs = useRef({})
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
        isSingleWebsiteBlogs: true
    })


    let blogUnlockButtonTextFontSize = auth.appSettings.blog_unlock_button_text_font_size.split('|')
    if (blogUnlockButtonTextFontSize.length !== 4) {
        blogUnlockButtonTextFontSize = ['12px', '12px', '12px', '12px']
    }

    // Promotions are disabled here so profile unlocks always use the base price.
    let promotionPercentage = 0

    const redirectUrl = () => {
        let url = `/private-chat?name=${auth.user.domain}`
        const targetWebsiteId = website_url || chat?.websiteId || modelInfo?.website_id
        if (targetWebsiteId) {
            url = `/private-chat/${targetWebsiteId}?name=${auth.user.domain}`
            const paramsId = Number(targetWebsiteId)
            if (chat.userList) {
                let userDetail = chat.userList.find(obj => obj.website_id === paramsId)
                if (userDetail) {
                    dispatch(setSelectedChatId(userDetail?._id, null, paramsId))
                    dispatch(chatUserProfileInfo(userDetail))
                }
            }
        }
        router.push(url)
        dispatch(showCloseButtonOnChatScreen(true))
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
    }, [websiteBlogData.blogs[website_url]?.blogs])

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
        <>
            {websiteBlogData.blogs[website_url]?.blogs.length > 0 && websiteBlogData.blogs[website_url]?.blogs.map((blog, index) => {
                const isCaptionBlurred = blog.captionBlur && !auth.isAuthenticated
                const isExpanded = !!expandedMap[blog._id]

                return (
                    <div
                        key={blog._id}
                        className='relative w-full rounded-2xl bg-white shadow-md overflow-hidden flex flex-col p-2'
                    >
                        {/* Image Section */}
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
                                index={index}
                                id={blog._id}
                                openDlgBlog={props.openDlgBlog}
                                blogType={blog.blogType}
                                contentCount={blog.contentCount}
                                role={auth.user.role}
                                isDesktop={false}
                                currentMediaIndex={index}
                                content_length={blog.content_length}
                                unlockButtonFontSize={blogUnlockButtonTextFontSize}
                                promotionPercentage={promotionPercentage}
                                show_content_length={blog.show_content_length}
                                media_preview={blog.media_preview}
                                amount={blog.amount}
                                getDiscountPrice={getDiscountPrice}
                                description={blog.description}
                                unlockContent={handleUnlockContent}
                                website_url={blog.user.website_url}
                                total_likes={blog.total_likes}
                                total_comments={blog.total_comments}
                                user_feed_like={blog.user_feed_like}
                                isSubscribedToWebsite={blog.isSubscribedToWebsite}
                            />
                        </div>
                        <div className='py-3 bg-white'>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <h4
                                            ref={(el) => (textRefs.current[blog._id] = el)}
                                            className={cn(
                                                'text-sm leading-5',
                                                !isExpanded && 'max-h-[60px] overflow-hidden',
                                                isCaptionBlurred ? 'text-transparent' : 'text-gray-800'
                                            )}
                                            style={
                                                isCaptionBlurred
                                                    ? {
                                                        textShadow: `0 0 ${auth.appSettings.post_caption_blur_intensity}px #000`,
                                                    }
                                                    : undefined
                                            }>
                                            {blog.description}
                                        </h4>
                                    </TooltipTrigger>

                                    {isCaptionBlurred && truncatedMap[blog._id] && (
                                        <TooltipContent className='max-w-lg break-words'>
                                            {blog.description}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                            {truncatedMap[blog._id] && (
                                <button
                                    type='button'
                                    className='mt-1 text-sm font-medium text-blue-600 cursor-pointer hover:underline'
                                    onClick={() => toggleExpandedCaption(blog._id)}
                                >
                                    {isExpanded ? 'Show Less' : 'Read More...'}
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
            {/* <div className='fixed right-0 bottom-4 z-50'>
                <ChatMessageButton redirectUrl={redirectUrl} />
            </div> */}
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
        </>
    )
}
