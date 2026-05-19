import React, {
    useState,
    useEffect,
    useRef
} from 'react'
import { isIOS } from 'react-device-detect'
import { cn } from '@/lib/utils'

export default function AutoExpandingTextArea(props) {
    const textAreaRef = useRef(null)
    const [textAreaHeight, setTextAreaHeight] = useState('auto')
    const [parentHeight, setParentHeight] = useState('auto')

    useEffect(() => {
        setParentHeight(`${textAreaRef.current.scrollHeight}px`)
        setTextAreaHeight(`${textAreaRef.current.scrollHeight + 2}px`)
        if (props.value === '') {
            setParentHeight('auto')
            setTextAreaHeight('auto')
        }
    }, [props.value, props.onClick, props.readOnly, props.required])

    const onChangeHandler = (event) => {
        const textscroll = document.getElementById('textAreaScroll')
        textscroll.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTextAreaHeight('auto')
        setParentHeight(`${textAreaRef.current.scrollHeight}px`)
        if (window.innerWidth > 991) {
            window.scrollTo(0, document.body.scrollHeight)
        }
        if (props.onChange) {
            props.onChange(event)
        }
    }

    const onfocusHandler = () => {
        const bottomNavBatDivId = document.getElementById('BottomNavBar')
        const removePaddingDivId = document.getElementById('RemovePadding')
        if (bottomNavBatDivId) {
            bottomNavBatDivId.style.bottom = '-90px'
        }
        if (removePaddingDivId) {
            removePaddingDivId.style.paddingBottom = '0px'
        }
    }

    const onBlurHandler = () => {
        const bottomNavBatDivId = document.getElementById('BottomNavBar')
        const removePaddingDivId = document.getElementById('RemovePadding')
        const scrollBottom = document.getElementById('scrollBottom')
        if (removePaddingDivId) {
            removePaddingDivId.style.paddingBottom = `${isIOS && window.matchMedia('(display-mode: standalone)').matches ? '90px' : '60px'}`
            removePaddingDivId.classList.add('p-lg-0')
        }
        if (bottomNavBatDivId) {
            bottomNavBatDivId.style.bottom = '0px'
        }
        if (scrollBottom) {
            scrollBottom.scrollIntoView(false)
        }
    }

    return (
        <div>
            <textarea
                id='textAreaScroll'
                ref={textAreaRef}
                rows={1}
                style={{ height: textAreaHeight }}
                onChange={onChangeHandler}
                onFocus={onfocusHandler}
                onBlur={onBlurHandler}
                value={props.value}
                placeholder={props.placeholder}
                className={cn(
                    'min-h-[48px] max-h-[144px] p-[11px_16px] leading-6 text-base border border-gray-300 sticky resize-none',
                    props.className
                )}
                onClick={props.onClick}
                readOnly={props.readOnly}
                required={props.required}
                maxLength={props.maxLength}
                disabled={props.disabled}
            />
        </div>
    )
}