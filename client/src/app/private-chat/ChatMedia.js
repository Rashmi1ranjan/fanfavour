import { useState } from 'react'
import { useSelector } from 'react-redux'
import _ from 'lodash'
import { Video } from 'lucide-react'
import { mediaTypes } from '../../lib/constant'
import { getCloudFrontAssetsUrl } from '../../lib/assets'
import Image from 'next/image'
import Button from '../../components/common/Button'
import FullScreenModelPopUpDialog from '../../components/modals/FullScreenModelDialogPopup'
import FullScreenGalleryDialog from '../../components/gallery/FullScreenGalleryDialog'

export default function ChatMedia(props) {
    const auth = useSelector((state) => state.auth)
    const { message, setIsPopupOpen, classes, isReceiver, isPopupOpen } = props
    const {
        blur_user_sent_media
    } = auth.appSettings
    const [urls, setUrl] = useState('')
    const [type, setType] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [index, setIndex] = useState(-1)
    // const [pageNum, setPageNum] = useState(1)
    let messageType = message.type
    if ((mediaTypes.includes(messageType)) && message.media.length > 0) {
        messageType = 'gallery'
        if (message.media.length === 1) {
            messageType = message.media[0].content_type
        }
    }

    let imageUrl = ''
    if (messageType === 'photo') {
        if (message.isLocked === 'locked' && !auth.user.isAdmin) {
            imageUrl = _.isEmpty(message.media) === false ? message.media[0].blur_url : ''
        } else if (blur_user_sent_media === true && auth.user.isAdmin === true && message.media.length > 0 && !_.isEmpty(message.media[0].blur_url)) {
            imageUrl = message.media[0].blur_url
        } else if (message.media.length > 0 && !_.isEmpty(message.media[0].thumbnail_url)) {
            imageUrl = message.media[0].thumbnail_url
        } else if (_.isEmpty(message.mediaUrl) && message.media.length > 0 && !_.isEmpty(message.media[0].url)) {
            imageUrl = message.media[0].url
        } else {
            imageUrl = props.media.mediaUrl
        }
    }

    let videoUrl = ''
    if (messageType === 'video') {
        if (message.isLocked === 'locked' && !auth.user.isAdmin) {
            videoUrl = _.isEmpty(message.media) === false ? message.media[0].blur_url : ''
        } else if (blur_user_sent_media === true && auth.user.isAdmin === true && message.media.length > 0 && !_.isEmpty(message.media[0].blur_url)) {
            videoUrl = message.media[0].blur_url
        } else {
            videoUrl = _.isEmpty(message.media) === false ? message.media[0].thumbnail_url : ''
        }
    }
    let contentUrlForMyMessage = ''
    if (messageType === 'photo') {
        contentUrlForMyMessage = imageUrl
    } else if (messageType === 'video') {
        contentUrlForMyMessage = videoUrl
    } else if (messageType === 'gallery') {
        contentUrlForMyMessage = _.isEmpty(message.media) === false
            ? (message.isLocked === 'locked' && !auth.user.isAdmin) ? message.media[0].blur_url : message.media[0].thumbnail_url
            : ''
    }

    function getGalleryPhotoAndVideoCount() {
        const photo = _.get(message.contentCount, 'photo', 0)
        const video = _.get(message.contentCount, 'video', 0)
        if (messageType === 'video') {
            return <div className={`absolute left-1/2 -translate-x-1/2 text-center text-[16px] text-black w-max ${isPreviewAvailable ? 'bottom-10' : 'bottom-1.5'}`}>
                <span className='flex flex-center gap-1 bg-[#dddddd]/70 rounded-[5px] px-[5px]'>
                    <Video fill="#000" strokeWidth={0} /> 1
                </span>
            </div>
        }
        if (messageType !== 'gallery') {
            return <></>
        }

        return <>
            {(photo > 0 || video > 0) && (
                <div
                    className={`absolute left-1/2 -translate-x-1/2 text-center text-[16px] text-black w-max ${isPreviewAvailable ? 'bottom-10' : 'bottom-1.5'}`}
                >
                    <span
                        className='flex flex-center gap-1 bg-[#dddddd]/70 rounded-[5px] px-[5px]'
                    >
                        {photo > 0 && (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-icon lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                {photo}
                            </>
                        )}
                        {photo > 0 && video > 0 && ' | '}
                        {video > 0 && (
                            <>
                                <Video fill="#000" strokeWidth={0} /> {video}
                            </>
                        )}
                    </span>
                </div>
            )}

        </>
    }

    const openFullScreenDlg = (media) => {
        setUrl(media.url)
        setType(media.content_type)
        setIsPreviewOpen(!isPreviewOpen)
        if (setIsPopupOpen) setIsPopupOpen(true)
        if (isPopupOpen) isPopupOpen(true)
    }

    const openDlgBlog = (index) => {
        setIsDialogOpen(true)
        setIndex(index)
        if (setIsPopupOpen) setIsPopupOpen(true)
        if (isPopupOpen) isPopupOpen(true)
    }

    const closeDialogBlog = () => {
        setIsDialogOpen(false)
        if (setIsPopupOpen) setIsPopupOpen(false)
        if (isPopupOpen) isPopupOpen(false)
    }

    const processImageFilePath = getCloudFrontAssetsUrl('blog/process_image.png')
    const isPreviewAvailable = mediaTypes.includes(message.type) && message.media_preview.length > 0

    return (
        <>
            {/* PROCESSING STATE */}
            {message.processing && (
                <div className='inline-block bg-black p-4 rounded-md w-[300px] text-start'>
                    <img
                        src={processImageFilePath}
                        alt='processing'
                        className='mx-auto mb-2 h-[150px] w-auto object-contain'
                    />
                    <p className='text-sm text-gray-300'>
                        This message is under process. It will be visible to {auth.isAdmin ? 'you' : 'users'} when processing is completed.
                    </p>
                </div>
            )}
            {/* IMAGE MESSAGE */}
            {!message.processing && contentUrlForMyMessage && (
                <>
                    {/* IMAGE */}
                    <Image
                        height={500}
                        width={500}
                        src={contentUrlForMyMessage}
                        alt=''
                        onClick={() => openDlgBlog(props.index)}
                        draggable={false}
                        className={`object-cover aspect-square ${message.isLocked === 'locked'
                            ? 'pointer-events-none opacity-80'
                            : 'cursor-pointer'
                            }`}
                    />
                    {/* MEDIA COUNT */}
                    {getGalleryPhotoAndVideoCount()}
                    {/* PREVIEW BUTTON */}
                    {isPreviewAvailable && (
                        <div className='absolute bottom-0 left-0 w-full z-10 bg-black'>
                            <Button
                                type='button'
                                onClick={() => openFullScreenDlg(message.media_preview[0])}
                                classes='w-full text-[12px] text-white py-2 cursor-pointer bg-transparent hover:bg-black/50 cursor-pointer'
                            >
                                Preview
                            </Button>
                        </div>
                    )}
                </>
            )}
            {isDialogOpen && index >= 0 && message.type === 'gallery' &&
                <FullScreenGalleryDialog
                    galleryImages={message.galleryMediaUrl}
                    closeDialogBlog={closeDialogBlog}
                    classes={classes}
                    userId={auth.user._id}
                    galleryIndex={0}
                    contentFrom='massMessage'
                    media={message.media}
                />
            }
            <>
                {isDialogOpen && message.type !== 'gallery' &&
                    <FullScreenModelPopUpDialog
                        url={message.media[0].url}
                        handleClose={closeDialogBlog}
                        type={message.type}
                    />
                }
            </>
            {isPreviewOpen &&
                <FullScreenModelPopUpDialog
                    url={urls}
                    handleClose={() => { openFullScreenDlg(''); setIsPopupOpen(false) }}
                    type={type}
                    showWatermark={auth.user.isAdmin ? false : true}
                />
            }
        </>

    )
}