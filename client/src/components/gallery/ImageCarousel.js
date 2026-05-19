'use client'

import Image from 'next/image'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function ImageCarousel({ images, alt = 'Image', height }) {
    const [api, setApi] = useState()
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) return

        setCurrent(api.selectedScrollSnap())

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    if (!images || images.length === 0) return null

    return (
        <div className='relative w-full'>
            <Carousel
                setApi={setApi}
                opts={{ loop: true }}
                className='w-full'
            >
                <CarouselContent>
                    {images.map((image, index) => (
                        <CarouselItem key={index}>
                            <div
                                className='relative w-full'
                                style={{ height: height ? height : '580px' }}
                            >
                                <Image
                                    src={image}
                                    alt={`${alt}-${index}`}
                                    fill
                                    draggable={false}
                                    className='object-cover'
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {images.length > 1 && (
                    <>
                        <CarouselPrevious type='button' className='left-4 top-1/2 -translate-y-1/2 cursor-pointer z-40' />
                        <CarouselNext type='button' className='right-4 top-1/2 -translate-y-1/2 cursor-pointer z-40' />
                    </>
                )}
            </Carousel>

            {/* DOTS OUTSIDE CAROUSEL */}
            {images.length > 1 && (
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50'>
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn('h-3 w-3 bg-white rounded-full transition-all duration-300', current === index ? 'bg-white' : 'bg-white/60')}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}