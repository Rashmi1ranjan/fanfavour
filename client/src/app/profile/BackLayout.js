import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BackLayout() {
    const router = useRouter()

    return (
        <div className='flex items-center'>
            <h5 className='text-2xl font-normal mb-4 lg:block hidden'>
                Profile
            </h5>
            <div className='lg:hidden flex items-center gap-2 text-2xl mb-4' onClick={() => router.push('/profile')}>
                <ChevronLeft />
                Profile
            </div>
        </div>
    )
}
