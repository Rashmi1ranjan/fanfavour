import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { isIOS } from 'react-device-detect'
import { OverlayContainer } from '../layout/OverlayContainer'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { useSelector } from 'react-redux'

export default function FullScreenModelPopUpDialog(props) {
    const showWatermark = _.get(props, 'showWatermark', true)
    const width = props.reqFrom === 'popup' ? '100dvw' : '100%'
    const height = props.reqFrom === 'popup' ? '100dvh' : '100%'
    const offsetX = props.reqFrom === 'popup' ? '-' + props.offsetX : '0'
    const offsetY = props.reqFrom === 'popup' ? '-' + props.offsetY : '0'
    const auth = useSelector((state) => state.auth)
    const userId = auth.user._id

    const popupContent = () => {
        return <div className='content-modal flex justify-center items-center max-w-full max-h-full'>
            {
                props.type === 'photo' && props.url !== '' &&
                <img className='max-w-[100vw] max-h-[90vh] object-contain pointer-events-none' draggable={false} src={props.url} alt='not found' />
            }
            {
                props.type === 'video' && props.url !== '' && <>
                    <video className='' id='myVideo' key={props.url} autoPlay playsInline src={props.url} controls controlsList='nodownload' />
                </>
            }
        </div>
    }

    useEffect(() => {
        appHeight()
        window.addEventListener('resize', appHeight)
        window.addEventListener('mousedown', onClickOutSideContent)
        return () => {
            window.removeEventListener('mousedown', onClickOutSideContent)
        }
    }, [])

    useEffect(() => {
        const close = (event) => {
            (event.keyCode === 27) && props.handleClose()
        }
        window.addEventListener('keydown', close)
        return () => {
            window.removeEventListener('keydown', close)
        }
    }, [])

    const appHeight = () => {
        const doc = document.documentElement
        doc.style.setProperty('--app-height', `${window.innerHeight}px`)
    }

    const onClickOutSideContent = (e) => {
        let node = e.target
        let inside = false
        while (node) {
            if (node.classList.contains('content-modal')) {
                inside = true
                break
            }
            node = node.parentElement
        }
        if (!inside) {
            props.handleClose()
        }
    }

    return <div className='fixed inset-0 z-[1000] bg-black/90 flex justify-center items-center'
        style={{
            width,
            height,
            left: offsetX,
            top: offsetY
        }}
    >
        {/* CLOSE BUTTON */}
        <button
            onClick={() => {
                if (props.type === 'video') {
                    document
                        .querySelectorAll('.myVideoPause')
                        .forEach(vid => vid.pause())
                }
                props.handleClose()
            }}
            className='absolute top-4 right-4 z-300 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white cursor-pointer'
        >
            <X size={20} />
        </button>

        {/* CONTENT WRAPPER */}
        <div className='flex flex-col justify-center items-center w-[100%] h-[100%] overflow-hidden px-12 max-md:px-0'>
            <div className={`flex justify-center items-center ${isIOS ? 'h-[var(--app-height)]' : 'h-[90vh]'}`}>
                {showWatermark ? (
                    <OverlayContainer auth={auth}>
                        {popupContent()}
                    </OverlayContainer>
                ) : (
                    popupContent()
                )}
            </div>
        </div>
    </div>
}
