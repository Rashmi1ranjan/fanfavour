import { useState } from "react"
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isDesktop } from "react-device-detect"

export default function BlogMedia(props) {
    const { media, isLocked, contentLeftForProcessing, currentMediaIndex, disableFixedHeight } = props
    const [index, setIndex] = useState(0)
    const showNextAndPreviousButton = contentLeftForProcessing > 0 ? false : (isLocked === false && media.length > 1) ? true : false

    const previousMedia = () => {
        let currentIndex = index - 1
        if (index <= 0) {
            currentIndex = media.length - 1
            return setIndex(currentIndex)
        }
        setIndex(currentIndex)
    }

    const nextMedia = () => {
        let currentIndex = index + 1
        if (index >= (media.length - 1)) {
            return setIndex(0)
        }
        setIndex(currentIndex)
    }
    let url = ''
    if (media[index]) {
        if (Boolean(isLocked) === true) {
            url = media[index].blur_url
        } else {
            if (media[index].content_type === 'video') {
                url = media[index].thumbnail_url
            } else {
                url = media[index].url
            }
        }
    }

    const currentItem = media[index]
    return <div className="relative h-full">
        {showNextAndPreviousButton &&
            <div className='absolute inset-y-0 left-0 flex items-center z-5 cursor-pointer pl-2' onClick={previousMedia}>
                <ChevronLeft color="#ddddddaa" size={40} strokeWidth={3} />
            </div>
        }
        <div className='h-full text-center'>
            <div className="relative h-full"
                onClick={() => {
                    if (Boolean(isLocked) !== true) {
                        props.openDlgBlog(props.i, index, currentMediaIndex)
                    }
                }}>
                <img
                    draggable={false}
                    src={url}
                    alt=''
                    className={cn(
                        'h-full rounded-xl blog-media-image',
                        disableFixedHeight && 'blog-media-image--auto-height',
                        props.isLocked ? 'cursor-inherit' : 'cursor-pointer',
                        !isDesktop ? 'h-[480px]' : (disableFixedHeight ? '' : 'h-36')
                    )}
                />
                {(Boolean(isLocked) === false && currentItem && currentItem.content_type === 'video') &&
                    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center'>
                        <div className='z-10 cursor-pointer'>
                            <span className="blog-media-video-button-span">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="80"
                                    height="80"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" fill="white" />
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </span>
                        </div>
                    </div>
                }
            </div >
        </div >
        {showNextAndPreviousButton &&
            <div className="absolute inset-y-0 right-0 flex items-center z-5 cursor-pointer pr-2" onClick={nextMedia}>
                <ChevronRight color="#ddddddaa" size={40} strokeWidth={3} />
            </div>
        }
    </div >
}
