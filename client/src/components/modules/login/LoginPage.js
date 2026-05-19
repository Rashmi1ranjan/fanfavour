'use client'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageCarousel } from '@/components/gallery/ImageCarousel'
import Loader from '@/components/common/Loader'

export default function SignInPage(props) {
    const {
        model,
        handleRegisterPopup,
        handleForgotPasswordPopup,
        handleSubmit,
        handleChange,
        errors,
        isLoading,
        showPassword,
        setShowPassword,
        onClosePopup,
        feedImages,
        loader
    } = props

    return (<>
        <Dialog defaultOpen onOpenChange={onClosePopup} className={cn('shrink-0')}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className={cn('p-0 border-0 w-screen mt-8 h-[calc(100vh-var(--navbar-height))] bottom-0 max-w-full max-h-full md:w-auto md:h-auto md:max-w-3xl md:w-[720px] md:min-h-[580px] md:max-h-[580px] rounded-none bg-transparent overflow-hidden fixed md:mt-0')}>
                {/* WRAPPER: responsive unified container */}
                <div className={cn('h-full w-full flex flex-col md:flex-row bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529]')}>
                    {/* DESKTOP IMAGE (hidden on mobile) */}
                    <div className={cn('hidden md:block w-1/2 h-[calc(100vh-20rem)]')}>
                        {loader ? (
                            <div className={cn('flex items-center justify-center w-full h-full')}>
                                <Loader isLoading={true} color='#fff' />
                            </div>
                        ) : feedImages.length > 0 ? (
                            <ImageCarousel
                                images={feedImages}
                                alt={model?.name}
                            />
                        ) : model?.image ? (
                            <div className={cn('relative w-full h-full')}>
                                <Image
                                    src={model.image}
                                    alt={model?.name ?? 'Model'}
                                    fill
                                    draggable={false}
                                    className={cn('object-cover')}
                                />
                            </div>
                        ) : null}
                    </div>
                    {/* RIGHT SIDE / MOBILE CARD */}
                    <div className={cn('w-full h-full md:w-1/2 p-6 md:p-8 bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white relative overflow-auto')}>

                        {/* Heading */}
                        <h1 className={cn('text-xl font-bold text-[#f8f8f8]')}>Welcome!</h1>
                        <p className={cn('text-xl font-bold mb-3 text-[#f8f8f8]')}> Sign in to see unique <br /> content from your <br /> favourite creators </p>
                        <p className={cn('text-sm')}>Please Sign in First.</p>

                        <div className={cn('border-b-[0.5px] border-[#D9D9D9]/6 my-10')}></div>

                        {/* LOGIN FORM */}
                        <form onSubmit={handleSubmit}>
                            <div className={cn('flex flex-col space-y-4')}>

                                {/* Email */}
                                <input
                                    onChange={handleChange}
                                    autoComplete="off"
                                    name="email"
                                    type="email"
                                    placeholder="E-mail"
                                    disabled={isLoading}
                                    className={cn('w-full montserrat px-4 py-3 mo rounded-md bg-white text-[#000] text-base placeholder-[#8a8a8a] focus:outline-none')}
                                />
                                {errors.email && (
                                    <p className={cn('text-red-500 text-xs text-start leading-none -mt-2')}>{errors.email}</p>
                                )}

                                {/* Password */}
                                <div className={cn('relative')}>
                                    <input
                                        onChange={handleChange}
                                        autoComplete="off"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Password"
                                        disabled={isLoading}
                                        className={cn('w-full montserrat px-4 py-3 mo rounded-md bg-white text-[#000] text-base placeholder-[#8a8a8a] focus:outline-none')}
                                    />
                                    <button
                                        type="button"
                                        className={cn('absolute right-3 top-3 text-gray-700')}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className={cn('text-red-500 text-xs text-start leading-none -mt-2')}>{errors.password}</p>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className={cn('flex justify-between items-center mt-3 text-xs')}>
                                <label className={cn('flex items-center gap-2 cursor-pointer')}>
                                    <input
                                        type="checkbox"
                                        disabled={isLoading}
                                        className={cn('appearance-none w-3.5 h-3.5 border border-[#5958b2] cursor-pointer flex items-center justify-center checked:bg-transparent checked:before:content-["✓"] checked:before:text-[#FFF] checked:before:text-xs mt-3')}
                                    /> <span className={cn('text-[#fff] text-[12px] montserrat mt-3')}>Remember Me</span> </label>
                                <div className={cn('flex items-center gap-2')}> <span onClick={handleForgotPasswordPopup} className={cn('text-[#fff] text-[12px] montserrat mt-3 hover:underline cursor-pointer')}> Forgot Password? </span> </div>
                            </div>

                            {/* Submit */}
                            <button type='submit' disabled={isLoading} className={cn('w-full text-white text-[14px] font-semibold py-4 rounded-md mt-6 transition cursor-pointer tracking-[2px]', isLoading ? 'bg-pink-300' : 'bg-[#ff1a9d]')}> SIGN IN </button>
                            {/* Signup */}
                            <div className={cn('w-full flex justify-center mt-4')} onClick={handleRegisterPopup}>
                                <span className={cn('text-[#fff] text-[12px] montserrat cursor-pointer text-center hover:underline')} > Click here if you didn&apos;t have an account </span>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    </>
    )
}
