'use client'

import Image from "next/image"
import { useSelector } from "react-redux"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCloudFrontAssetsUrl } from "../../../lib/assets"
import { useDispatch } from "react-redux"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { getSelectedModel } from "../../../action/api"
import { storeSelectedModel } from "../../../../store/slices/blogSlice"
import Loader from "@/components/common/Loader"
import FeedLayout from "../FeedLayout"
import FullScreenModelPopUpDialog from "@/components/modals/FullScreenModelDialogPopup"
import FullScreenGalleryDialog from "@/components/gallery/FullScreenGalleryDialog"
import { getWebsiteBlogData } from "@/action/blog.action"
import Pagination from "@/components/common/Pagination"

import {
    Carousel,
    CarouselContent,
    CarouselItem
} from '@/components/ui/carousel'
import Button from "@/components/common/Button"
import { withPrivateRoute } from "@/components/layout/PrivateRoute"
import { ALLOW_ALL } from "@/lib/constant"
import { cn } from "@/lib/utils"

function ModelProfilePage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isLoader, setIsLoader] = useState(false)
    const [isBlogOpen, setIsBlogOpen] = useState(false)
    const [index, setIndex] = useState(0)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const [api, setApi] = useState()
    const blogData = useSelector((state) => state.blog)
    const auth = useSelector((state) => state.auth)
    const websiteBlogData = useSelector((state) => state.websiteBlog)
    const { modelInfo } = blogData
    const dispatch = useDispatch()
    const params = useParams()
    const { id: website_url } = params
    const scrollRef = useRef(null)
    const fetchingRef = useRef(false)
    const blogPage = useRef(0)
    const stickyTriggerRef = useRef(null)
    const stickyThresholdRef = useRef(0)
    const showStickyNameRef = useRef(false)
    const stickyRafRef = useRef(null)
    const [showStickyName, setShowStickyName] = useState(false)

    const { bannerImages } = auth

    const { currentPage = 0, totalPages = 0 } = websiteBlogData.blogs[website_url] || {}

    const fetchModelInfo = async () => {
        try {
            setIsLoading(true)
            const response = await getSelectedModel(website_url)
            dispatch(storeSelectedModel(response))
            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!auth.appSettings.is_pagination_on_exclusive_content_enabled) {
            const container = scrollRef.current
            if (container) {
                container.addEventListener('scroll', loadMoreBlogs, { passive: true })
                return () => container.removeEventListener('scroll', loadMoreBlogs)
            }
        }
    }, [currentPage, totalPages, isLoading, auth.appSettings.is_pagination_on_exclusive_content_enabled])

    // Scroll-based detection for sticky header with a stable anchor
    useEffect(() => {
        const container = scrollRef.current
        const trigger = stickyTriggerRef.current
        if (!container || !trigger) return

        const updateThreshold = () => {
            stickyThresholdRef.current = trigger.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
        }

        const syncStickyState = () => {
            if (stickyRafRef.current !== null) return

            stickyRafRef.current = window.requestAnimationFrame(() => {
                stickyRafRef.current = null

                const scrollTop = container.scrollTop
                const threshold = stickyThresholdRef.current
                const buffer = 12

                let nextState = showStickyNameRef.current
                if (!showStickyNameRef.current && scrollTop > threshold + buffer) {
                    nextState = true
                } else if (showStickyNameRef.current && scrollTop < threshold - buffer) {
                    nextState = false
                }

                if (nextState !== showStickyNameRef.current) {
                    showStickyNameRef.current = nextState
                    setShowStickyName(nextState)
                }
            })
        }

        updateThreshold()
        syncStickyState()
        container.addEventListener('scroll', syncStickyState, { passive: true })
        window.addEventListener('resize', updateThreshold)
        return () => {
            container.removeEventListener('scroll', syncStickyState)
            window.removeEventListener('resize', updateThreshold)
            if (stickyRafRef.current !== null) {
                window.cancelAnimationFrame(stickyRafRef.current)
                stickyRafRef.current = null
            }
        }
    }, [isLoading])

    useEffect(() => {
        const getBlogsData = async () => {
            const currentPage = websiteBlogData.blogs[website_url]?.currentPage || 0
            const data = {
                pageNum: currentPage !== 0 ? currentPage : 1,
                // feedTagId: blogData.selectedTag,
                isPaginationEnabled: false
            }
            if (currentPage === 0) {
                await getWebsiteBlogData(website_url, data, dispatch)
            } else {
                setIsLoader(false)
            }
        }
        getBlogsData()
    }, [])

    const loadMoreBlogs = async () => {
        if (fetchingRef.current || isLoader) return

        const container = scrollRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container

        if (scrollTop + clientHeight < scrollHeight - 100) return
        const page = blogPage.current
        if (page >= totalPages) return

        fetchingRef.current = true
        setIsLoader(true)

        try {
            const data = {
                pageNum: page + 1,
                feedTagId: blogData.selectedTag,
                isPaginationEnabled: false
            }
            await getWebsiteBlogData(website_url, data, dispatch)
        } finally {
            fetchingRef.current = false;
            setIsLoader(false)
        }
    }

    const changePage = async (pageNum) => {
        setIsLoader(true)
        let data = {
            pageNum: pageNum,
            feedTagId: blogData.selectedTag,
            isPaginationEnabled: true
        }
        await getWebsiteBlogData(website_url, data, dispatch)
        setIsLoader(false)
        const container = scrollRef.current
        if (container) {
            container.scrollTo({
                top: 0,
                behavior: 'auto'
            })
        }
    }

    useEffect(() => {
        blogPage.current = currentPage
    }, [currentPage])

    useEffect(() => {
        fetchModelInfo()
    }, [])

    const openDlgBlog = (index, galleryIndex) => {
        if (galleryIndex === undefined) {
            galleryIndex = 0
        }
        if (websiteBlogData.blogs[website_url].blogs[index].processing === false) {
            setIsBlogOpen(true)
            setIndex(index)
            setGalleryIndex(galleryIndex)
        }
    }

    const closeDialogBlog = () => {
        setIsBlogOpen(false)
        setIndex(-1)
    }

    return (
        <div className='h-[calc(100vh-var(--navbar-height))] bg-[linear-gradient(40deg,#c7e1f2,#e9d5ff)] flex justify-center overflow-y-auto' ref={scrollRef}>
            {isLoading ?
                <div className="flex items-center justify-center w-full">
                    <Loader isLoading={isLoading} color='#000' />
                </div>
                :
                <div className='w-full max-w-6xl bg-white rounded-t-[21px] -mt-4 md:mt-10'>
                    <div className="relative h-[320px] w-full rounded-t-[21px] overflow-hidden">
                        {bannerImages?.length > 1 ?
                            <Carousel opts={{ loop: true }} setApi={setApi} className="w-full h-full">
                                <CarouselContent>
                                    {bannerImages.map((img, index) => (
                                        <CarouselItem key={index} className="basis-full">
                                            <div className="relative h-[320px] w-full">
                                                <Image
                                                    src={img}
                                                    fill
                                                    alt={`banner-${index}`}
                                                    className="object-cover rounded-t-[21px]"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <Button
                                    onClick={() => api?.scrollPrev(true)}
                                    classes="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-[#ff1a9d] w-8 h-8 rounded-full flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5 text-white" strokeWidth={4} />
                                </Button>
                                <Button
                                    onClick={() => api?.scrollNext(true)}
                                    classes="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-[#ff1a9d] w-8 h-8 rounded-full flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5 text-white" strokeWidth={4} />
                                </Button>
                            </Carousel>
                            :
                            <Image
                                src={bannerImages?.[0]}
                                fill
                                alt="banner"
                                className="object-cover rounded-t-[21px]"
                            />
                        }
                        <div className="absolute bottom-0 right-0 -translate-x-3 -translate-y-6 hidden md:block">
                            <a href={modelInfo.instagramUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={getCloudFrontAssetsUrl('social-icons/instagram.png')} width={50} height={50} className="h-[30px] w-[30px]" alt="" />
                            </a>
                        </div>
                    </div>
                    <div ref={stickyTriggerRef} className="h-px w-full" aria-hidden="true" />
                    <div className="md:bg-[#f8f8f8] bg-white rounded-t-2xl md:rounded-t-none -mt-6 md:-mt-4 relative">
                        <div className={cn('sticky top-0 z-10 bg-white md:bg-[#f8f8f8] w-full transition-shadow duration-300', {
                            'shadow-md top-[-2px]': showStickyName
                        })}>
                            <div className={cn('w-full transition-all duration-300 ease-out', {
                                'md:px-8 px-5 py-1.5': showStickyName,
                                'md:p-8 p-5': !showStickyName
                            })}>
                                <div className={cn("flex flex-col font-normal", {
                                    'gap-0 justify-center': showStickyName,
                                    'gap-4 md:gap-2': !showStickyName
                                })}>
                                    <div className="flex items-center justify-between md:justify-center relative ">
                                        <span id='model-name' className="text-2xl text-[#1a0033]">
                                            {modelInfo.name}
                                        </span>
                                        {!showStickyName && (
                                            <a
                                                href={modelInfo.instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="md:hidden shrink-0"
                                            >
                                                <Image
                                                    src={getCloudFrontAssetsUrl('social-icons/instagram.png')}
                                                    width={50}
                                                    height={50}
                                                    className="h-[30px] w-[30px]"
                                                    alt=""
                                                />
                                            </a>
                                        )}
                                    </div>
                                    <span
                                        className={cn('block md:text-center text-md text-[#000] transition-opacity duration-300 overflow-hidden', {
                                            'max-h-0 opacity-0 !mt-0 !mb-0 !py-0': showStickyName,
                                            'opacity-100': !showStickyName
                                        })}
                                    >
                                        {auth.appSettings.text_exclusive_content_banner}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='px-4 md:px-8 lg:px-16 pb-8 bg-[#f8f8f8] py-2 scrollbar'>
                            {(websiteBlogData.isBlogLoading && !(isLoader && auth.appSettings.is_pagination_on_exclusive_content_enabled)) &&
                                <div className='w-full h-full flex items-center justify-center mx-auto'>
                                    <Loader isLoading={websiteBlogData.isBlogLoading} color='#000' />
                                </div>
                            }
                            <span className={cn('mb-4 block transition-opacity duration-300 overflow-hidden', {
                                'max-h-0 opacity-0 !mb-0': showStickyName,
                                'max-h-10 opacity-100': !showStickyName
                            })}>Recent Posts</span>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 py-2'>
                                {websiteBlogData.blogs[website_url]?.blogs.length > 0 ?
                                    !(isLoader && auth.appSettings.is_pagination_on_exclusive_content_enabled) &&
                                    <FeedLayout openDlgBlog={openDlgBlog} isLoading={isLoader} />
                                    :
                                    (isLoader || websiteBlogData.isBlogLoading) ?
                                        null
                                        :
                                        <div className='text-center col-span-2 my-4'><h4>No Posts Found</h4></div>}
                            </div>
                            {isLoader ?
                                <div className='flex justify-center py-3'>
                                    <Loader isLoading={true} color='#000' size={10} />
                                </div> : null
                            }
                            {(websiteBlogData.isBlogLoading === false && auth.appSettings.is_pagination_on_exclusive_content_enabled && websiteBlogData.blogs[website_url]) &&
                                <div className='flex flex-row justify-center items-center py-2'>
                                    <Pagination
                                        totalPages={websiteBlogData.blogs[website_url].totalPages}
                                        currentPage={blogPage.current}
                                        isFiltered={false}
                                        onItemClick={changePage}
                                        showFirstAndLastBtn={true}
                                        isLoading={isLoader || websiteBlogData.isBlogLoading}
                                    />
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
            {
                isBlogOpen === true && index >= 0 && websiteBlogData.blogs[website_url].blogs[index].blogType !== 'gallery' && websiteBlogData.blogs[website_url].blogs[index] &&
                <FullScreenModelPopUpDialog
                    type={websiteBlogData.blogs[website_url].blogs[index].blogType === 'video' ? 'video' : 'photo'}
                    url={websiteBlogData.blogs[website_url].blogs[index].media[0].url}
                    handleClose={closeDialogBlog}
                />
            }
            {
                isBlogOpen === true && index >= 0 && websiteBlogData.blogs[website_url].blogs[index].blogType === 'gallery' &&
                <FullScreenGalleryDialog
                    galleryImages={websiteBlogData.blogs[website_url].blogs[index].gallery}
                    closeDialogBlog={closeDialogBlog}
                    // classes={classes}
                    userId={auth.user._id}
                    galleryIndex={galleryIndex}
                    isPreviewEnable={websiteBlogData.blogs[website_url].blogs[index].isPreviewEnable}
                    previewEnableImages={websiteBlogData.blogs[website_url].blogs[index].previewEnableImages}
                    isLocked={websiteBlogData.blogs[website_url].blogs[index].isLocked}
                    contentCount={websiteBlogData.blogs[website_url].blogs[index].contentCount}
                    thumbImages={websiteBlogData.blogs[website_url].blogs[index].thumbnailUrlGallery}
                    media={websiteBlogData.blogs[website_url].blogs[index].media}
                    contentFrom='blog'
                />
            }
        </div >
    )
}

export default withPrivateRoute(ModelProfilePage, ALLOW_ALL)
