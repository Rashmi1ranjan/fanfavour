import _ from 'lodash'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

export default function ChatInputTextArea(props) {
    const chat = useSelector(state => state.chat)
    const auth = useSelector(state => state.auth)
    const { value, setValue, disabled, textareaRef, clearChatTextInput, classes, usedInModal } = props
    const subscriptionStatus = _.get(props, 'subscriptionStatus', '0')
    const dispatch = useDispatch()
    const router = useRouter()

    useEffect(() => {
        if (chat && chat.clearChatInputText === true) {
            dispatch(clearChatTextInput(false))
            setValue('')
        }
    }, [chat.clearChatInputText])

    useEffect(() => {
        // Adjust the height of the textarea to fit the content
        if (_.isEmpty(textareaRef) === false) {
            if (value === '') {
                // Reset to default height when input is cleared
                textareaRef.current.style.height = '30px'
                textareaRef.current.style.overflow = 'hidden'
            } else {
                textareaRef.current.style.height = 'auto'
                const scrollHeight = textareaRef.current.scrollHeight - 10
                const maxHeight = 120
                if (scrollHeight <= maxHeight) {
                    textareaRef.current.style.overflow = 'hidden'
                    textareaRef.current.style.height = `${scrollHeight}px`
                } else {
                    textareaRef.current.style.overflow = 'scroll'
                    textareaRef.current.style.height = `${maxHeight}px`
                }
            }
        }
    }, [value])

    const handleRedirectToSubscription = () => {
        router.push(`/subscription?name=${auth.user.domain}`)
    }

    return (
        <div className='w-full relative'>
            <textarea
                id='custom-chat-input'
                ref={textareaRef}
                value={value}
                onChange={(e) => { setValue(e.target.value) }}
                rows={1}
                disabled={disabled || subscriptionStatus === '0'}
                placeholder={
                    subscriptionStatus === '0'
                        ? ''
                        : 'Write your message here'
                }

                className={`${classes} w-full resize-none overflow-hidden px-3 py-2 pr-10 text-base placeholder-[${usedInModal ? '#fff' : '#545454'}] ${disabled || subscriptionStatus === '0' ? 'cursor-not-allowed' : ''} focus:outline-none`}
            />
            {subscriptionStatus === '0' && (
                <div className="absolute inset-y-0 left-4 flex items-center gap-2 text-gray-400 cursor-pointer" onClick={handleRedirectToSubscription}>
                    <Lock size={16} className='text-[#ff1a9d]' />
                    <span className="text-sm">Subscribe for more</span>
                </div>
            )}
        </div>
    )
}