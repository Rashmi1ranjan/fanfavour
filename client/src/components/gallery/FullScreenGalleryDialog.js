import _ from "lodash"
import { useEffect } from "react"
import { X } from 'lucide-react'
import GalleryCarousel from "./GalleryCarousel"

export default function FullScreenGalleryDialog(props) {
    const isPreviewEnable = _.get(props, 'isPreviewEnable', false)
    const isLocked = _.get(props, 'isLocked', false)
    const { contentFrom, previewEnableImages, galleryImages, closeDialogBlog } = props

    let showImages = 0

    if (contentFrom !== 'blog') {
        showImages = isPreviewEnable === true && isLocked === true ? [previewEnableImages[0]] : galleryImages
    } else {
        showImages = isPreviewEnable === true && isLocked === true ? [props.media[0]] : props.media
    }

    const onCloseDialog = () => {
        let isVideoExists = false
        for (let i = 0; i < showImages.length - 1; i++) {
            if (showImages[i].content_type === 'video') {
                isVideoExists = true
            }

        }
        if (isVideoExists === true) {
            document.querySelectorAll('.myVideoPause').forEach(vid => vid.pause())
        }

        closeDialogBlog()
    }

    useEffect(() => {
        const close = (event) => {
            (event.keyCode === 27) && closeDialogBlog()
        }
        window.addEventListener('keydown', close)
        return () => {
            window.removeEventListener('keydown', close)
        }
    }, [])

    useEffect(() => {
        window.addEventListener('mousedown', onClickOutSideContent)
        return () => window.removeEventListener('mousedown', onClickOutSideContent)
    }, [props.contentFrom])

    const onClickOutSideContent = (e) => {
        let node = e.target
        let inside = false
        while (node) {
            if (node.classList.contains('gallery-content-overlay')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        node = e.target
        while (node) {
            if (node.classList.contains('fa-chevron-left')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        node = e.target
        while (node) {
            if (node.classList.contains('fa-chevron-right')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        node = e.target
        while (node) {
            if (node.classList.contains('sc-frDJqD')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        node = e.target
        while (node) {
            if (node.classList.contains('sc-hmzhuo')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        if (!inside) {
            onCloseDialog()
        }
    }

    let media = []
    if (contentFrom === 'massMessage' || contentFrom === 'blog' || contentFrom === 'chat' || contentFrom === 'liveStream') {
        media = _.get(props, 'media', [])
    }
    if (media.length === 0) {
        for (let element of showImages) {
            media.push({ url: element, content_type: 'photo' })
        }
    }

    return (
        <div className='fixed inset-0 z-[9999] bg-black/90'>
            {/* CLOSE BUTTON */}
            <button
                onClick={() => {
                    if (props.type === 'video') {
                        document
                            .querySelectorAll('.myVideoPause')
                            .forEach(vid => vid.pause())
                    }
                    props.handleClose()
                }}
                className='absolute top-4 right-4 z-300 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer'
            >
                <X size={20} />
            </button>

            {/* CENTERED CONTENT */}
            <div className='flex h-full w-full items-center justify-center'>
                <GalleryCarousel
                    media={media}
                    currentIndex={props.galleryIndex}
                    handleClose={props.handleClose}
                />
            </div>
        </div>

    )
}