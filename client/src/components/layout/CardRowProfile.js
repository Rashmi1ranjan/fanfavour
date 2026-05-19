'use client'
import { cn } from "@/lib/utils"

export default function CardRowProfile(props) {
    return (
        <div className={cn('bg-white', props.className)}>
            {props.title ? <div className='p-4 border-b font-medium'>
                {props.title}
            </div> : <></>}
            <div className={props.cardBodyClassName}>
                {props.children}
            </div>
        </div>
    )
}
