'use client'
import { ChevronLeft } from 'lucide-react'
import { useSelector } from 'react-redux'
import Sidebar from '../../app/profile/page'
import BackLayout from '../../app/profile/BackLayout'

export default function AccountPageLayout(props) {
    const auth = useSelector((state) => state.auth)
    const {
        my_account_navbar_name
    } = auth.appSettings

    return (
        <div className='flex justify-center px-4 md:px-10 py-6'>
            <div className='w-full max-w-6xl'>
                <BackLayout />
                <div className='flex flex-col md:flex-row gap-6 items-start'>
                    <Sidebar />
                    <div className='w-full md:flex-[2] bg-white shadow-sm rounded-sm overflow-hidden'>
                        <div className="space-y-2">
                            <div className='flex items-center gap-8 '>
                                {props.children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}