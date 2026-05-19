'use client'
import { useSelector } from 'react-redux'
import { cn } from '@/lib/utils'

export default function CopyToClipboard(props) {
    const { isCopyToClipboardToastOpen, offset } = useSelector(state => state.toast)
    return isCopyToClipboardToastOpen ? <div
            className={cn(
                'copy-clipboard-toast fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] max-w-[80vw] w-max px-4 py-3 rounded-[2px] toast text-center show',
                'bg-[#1a0033]'
            )}
        >
            <div className='toast-body text-white'>
                {props.toastContent}
            </div>
        </div>
        : <></>
}
