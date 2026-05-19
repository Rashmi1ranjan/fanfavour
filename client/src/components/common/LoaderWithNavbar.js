'use client'

import { usePathname } from 'next/navigation'
import Loader from './Loader'
import Navbar from './Navbar'
import { cn } from '@/lib/utils'

export default function LoaderWithNavbar() {
    const pathname = usePathname()
    const isDarkTheme = pathname === '/'
    
    let backgroundClass = 'bg-white'
    if (isDarkTheme) {
        backgroundClass = 'bg-[#1a0033]'
    }

    const loaderColor = isDarkTheme ? '#ffffff' : '#000000'

    return (
        <div className={cn('fixed inset-0 z-[100]', backgroundClass)}>
            <Navbar />

            <div className='min-h-[calc(100dvh-var(--navbar-height))] flex items-center justify-center'>
                <Loader isLoading={true} size={10} color={loaderColor} />
            </div>
        </div>
    )
}
