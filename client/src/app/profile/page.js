'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { ChevronRight } from "lucide-react"

export default function Sidebar() {
    const [activeMenu, setActiveMenu] = useState('')
    const router = useRouter()
    const auth = useSelector((state) => state.auth)

    const handleNavigate = (menu) => {
        router.push(`/profile/${menu}?name=${auth.user.domain}`)
    }

    useEffect(() => {
        const path = window.location.pathname
        const menu = path.split('/').pop()
        setActiveMenu(menu)
    }, [])

    return (
        <div className='w-full md:flex-1 p-6 lg:p-0'>
            <h4 className="flex items-center gap-2 text-2xl lg:hidden mb-4">Profile</h4>
            <div className='flex flex-col gap-1 bg-white shadow-sm p-4 rounded-sm divide-y'>
                {/* {auth.user.default_payment_method === 'crypto_currency' && (
                    <span
                        onClick={() => handleNavigate('wallet')}
                        className={`px-3 py-2 cursor-pointer rounded-sm transition
                ${activeMenu === 'wallet'
                                ? 'bg-pink-100 text-[#ff1a9d] font-medium'
                                : 'hover:bg-gray-100'
                            }`}
                    >
                        Wallet - Transaction History & Add Funds
                    </span>
                )} */}
                <span
                    onClick={() => handleNavigate('update')}
                    className={`flex justify-between px-3 py-2 cursor-pointer rounded-sm transition
                ${activeMenu === 'update'
                            ? 'bg-pink-100 text-[#ff1a9d] font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    Update Profile
                    <ChevronRight className="lg:hidden" />
                </span>

                <span
                    onClick={() => handleNavigate('change-password')}
                    className={`flex justify-between px-3 py-2 cursor-pointer rounded-sm transition
                ${activeMenu === 'change-password'
                            ? 'bg-pink-100 text-[#ff1a9d] font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    Change Password
                    <ChevronRight className="block lg:hidden" />
                </span>

                <span
                    onClick={() => handleNavigate('payment-method')}
                    className={`flex justify-between px-3 py-2 cursor-pointer rounded-sm transition
                ${activeMenu === 'payment-method'
                            ? 'bg-pink-100 text-[#ff1a9d] font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    Payment Method
                    <ChevronRight className="block lg:hidden" />
                </span>

            </div>
        </div>
    )
}