'use client'

import _ from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/components/ui/carousel'
import { isIOS } from 'react-device-detect'
import { v4 as uuidv4 } from 'uuid'
import { OverlayContainer } from '../layout/OverlayContainer'

const getWatermarkPosition = (position) => {
    const positions = {
        'top-left': { top: '8px', left: '8px' },
        'top-right': { top: '8px', right: '8px' },
        'bottom-left': { bottom: '8px', left: '8px' },
        'bottom-right': { bottom: '8px', right: '8px' }
    }
    return positions[position] || positions['bottom-right']
}


export default function GalleryCarousel({ media = [], currentIndex = 0 }) {
    const auth = useSelector(state => state.auth)
    const [api, setApi] = useState(null)
    const [current, setCurrent] = useState(1)
    const itemsRef = useRef([])

    /* Pause video when slide changes */
    useEffect(() => {
        if (!api) return

        const handleSelect = () => {
            const activeIndex = api.selectedScrollSnap()

            // pause all videos except active
            itemsRef.current.forEach((item, index) => {
                if (item && typeof item.pause === 'function' && index !== activeIndex) {
                    item.pause()
                }
            })
            setCurrent(activeIndex + 1)
        }

        // initial sync
        handleSelect()

        api.on('select', handleSelect)

        return () => {
            api.off('select', handleSelect)
        }
    }, [api])

    useEffect(() => {
        if (!api) return;

        api.scrollTo(currentIndex, true)
    }, [api, currentIndex])


    const stop = e => {
        e.preventDefault()
        e.stopPropagation()
    }

    const options = {
        align: 'center',
        loop: true,
        dragFree: false
    }

    return (
        <div className='gallery-carousel-wrapper w-full' style={{
            '--carousel-max-height': isIOS ? 'var(--app-height)' : '90vh'
        }}>
            <div className='relative w-full h-full px-12'>
                <Carousel opts={options} setApi={setApi} onClick={stop} key={currentIndex} className='w-full max-w-full'>
                    <div className='fixed bottom-4 left-4 z-50 rounded-full bg-black/60 px-3 py-1 text-sm text-white'>
                        {current}/{media.length}
                    </div>
                    <div className='gallery-content-overlay'>
                        <CarouselContent>
                            {media.map((item, index) => {
                                const { url, content_type, video_poster } = item
                                const isVideo = content_type === 'video'
                                return (
                                    <CarouselItem key={index} className='basis-full'>
                                        <div className='p-2'>
                                            <Card className='border-0 shadow-none bg-transparent'>
                                                <CardContent
                                                    className='flex flex-col justify-center items-center w-full h-full px-12 max-md:px-0'
                                                >
                                                    <div className={cn('flex justify-center items-center', isIOS ? 'h-[var(--app-height)]' : 'h-[90vh]')}>
                                                        <div className='relative flex justify-center items-center'>
                                                            {auth.appSettings.enable_watermark && (
                                                <div
                                                    className='absolute pointer-events-none select-none'
                                                    style={{
                                                        ...getWatermarkPosition(auth.appSettings.watermark_position),
                                                        zIndex: 20,
                                                        opacity: 0.8,
                                                        fontSize: `${auth.appSettings.watermark_size}rem`,
                                                        color: auth.appSettings.watermark_color
                                                    }}
                                                >
                                                    {auth.user._id}
                                                </div>
                                                            )}

                                                            {isVideo ? (
                                                                <video
                                                                    key={index}
                                                                    controls
                                                                    controlsList='nodownload'
                                                                    poster={video_poster}
                                                                    playsInline
                                                                    ref={element => itemsRef.current[index] = element}
                                                                    className='w-full object-contain'
                                                                >
                                                                    <source src={url} />
                                                                </video>
                                                            ) : (
                                                                <img
                                                                    src={url}
                                                                    ref={el => (itemsRef.current[index] = el)}
                                                                    alt=''
                                                                    draggable={false}
                                                                    className='mx-auto block object-contain pointer-events-none'
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </CarouselItem>
                                )
                            })}
                        </CarouselContent>
                    </div>
                    {/* RIGHT ARROW */}
                    <div onClick={() => api?.scrollNext()} className='absolute -right-8 top-1/2 -translate-y-1/2 z-40 cursor-pointer'>
                        <ChevronRight className='text-white/80 hover:text-white fa-chevron-right' size={36} strokeWidth={2.5} />
                    </div>

                    {/* LEFT ARROW */}
                    <div onClick={() => api?.scrollPrev()} className='absolute -left-8 top-1/2 -translate-y-1/2 z-40 cursor-pointer'>
                        <ChevronLeft className='text-white/80 hover:text-white fa-chevron-left' size={36} strokeWidth={2.5} />
                    </div>
                </Carousel >
            </div>
        </div>
    )
}

