import _ from 'lodash'
import Dropzone from 'react-dropzone'
import styled from 'styled-components'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Plus, PlayCircle, X } from 'lucide-react'
import { isIOS } from 'react-device-detect'
import { getCloudFrontAssetsUrl } from '@/lib/assets'

const ColumnDiv = styled.div`
    width: 100%;
    margin-bottom: ${props => props.isUploading === true ? '50px' : '20px'};
    
    .positioning {
        display: none !important;
    }

    .form-group {
        position: absolute;
        bottom: -24px;
    }

    .progress-span {
        position: absolute;
        bottom: -55px;
        width: 100%;
        align-item: center;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: center;
    }

    .progress {
        border-radius: 5px;
    }

    .progress-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media(max-width: 767px) {
        .positioning {
            display: inline-block !important;
            width: 20%;
        }

        .progress {
            width: 82%;
            display: inline-block !important;
            border-radius: 5px;
        }

        .positioning i {
            color: ${props => props.site_font_color};
            border-radius: 50%;
            width: 29px;
            height: 29px;
        }
    }
`

const VideoDiv = styled.div`
    position: relative;
    cursor: pointer;
    border-radius: 5px;

    video{
        max-width: 210px;
        object-fit: cover;
        border-radius: 5px;
    }
    
    .progress {
        border-radius: 5px;
    }
    
    @media (max-width:767px) {
        max-width: 80%;
        display: inline-block;
        video{
            max-width: 100%;
        }

        .progress {
            width: 82%;
            display: inline-block !important;
            border-radius: 5px;
        }
    }
`

const GalleryIcon = styled.div`
    position: absolute;
    top: calc(45.5%);
    left: calc(47.5%);
    cursor: pointer;

    .video-button-span {
        font-size: 30px;
        color: #fff;
        background-color: black;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        position: relative;
        display: inline-block;
    }

    .play-icon {
        font-size: 30px;
        position: absolute;
        border-radius: 51px;
        left: -5px;
        top: -5px;
    }
`

const DivData = styled.div`
    background-image: ${props => props.imageUrl};
    height:150px;
    background-position:center;
    background-repeat:no-repeat;
    background-size: cover;
    background-color: #000000;
    position: relative;
    cursor: pointer;
    border-radius: 5px;
    width: 160px;
    height: 160px;

    @media (max-width:767px) {
        max-width: 80%;
        display: inline-block !important;
        margin-bottom: 1%;
    }
`

export default function PreviewContent(props) {
    const auth = useSelector(state => state.auth)
    const { isAdmin } = auth.user
    const {
        isSelectedFromContentManager,
        isRearrangeModeEnableForMedia,
        media,
        requestFrom
    } = props

    const selectFromMediaManager = isSelectedFromContentManager && ['message', 'mass-message', 'welcome-message'].includes(requestFrom)
    const isEnableRearrangeMode = selectFromMediaManager ? isRearrangeModeEnableForMedia : props.isRearrangeModeEnable

    const previewContent = (name) => {
        const fileArray = media
        return <>
            {
                fileArray.map((item, i) => {
                    let url = ''
                    let isUpdatePreview = false
                    if (item.url === undefined) {
                        const format = _.get(item, 'selectedFile.format', 'classic')
                        const small_thumb = _.get(item, 'selectedFile.small_thumb', '')
                        const file = format === 'modern' ? small_thumb : item.renderFile
                        url = 'url(' + file + ')'
                    } else {
                        const format = _.get(item, 'format', 'classic')
                        const file = format === 'modern' ? item.thumbnail_url : item.url
                        url = 'url(' + file + ')'
                        isUpdatePreview = true
                    }
                    return (
                        <ColumnDiv
                            isUploading={props.isLoading}
                            content_color='#fff'
                            site_font_color='#fff'
                            key={i}
                            className={`flex items-center justify-center mt-3 w-full md:w-1/3`}
                        >
                            {['video/quicktime', 'video/mp4', 'video'].includes(isUpdatePreview === true ? item.content_type : item.selectedFile.type) ?
                                <div className='relative inline-block'>
                                    <button
                                        type='button'
                                        onClick={(e) => {
                                            e.preventDefault()
                                            props.handleDeletePhoto(i, name)
                                        }}
                                        disabled={props.isLoading}
                                        className='absolute top-2 right-8 md:right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-[#000]/60 text-[#fff] p-1'>
                                        <X strokeWidth={4} />
                                    </button>
                                    <VideoDiv
                                        onClick={() => { props.openDialog(isUpdatePreview === true ? item.url : item.renderFile, 'video') }}
                                        draggable={props.isLoading === false && name === 'original' ? true : false}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            props.handleDrop(i)
                                        }}
                                    >
                                        {isIOS ?
                                            <video src={isUpdatePreview === true ? item.url : item.renderFile} poster={getCloudFrontAssetsUrl('images/no-preview-video.png')} id='uploaded-video' className='h-[150px] w-full relative bg-[#000]' />
                                            :
                                            <video src={isUpdatePreview === true ? item.url : item.renderFile} id='uploaded-video' className='h-[150px] w-full relative bg-[#000]' />
                                        }
                                        <GalleryIcon>
                                            <PlayCircle className='play-icon video-button-span' />
                                        </GalleryIcon>
                                        {(props.isLoading && ['message', 'mass-message'].includes(requestFrom)) && name === props.uploadProgress.type && getGalleryProgress(i)}
                                    </VideoDiv>
                                </div>
                                :
                                <div className='relative inline-block'>
                                    <button
                                        type='button'
                                        onClick={(e) => {
                                            e.preventDefault()
                                            props.handleDeletePhoto(i, name)
                                        }}
                                        disabled={props.isLoading}
                                        className='absolute top-2 right-6 md:right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-[#000]/60 text-[#fff] p-1'
                                    >
                                        <X strokeWidth={4} />
                                    </button>
                                    <DivData
                                        imageUrl={url}
                                        onClick={() => { props.openDialog(isUpdatePreview === true ? item.url : item.renderFile, 'photo') }}
                                        draggable={props.isLoading === false && isEnableRearrangeMode && name === 'original' ? true : false}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            props.handleDrop(i)
                                        }}
                                    >
                                        {props.isLoading && ['message', 'mass-message'].includes(requestFrom) && name === props.uploadProgress.type && getGalleryProgress(i)}
                                    </DivData>
                                </div>
                            }
                        </ColumnDiv>
                    )
                })
            }
        </>
    }

    const getPlusButton = (name) => {
        let id = `button-gallery-${name}`
        return <>
            <div className='w-full md:w-1/3 mt-3 mb-5'
                style={{
                    height: '150px',
                    marginBottom: '3%',
                    margin: ((name === 'original' && media.length === 0) || (name !== 'original' && previewMedia.length === 0)) ? 'auto' : '0%',
                    maxWidth: '150px',
                    outlineColor: 'transparent'
                }}
                name={name}
            >
                <label
                    htmlFor={id}
                    fullWidth={true}
                    className={`items-center justify-center flex text-[#fff] bg-[#000] h-full radius-[5px] ${props.isLoading ? 'inherit pointer-events-none' : 'cursor-pointer pointer-events-auto'}`}
                    disabled={props.isLoading}
                    name={name}
                    onClick={() => {
                        if (isSelectedFromContentManager) {
                            if (name === 'original') {
                                props.setShowMediaSelectionPopup(true)
                            } else {
                                props.setShowMediaPreviewSelectionPopup(true)
                            }
                        }
                    }}
                >

                    <input
                        accept='image/png,image/jpg,image/jpeg,video/mp4,video/quicktime'
                        id={id}
                        onChange={(e) => props.handleGalleryChange(e, name)}
                        style={{ display: 'none' }}
                        type='file'
                        disabled={props.isLoading}
                        multiple={isAdmin === true ? true : false}
                        name={name}
                    />

                    <Plus />
                </label>
            </div>
        </>
    }

    const getGalleryProgress = (index) => {
        const progress = _.get(props.uploadProgress, 'progress', '')
        const progressIndex = _.get(props.uploadProgress, 'index', '')
        const progressNumber = _.get(props.uploadProgress, 'progressNumber', '')
        if (progress !== '' && progressIndex === index) {
            return <span className='progress-span'>
                <div className='progress'>
                    <div
                        className='progress-bar progress-bar-striped progress-bar-animated'
                        role='progressbar'
                        style={{ width: progress, backgroundColor: '#000', color: '#fff' }}
                    >{progress}</div>
                </div>
                {props.uploadProgressInMb(progressIndex, progressNumber)}
            </span>
        }
        return <></>
    }

    return (
        <>
            <div className='mt-2 mb-2'>
                {requestFrom === 'mass-message' && contentManagerTab()}
                <Dropzone multiple={false} onDrop={props.galleryFilesFromOriginal} noDrag={!isSelectedFromContentManager ? props.isRearrangeModeEnable : true}>
                    {({ getRootProps }) => (
                        <section className='w-full height-content-fit radius-[5px] p-[12px] border rounded-sm'>
                            <div {...getRootProps()} className='h-full text-center text-[#fff]'>
                                <h4 className='text-[#fff] mb-1'>Upload Media</h4>
                                <div className='flex justify-content-center'>
                                    {previewContent('original')}
                                    {media.length === 0 && isAdmin === false && <>
                                        {getPlusButton('original')}
                                    </>}
                                </div>
                            </div>
                        </section>
                    )}
                </Dropzone>
            </div>
        </>
    )
}