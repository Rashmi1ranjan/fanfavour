import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function AuthRegisterContent(props) {
    const {
        handleChange,
        handleSubmit,
        model,
        errors,
        isLoading,
        showPassword,
        setShowPassword,
        setShowConfirmPassword,
        showConfirmPassword,
        formData,
        handleLoginPopup
    } = props

    return (
        <div className={cn('h-[calc(100dvh-var(--navbar-height))] w-full flex flex-col bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white overflow-y-auto')}>
            <div className={cn('h-full w-full flex flex-col md:flex-row bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529]')}>
                {/* DESKTOP IMAGE (hidden on mobile) */}
                <div className={cn('hidden md:block w-1/2')}>
                    {model && model.image &&
                        <Image
                            src={model.image}
                            alt={model?.name ?? 'Model'}
                            width={400}
                            height={500}
                            className={cn('w-full h-full object-cover')}
                            draggable={false}
                        />
                    }
                </div>

                {/* RIGHT SIDE / MOBILE CARD */}
                <div className={cn('w-full h-full md:w-1/2 p-6 md:p-10 overflow-auto md:overflow-y-hidden bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529] text-white relative')}>

                    {/* Heading */}
                    <h2 className={cn('text-[#f8f8f8] text-xl font-bold mb-2')}>
                        Join FanFavour <br /> For Free!
                    </h2>
                    <p className={cn('text-[#f8f8f8] text-base mb-6')}>
                        Become their biggest fan and discover the hottest unique content. When your ready, subscribe to creators private photos, videos and chat with them live!
                    </p>
                    <p className={cn('text-[#f8f8f8] text-[12px] mb-4 flex items-center gap-2')}>
                        <span className={cn('text-[12px]')}>🔒</span> Secure and Discreet
                    </p>

                    {/* LOGIN FORM */}
                    <form onSubmit={handleSubmit} className={cn('space-y-4')} autoComplete='off'>
                        <div className={cn('flex flex-col space-y-4')}>
                            <input
                                disabled={isLoading}
                                onChange={handleChange}
                                autoComplete='off'
                                type='text'
                                placeholder='Name'
                                name='name'
                                className={cn('w-full px-4 py-3 rounded-md text-[#000] text-base placeholder-[#8a8a8a] bg-white/90 focus:outline-none')}
                            />
                            {errors.name && (
                                <p className={cn('text-red-500 text-xs text-start leading-none -mt-2')}>
                                    {errors.name}
                                </p>
                            )}
                            <input
                                disabled={isLoading}
                                onChange={handleChange}
                                name='email'
                                autoComplete='off'
                                type='email'
                                placeholder='E-mail Address'
                                className={cn('w-full px-4 py-3 rounded-md text-base bg-white/90 focus:outline-none text-[#000] placeholder-[#8a8a8a]')}
                            />
                            {errors.email && (
                                <p className={cn('text-red-500 text-xs text-start leading-none -mt-2')}>
                                    {errors.email}
                                </p>
                            )}
                            {/* <div className='flex gap-2'>
                                        <PhoneInput
                                            defaultCountry='us'
                                            value={formData.full_phone}
                                            onChange={handlePhoneChange}
                                            className='custom-phone'
                                            placeholder='Phone Number'
                                            name='phone_number'
                                        />
                                    </div> */}
                            {/* {errors.phone_number && (
                                        <p className='text-red-500 text-xs text-start -mt-3'>
                                            {errors.phone_number}
                                        </p>
                                    )} */}
                            <div className={cn('relative w-full')}>
                                <input
                                    disabled={isLoading}
                                    onChange={handleChange}
                                    name='password'
                                    autoComplete='off'
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Create your Password'
                                    className={cn('w-full px-4 py-3 rounded-md text-base bg-white/90 focus:outline-none text-[#000] placeholder-[#8a8a8a]')}
                                />
                                <button
                                    disabled={isLoading}
                                    type='button'
                                    className={cn('absolute right-3 top-3 text-gray-600')}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.password && (
                                    <p className={cn('text-red-500 text-xs text-start mt-2 leading-none')}>
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <div className={cn('relative w-full')}>
                                <input
                                    disabled={isLoading}
                                    onChange={handleChange}
                                    name='confirm_password'
                                    autoComplete='off'
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder='Confirm Password'
                                    className={cn('w-full px-4 py-3 rounded-md text-base bg-white/90 focus:outline-none text-[#000] placeholder-[#8a8a8a]')}
                                />
                                <button
                                    disabled={isLoading}
                                    type='button'
                                    className={cn('absolute right-3 top-3 text-gray-600')}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {errors.confirm_password && (
                                    <p className={cn('text-red-500 text-xs text-start mt-2 leading-none')}>
                                        {errors.confirm_password}
                                    </p>
                                )}
                            </div>
                            {/* Terms */}
                            <div className={cn('flex flex-col')}>
                                <div className={cn('flex items-center gap-2 text-sm')}>
                                    <input
                                        type='checkbox'
                                        id='terms'
                                        name='terms'
                                        disabled={isLoading}
                                        checked={formData.terms}
                                        onChange={handleChange}
                                        className={cn('appearance-none w-3.5 h-3.5 border cursor-pointer flex items-center justify-center border-[#5958b2] checked:bg-transparent checked:before:content-["✓"] checked:before:text-[#FFF] checked:before:text-xs')}
                                    />

                                    <label htmlFor='terms' className={cn('text-[#fff] text-[12px] montserrat')}>
                                        I agree to the&nbsp;
                                        <a href='/terms-and-condition' target='_blank' className={cn('hover:underline')}>
                                            Terms and Conditions
                                        </a>
                                    </label>
                                </div>
                                {errors.terms && (
                                    <p className={cn('text-red-500 text-[10px] mt-1 ml-5')}>
                                        {errors.terms}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button type='submit' disabled={isLoading} className={cn('w-full py-4 rounded-md text-white text-[14px] font-semibold transition cursor-pointer mb-3 mt-2 tracking-[2px]', isLoading ? 'bg-pink-300' : 'bg-[#ff1a9d]')}>
                            SIGN UP
                        </button>
                        <button type='button' disabled={isLoading} className={cn('w-full py-4 rounded-md text-[#5958b2] text-[14px] font-semibold hover:bg-white transition cursor-pointer tracking-[2px]', isLoading ? 'bg-white/60' : 'bg-white')} onClick={handleLoginPopup}>
                            BACK TO SIGN IN
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
