import { usePathname, useSearchParams } from "next/navigation"
import { MoveLeft } from "lucide-react"
import isEmpty from "lodash/isEmpty"

export default function BackButton({ slug, handleBack }) {
    const searchParams = useSearchParams()
    const domain = searchParams?.get('name') || null
    const url = ['terms-and-condition', 'privacy-policy']
    const pathname = usePathname() || ''

    if (isEmpty(domain) || url.includes(slug) || pathname === '/') return null

    return (
        <div className='hidden md:flex items-center cursor-pointer relative w-16 h-16' onClick={handleBack}>
            <svg
                className='absolute inset-0 w-full h-full'
                viewBox='0 0 64 64'
                xmlns='http://www.w3.org/2000/svg'
            >
                <circle cx='32' cy='32' r='22' fill='white' opacity='0.2' />
            </svg>
            <MoveLeft className='absolute inset-0 m-auto' width='24' height='24' stroke='white' strokeWidth='4' />
        </div>
    )
}
