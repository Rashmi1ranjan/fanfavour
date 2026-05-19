'use client'
import { Send } from 'lucide-react'
import { useSelector } from 'react-redux'

export default function ChatMessageButton(props) {
    const { redirectUrl } = props
    const auth = useSelector((state) => state.auth)
    return (
        <div className='fixed right-8 bottom-12'>
            <button className='bg-[#5958b2] text-white p-4 rounded-xl cursor-pointer' onClick={redirectUrl}>
                <div className='flex items-center gap-2 relative'>
                    <Send size={30} strokeWidth={1} />
                    <span className='bg-[#ff1a9d] w-4.5 h-4.5 rounded-full absolute -top-2 -right-2 flex items-center justify-center text-[10px]'>{auth.counts.userUnreadMessage > 99 ? '99+' : auth.counts.userUnreadMessage || 0}</span>
                </div>
            </button>
        </div>
    )
}