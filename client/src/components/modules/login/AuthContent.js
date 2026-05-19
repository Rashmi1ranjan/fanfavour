import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AuthContent(props) {
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
    } = props
    return (
        <div className='h-[calc(100dvh-var(--navbar-height))]
            w-full
            flex flex-col
            bg-gradient-to-b from-[#2a0554] via-[#1e0647] to-[#0a0529]
            text-white
            overflow-y-auto'
        >
            {/* Content */}
            <div className='flex-1 px-6 pt-8'>
                {/* Heading */}
                <h1 className="text-xl font-bold text-[#f8f8f8]">Welcome!</h1>
                <p className="text-xl font-bold mb-3 text-[#f8f8f8]"> Sign in to see unique <br /> content from your <br /> favourite creators </p>
                <p className="text-sm">Please Sign in First.</p>

                <div className='border-b-[0.5px] border-[#D9D9D9]/6 my-8'></div>
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <input
                        name='email'
                        type='email'
                        placeholder='E-mail'
                        onChange={handleChange}
                        disabled={isLoading}
                        className={cn('w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a]')}
                    />
                    {errors.email && (
                        <p className={cn('text-red-500 text-xs -mt-3')}>{errors.email}</p>
                    )}

                    <div className='relative'>
                        <input
                            name='password'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Password'
                            onChange={handleChange}
                            disabled={isLoading}
                            className={cn('w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a]')}
                        />

                        <button
                            type="button"
                            className={cn('absolute right-3 top-3 text-gray-700')}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        {errors.password && (
                            <p className={cn('text-red-500 text-xs text-start leading-none mt-1')}>{errors.password}</p>
                        )}
                    </div>

                    <div className={cn('flex justify-between items-center text-xs space-y-3')}>
                        <label className={cn('flex items-center gap-2 cursor-pointer')}>
                            <input
                                type="checkbox"
                                disabled={isLoading}
                                className={cn('appearance-none w-3.5 h-3.5 border border-[#5958b2] cursor-pointer flex items-center justify-center checked:bg-transparent checked:before:content-["✓"] checked:before:text-[#fff] checked:before:text-xs rounded-xs mt-2')}
                            /> <span className={cn('text-[#fff] text-[12px] montserrat mt-2')}>Remember Me</span> </label>
                        <div className={cn('flex items-center gap-2')}> <span onClick={handleForgotPasswordPopup} className={cn('text-[#fff] text-[12px] montserrat hover:underline cursor-pointer')}> Forgot Password? </span> </div>
                    </div>

                    {/* Submit */}
                    <button type='submit' disabled={isLoading} className={cn('w-full text-white text-[14px] font-semibold py-4 rounded-md transition cursor-pointer tracking-[2px]', isLoading ? 'bg-pink-300' : 'bg-[#ff1a9d]')}> SIGN IN </button>
                    {/* Signup */}
                    <div className={cn('w-full flex justify-center mt-1')} onClick={handleRegisterPopup}>
                        <span className={cn('text-[#fff] text-[12px] montserrat cursor-pointer text-center hover:underline')}>Tap here if you are didn&apos;t have account</span>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <p className={cn('text-[12px] px-6 pb-4 opacity-50 text-center text-[#ffffff]/40')}>
                ©Highlife Media. All Rights Reserved.
                Disclaimer: All members and people appearing on this site are 18 years of age or older.
            </p>
        </div>
    )
}
