'use client'

import { useRouter } from "next/navigation"
import { CreditCard, CirclePlus } from 'lucide-react'

export default function AddNewCard() {
    const router = useRouter()

    return (
        <div>
            <div onClick={() => router.push('/profile/add-new-payment-method')}>
                <div className='h-[134px] border-2 border-dashed border-[#aaa] flex flex-col items-center justify-center cursor-pointer'>
                    <div className='relative w-10 h-10 flex items-center justify-center'>
                        {/* Credit Card Icon */}
                        <CreditCard className='w-8 h-8 text-gray-700' />
                        {/* Plus Icon - Bottom Right */}
                        <CirclePlus className='w-5 h-5 absolute bottom-1 right-0 translate-x-1/3 translate-y-1/3 bg-white rounded-full text-[#ff1d9d] shadow-md' />
                    </div>
                    <p className='mt-2 text-[15px] font-medium'>ADD CARD</p>
                </div>
            </div>
        </div>
    )
}