module.exports = {
    content: [
        './src/app/**/*.{js,jsx}',
        './src/components/**/*.{js,jsx}',
        './src/pages/**/*.{js,jsx}',
        './src/hook/**/*.{js,jsx}',
        './src/Layout/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            keyframes: {
                'progress-stripes': {
                    '0%': { backgroundPosition: '1rem 0' },
                    '100%': { backgroundPosition: '0 0' }
                }
            },
            animation: {
                'progress-stripes': 'progress-stripes 1s linear infinite'
            }
        }
    }
}
