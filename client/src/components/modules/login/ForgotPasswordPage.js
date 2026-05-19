'use client'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { ImageCarousel } from '@/components/gallery/ImageCarousel'
import Loader from '@/components/common/Loader'

export default function ForgotPasswordPage(props) {
    const {
        model,
        handleBackToLogin,
        handleSubmit,
        handleChange,
        errors,
        isLoading,
        onClosePopup,
        feedImages,
        loader
    } = props

    return (<>
        <Dialog defaultOpen onOpenChange={onClosePopup} className='shrink-0'>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className="p-0 border-0 w-screen mt-8 h-[calc(100vh-var(--navbar-height))] bottom-0 max-w-full max-h-full md:w-auto md:h-auto md:max-w-3xl md:w-[720px]
                md:min-h-[580px] md:max-h-[580px] rounded-none bg-transparent overflow-hidden fixed md:mt-0">
                {/* WRAPPER: responsive unified container */}
                <div className="h-full w-full flex flex-col md:flex-row bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529]">
                    {/* DESKTOP IMAGE (hidden on mobile) */}
                    <div className='hidden md:block w-1/2 h-[calc(100vh-20rem)]'>
                        {loader ? (
                            <div className='flex items-center justify-center w-full h-full'>
                                <Loader isLoading={true} color='#fff' />
                            </div>
                        ) : feedImages.length > 0 ? (
                            <ImageCarousel
                                images={feedImages}
                                alt={model?.name}
                            />
                        ) : model?.image ? (
                            <div className='relative w-full h-full'>
                                <Image
                                    src={model.image}
                                    alt={model?.name ?? 'Model'}
                                    fill
                                    draggable={false}
                                    className='object-cover'
                                />
                            </div>
                        ) : null}
                    </div>
                    {/* RIGHT SIDE / MOBILE CARD */}
                    <div className="w-full h-full md:w-1/2 p-6 md:p-8 bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white relative overflow-auto">

                        {/* Heading */}
                        <h1 className="text-xl font-bold text-[#f8f8f8]">Forgot Password?</h1>
                        <p className="text-xl font-bold mb-3 text-[#f8f8f8]"> Don&apos;t worry, we&apos;ll <br /> send you a reset link </p>
                        <p className="text-sm">Enter your email address below.</p>

                        <div className='border-b-[0.5px] border-[#D9D9D9]/6 my-10'></div>

                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col space-y-4">
                                {/* Email */}
                                <input
                                    onChange={handleChange}
                                    autoComplete="off"
                                    name="email"
                                    type="email"
                                    placeholder="E-mail"
                                    disabled={isLoading}
                                    className="w-full montserrat px-4 py-3 rounded-md bg-white text-[#000] text-base placeholder-[#8a8a8a] focus:outline-none"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs text-start leading-none -mt-2">{errors.email}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button type='submit' disabled={isLoading} className={`w-full ${isLoading ? 'bg-pink-300' : 'bg-[#ff1a9d]'} text-white text-[14px] font-semibold py-4 rounded-md mt-6 transition cursor-pointer tracking-[2px]`}> SEND RESET LINK </button>
                            {/* Back to Login */}
                            <div className='w-full flex justify-center mt-4' onClick={handleBackToLogin}>
                                <span className='text-[#fff] text-[12px] montserrat cursor-pointer text-center hover:underline' > Back to Sign In </span>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    </>
    )
}
