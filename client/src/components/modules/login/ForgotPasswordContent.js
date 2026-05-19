export default function ForgotPasswordContent(props) {
    const {
        handleBackToLogin,
        handleSubmit,
        handleChange,
        errors,
        isLoading
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
                <h1 className="text-xl font-bold text-[#f8f8f8]">Forgot Password?</h1>
                <p className="text-xl font-bold mb-3 text-[#f8f8f8]"> Don&apos;t worry, we&apos;ll <br /> send you a reset link </p>
                <p className="text-sm">Enter your email address below.</p>

                <div className='border-b-[0.5px] border-[#D9D9D9]/6 my-8'></div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <input
                        name='email'
                        type='email'
                        placeholder='E-mail'
                        onChange={handleChange}
                        disabled={isLoading}
                        className='w-full px-4 py-3 rounded-md bg-white text-[#000] placeholder-[#8a8a8a]'
                    />
                    {errors.email && (
                        <p className='text-red-500 text-xs -mt-3'>{errors.email}</p>
                    )}

                    {/* Submit */}
                    <button type='submit' disabled={isLoading} className={`w-full ${isLoading ? 'bg-pink-300' : 'bg-[#ff1a9d]'} text-white text-[14px] font-semibold py-4 rounded-md transition cursor-pointer tracking-[2px]`}> SEND RESET LINK </button>
                    {/* Back to Login */}
                    <div className='w-full flex justify-center mt-1' onClick={handleBackToLogin}>
                        <span className='text-[#fff] text-[12px] montserrat cursor-pointer text-center hover:underline'>Back to Sign In</span>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <p className='text-[12px] px-6 pb-4 opacity-50 text-center text-[#ffffff]/40'>
                ©Highlife Media. All Rights Reserved.
                Disclaimer: All members and people appearing on this site are 18 years of age or older.
            </p>
        </div>
    )
}
