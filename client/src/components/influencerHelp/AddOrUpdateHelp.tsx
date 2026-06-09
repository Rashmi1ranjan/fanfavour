import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import _ from 'lodash'
import moment from 'moment'
import styled from 'styled-components'
import Select, { ActionMeta, OptionsType } from 'react-select'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { OptionType } from '../../types/types'
interface Props {
    rootStore: RootStore
}

const EditorDiv = styled.div`
    width: 100%;
    
    .editor-wrapper {
        margin-bottom: 4px !important;
    }
`

const DisplayAsPopupExpirationDate = styled.div`
    .react-datepicker-wrapper.react-datepicker__input-container.displayAsPopup:focus {
        z-index: 15;
    }
`

const DisplayAsNotificationExpirationDate = styled.div`
    .react-datepicker-wrapper.react-datepicker__input-container.displayAsNotification:focus {
        z-index: 15;
    }
`

const AddInfluencerHelp: React.FC<Props> = ({ rootStore }) => {
    const { InfluencerHelpStore, HelpTagsStore } = rootStore

    const {
        clearData,
        getInfluencerHelpDataById,
        updateInfluencerHelpData,
        setInfluencerHelpData,
        updateLoader,
        generatePresignedUrl,
        isApiCall,
        isVideoUploadStart,
        isPdfUploadStart,
        clearInfluencerData,
        changeFormatOfDate,
        filter
    } = InfluencerHelpStore

    const {
        getAllHelpTagsData,
        allHelpTagsData,
        getSpecificWebsiteHelpTagsData,
        specificWebsiteHelpTagsData
    } = HelpTagsStore

    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()
    const [isVideoUpload, setIsVideoUpload] = useState(false)
    const [selectedFile, setSelectedFile] = useState<string | Blob>()
    const [selectedFilePath, setSelectedFilePath] = useState('')
    const [isPdfUpload, setIsPdfUpload] = useState(false)
    const [selectedPdfFile, setSelectedPdfFile] = useState({ name: '' })
    const [selectedPdfFilePath, setSelectedPdfFilePath] = useState('')
    const [videoProgress, setVideoProgress] = useState(String)
    const [videoProgressNumber, setVideoProgressNumber] = useState(Number)
    const [pdfProgress, setPdfProgress] = useState(String)
    const [pdfProgressNumber, setPdfProgressNumber] = useState(Number)
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [selectedHelpTags, setSelectedHelpTags] = useState<OptionType[]>([])
    const [selectedHelpTagsForSpecific, setSelectedHelpTagsForSpecific] = useState<OptionType[]>([])

    const getData = (tags: string[], visibleToTag: string[]) => {
        if (allHelpTagsData.length > 0 && tags.length > 0) {
            const array: OptionType[] = []
            for (const element of tags) {
                const findData = allHelpTagsData.filter(elem => elem._id === element)
                if (findData.length > 0) {
                    // @ ts-ignore
                    array.push({ label: findData[0].title, value: findData[0]._id })
                }
            }
            setSelectedHelpTags(array)
        }
        if (specificWebsiteHelpTagsData.length > 0 && visibleToTag.length > 0) {
            const specificWebsiteArray: OptionType[] = []
            for (const element of visibleToTag) {
                const findData = specificWebsiteHelpTagsData.filter(elem => elem._id === element)
                if (findData.length > 0) {
                    // @ ts-ignore
                    specificWebsiteArray.push({ label: findData[0].title, value: findData[0]._id })
                }
            }
            setSelectedHelpTagsForSpecific(specificWebsiteArray)
        }
        updateLoader(false)
        setIsDataLoading(false)
    }

    useEffect(() => {
        clearData()
        clearInfluencerData()

        if (id === 'add-influencer') {
            getAllHelpTagsData()
            getSpecificWebsiteHelpTagsData()
            updateLoader(false)
            setIsDataLoading(false)
        } else if (isDataLoading === true) {
            getAllHelpTagsData()
            getSpecificWebsiteHelpTagsData()
            getInfluencerHelpDataById(id, (success: boolean, tags: string[], visibleToTag: string[]) => {
                if (success) {
                    getData(tags, visibleToTag)
                }
            })
        }
    }, [])

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (_.isEmpty(updateInfluencerHelpData.title.trim())) {
            return toast.error('Title should not be Empty.')
        }

        const videoConfig = {
            onUploadProgress: (progressEvent: ProgressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setVideoProgress(percentCompleted + '%')
                setVideoProgressNumber(percentCompleted)
            }
        }
        const pdfConfig = {
            onUploadProgress: (progressEvent: ProgressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setPdfProgress(percentCompleted + '%')
                setPdfProgressNumber(percentCompleted)
            }
        }
        setInfluencerHelpData(selectedFile, selectedPdfFile, videoConfig, pdfConfig, (success: boolean, message: string) => {
            if (success === true) {
                if (id === 'add-influencer') {
                    filter.key = ''
                    filter.helpTag = ''
                    filter.websiteTag = ''
                    filter.for_admin = ''
                }
                toast.success(message)
                setTimeout(redirect, 1000)
            } else {
                toast.error(message)
            }
        })
    }

    const redirect = () => {
        clearTimeout(3000)
        history('/influencer-help')
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0]
        const name = e.target.name

        if (name === 'video' && file?.type !== 'video/mp4') {
            return alert('Unsupported video format. Video format must be mp4.')
        }

        if (file) {
            generatePresignedUrl(file.name, name, (success) => {
                if (success) {
                    if (name === 'video') {
                        setIsVideoUpload(true)
                        setSelectedFile(file)
                        setSelectedFilePath(URL.createObjectURL(file))
                    } else {
                        setIsPdfUpload(true)
                        setSelectedPdfFile(file)
                        setSelectedPdfFilePath(URL.createObjectURL(file))
                    }
                }
            })
        }
    }

    if (isDataLoading) {
        return <>Loading</>
    }

    const uploadProgress = (type: string) => {
        let actualFileSize = 0
        let actualFileUploaded = '0'
        if (type === 'video') {
            actualFileSize = (_.get(selectedFile, 'size', 0) / 1024) / 1024
            actualFileUploaded = ((actualFileSize * videoProgressNumber) / 100).toFixed(2)
        } else {
            actualFileSize = (_.get(selectedPdfFile, 'size', 0) / 1024) / 1024
            actualFileUploaded = ((actualFileSize * pdfProgressNumber) / 100).toFixed(2)
        }
        return `Uploading ${actualFileUploaded} MB of ${actualFileSize.toFixed(2)} MB`
    }

    const handlePublishDateChange = (date: Date) => {
        const startDate = moment(date).format('YYYY-MM-DDTHH:mm:00.000')
        // @ ts-ignore
        updateInfluencerHelpData.publish_date = startDate
    }

    const targetDate = changeFormatOfDate(updateInfluencerHelpData.publish_date)
    const notificationExpirationDate = changeFormatOfDate(updateInfluencerHelpData.notification_expiration_date)
    const popupExpirationDate = changeFormatOfDate(updateInfluencerHelpData.popup_expiration_date)

    const helpTags: OptionType[] = []
    const helpTagsOptions: OptionType[] = allHelpTagsData.map((option: { title: string, _id: string }) => (
        { label: option.title, value: option._id }
    ))
    helpTags.push(...helpTagsOptions)

    const specificWebsiteHelpTags: OptionType[] = []
    const specificWebsiteHelpTagsOptions: OptionType[] = specificWebsiteHelpTagsData.map((option: { title: string, _id: string }) => (
        { label: option.title, value: option._id }
    ))
    specificWebsiteHelpTags.push(...specificWebsiteHelpTagsOptions)

    const onHelpTagsChange = (value: OptionsType<OptionType>, actions: ActionMeta<OptionType>) => {
        const id = _.map(value, 'value')
        if (actions.name === 'tags') {
            updateInfluencerHelpData.tags = id
            setSelectedHelpTags(value as OptionType[])
        } else {
            updateInfluencerHelpData.visible_to_tags = id
            setSelectedHelpTagsForSpecific(value as OptionType[])
        }
    }

    const handleNotificationDateChange = (date: Date) => {
        const startDate = moment(date).format('YYYY-MM-DDTHH:mm:00.000')
        // @ ts-ignore
        updateInfluencerHelpData.notification_expiration_date = startDate
    }

    const handlePopupDateChange = (date: Date) => {
        const startDate = moment(date).format('YYYY-MM-DDTHH:mm:00.000')
        // @ ts-ignore
        updateInfluencerHelpData.popup_expiration_date = startDate
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row mb-4'>
            <div className='col-md-12'>
                <div className="row py-2">
                    <div className='col-6'>
                        <h4>{id !== 'add-influencer' ? 'Edit' : 'Add'}</h4>
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                    </div>
                    <div className='col-6'>
                        <NavLink className="float-end text-decoration-underline me-3" to="/influencer-help" style={{ fontSize: 'larger' }}>Back</NavLink>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-md-8'>
                        <div className="card-body px-3 px-md-0">
                            <div className='d-flex justify-space-between'>
                                <label className='form-check-label'>
                                    <input
                                        className='me-2 form-check-input'
                                        name='userType'
                                        type='radio'
                                        value='admin'
                                        checked={updateInfluencerHelpData.for_admin === true ? true : false}
                                        onChange={() => {
                                            updateInfluencerHelpData.for_admin = true
                                        }}
                                    />Admin
                                </label>
                                <label className='form-check-label ps-2'>
                                    <input
                                        className='me-2 ms-3 form-check-input'
                                        name='userType'
                                        type='radio'
                                        value='user'
                                        checked={updateInfluencerHelpData.for_admin === false ? true : false}
                                        onChange={() => {
                                            updateInfluencerHelpData.for_admin = false
                                        }}
                                    />User
                                </label>
                            </div>
                            <div className='form-group mt-3'>
                                <label>Title</label>
                                <input
                                    name='title'
                                    type='text'
                                    className='form-control'
                                    value={updateInfluencerHelpData.title}
                                    onChange={(e) => {
                                        updateInfluencerHelpData.title = e.target.value
                                    }}
                                />
                                <small className="form-text text-muted">Title for listing, pop up, help & notification.</small>
                            </div>
                            <div className='form-group row mt-3'>
                                <div className='form-check mt-2 ms-3 col-md-6 mb-2'>
                                    <label className='form-check-label'>
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            placeholder=''
                                            checked={updateInfluencerHelpData.display_as_popup}
                                            onChange={() => {
                                                updateInfluencerHelpData.display_as_popup = !updateInfluencerHelpData.display_as_popup
                                            }}
                                        /> Display as popup
                                    </label>
                                </div>
                                {updateInfluencerHelpData.display_as_popup &&
                                    <div className='form-check mt-2 col-md-6 mb-2'>
                                        <label className='mb-2'>Expiration Date</label><br />
                                        <DisplayAsPopupExpirationDate>
                                            <DatePicker
                                                selected={popupExpirationDate}
                                                className='form-control mb-2 displayAsPopup'
                                                onChange={handlePopupDateChange}
                                                locale="pt-BR"
                                                showTimeSelect
                                                timeFormat="p"
                                                timeIntervals={10}
                                                dateFormat="Pp"
                                            />
                                        </DisplayAsPopupExpirationDate>
                                        <small className="form-text text-muted">Time is in UTC.</small>
                                    </div>
                                }
                            </div>
                            <div className='form-group row'>
                                <div className='form-check mt-2 ms-3 col-md-6 mb-2'>
                                    <label className='form-check-label'>
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            placeholder=''
                                            checked={updateInfluencerHelpData.display_as_notification}
                                            onChange={() => {
                                                updateInfluencerHelpData.display_as_notification = !updateInfluencerHelpData.display_as_notification
                                            }}
                                        /> Display as Notification
                                    </label>
                                </div>
                                {updateInfluencerHelpData.display_as_notification &&
                                    <div className='form-check mt-2 col-md-6 mb-2'>
                                        <label className='mb-2'>Expiration Date</label><br />
                                        <DisplayAsNotificationExpirationDate>
                                            <DatePicker
                                                selected={notificationExpirationDate}
                                                className='form-control mb-2 displayAsNotification'
                                                onChange={handleNotificationDateChange}
                                                locale="pt-BR"
                                                showTimeSelect
                                                timeFormat="p"
                                                timeIntervals={10}
                                                dateFormat="Pp"
                                                name='notificationExpirationDate'
                                            />
                                        </DisplayAsNotificationExpirationDate>
                                        <small className="form-text text-muted">Time is in UTC.</small>
                                    </div>
                                }
                            </div>
                            <div className='form-group row mb-3'>
                                <div className='form-check mt-2 ms-3'>
                                    <label className='form-check-label'>
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            placeholder=''
                                            checked={updateInfluencerHelpData.exclude_from_help}
                                            onChange={() => {
                                                updateInfluencerHelpData.exclude_from_help = !updateInfluencerHelpData.exclude_from_help
                                            }}
                                        /> Exclude From help
                                    </label>
                                </div>
                            </div>
                            {
                                updateInfluencerHelpData.display_as_popup === true &&
                                <EditorDiv className='form-group mt-3'>
                                    <label>Popup Content</label>
                                    <Editor
                                        editorState={updateInfluencerHelpData.popupIntroContent}
                                        toolbarClassName="toolbarClassName"
                                        wrapperClassName="editor-wrapper mb-1"
                                        editorClassName="editor"
                                        onEditorStateChange={(value) => {
                                            updateInfluencerHelpData.popupIntroContent = value
                                        }}
                                        toolbar={{
                                            options: ['inline', 'blockType', 'list', 'textAlign', 'history', 'colorPicker', 'link', 'emoji', 'image', 'remove', 'embedded'],
                                            blockType: {
                                                options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']
                                            }
                                        }}
                                    />
                                    <small className="form-text text-muted">Short description of feature or notification or updates.</small>
                                </EditorDiv>
                            }
                            <EditorDiv className='form-group mt-3'>
                                <label>Help Content</label>
                                <Editor
                                    editorState={updateInfluencerHelpData.htmlContent}
                                    toolbarClassName="toolbarClassName"
                                    wrapperClassName="editor-wrapper mb-1"
                                    editorClassName="editor"
                                    onEditorStateChange={(value) => {
                                        updateInfluencerHelpData.htmlContent = value
                                    }}
                                    toolbar={{
                                        options: ['inline', 'blockType', 'list', 'textAlign', 'history', 'colorPicker', 'link', 'emoji', 'image', 'remove', 'embedded'],
                                        blockType: {
                                            options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']
                                        }
                                    }}
                                />
                                <small className="form-text text-muted">Detailed information for Popup, Notification or Help.</small>
                            </EditorDiv>
                            <div className='form-group row'>
                                <div className='col-12 col-md-6'>
                                    <label className='mb-2'>Optional Video Title</label>
                                    <input
                                        name='video_title'
                                        type='text'
                                        className='form-control'
                                        value={updateInfluencerHelpData.video_title}
                                        onChange={(e) => {
                                            updateInfluencerHelpData.video_title = e.target.value
                                        }}
                                    />
                                    <small className="form-text text-muted">Only mp4 files supported. Please upload optimized video for better play experience.</small>
                                </div>
                                <div className='col-12 mb-3 col-md-6 mt-3 mt-md-0'>
                                    <div className='row ms-1'>
                                        <h6 className='w-auto'>Optional Select Video</h6>

                                        {isVideoUpload &&
                                            <a className="link-primary text-underline w-auto" style={{ padding: '0%', marginLeft: '5%' }} target='_blank' href={selectedFilePath} rel='noreferrer'>Preview</a>
                                        }
                                        {isVideoUpload === false && updateInfluencerHelpData.video_url !== '' &&
                                            <a className="link-primary text-underline w-auto" style={{ padding: '0%', marginLeft: '5%' }} target='_blank' rel='noreferrer' href={updateInfluencerHelpData.video_url} >Preview</a>}
                                    </div>
                                    <div className='row'>
                                        <div className='col-12 col-lg-6 mb-2'>
                                            <label
                                                htmlFor='button-video'
                                                style={{
                                                    border: '1px solid var(--bs-border-color)',
                                                    padding: '6px 12px',
                                                    color: 'var(--bs-body-color)',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    marginTop: '1%'
                                                }}
                                                className='d-inline-block'
                                            >
                                                Choose Video
                                            </label>
                                        </div>
                                        <div className='col-12 col-lg-6 mb-2'>
                                            {isVideoUploadStart && <>
                                                <div className="progress">
                                                    <div
                                                        className='progress-bar progress-bar-striped progress-bar-animated'
                                                        role='progressbar'
                                                        style={{ width: videoProgress }}
                                                    ></div>
                                                </div>
                                                <span>
                                                    {selectedFile !== undefined ?
                                                        uploadProgress('video')
                                                        : 0
                                                    }
                                                </span>
                                            </>
                                            }
                                        </div>
                                    </div>
                                    <input
                                        accept='video/mp4'
                                        id='button-video'
                                        className='file-upload-new'
                                        name='video'
                                        onChange={(e) => {
                                            handleFileUpload(e)
                                        }}
                                        type='file'
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className='form-group row mt-3'>
                                <div className='col-12 col-md-6'>
                                    <label className='mb-2'>Optional PDF Title</label>
                                    <input
                                        name='pdf_title'
                                        type='text'
                                        className='form-control'
                                        value={updateInfluencerHelpData.pdf_title}
                                        onChange={(e) => {
                                            updateInfluencerHelpData.pdf_title = e.target.value
                                        }}
                                    />
                                </div>
                                <div className='col-12 mb-3 col-md-6 mt-3 mt-md-0'>
                                    <div className='row ms-1'>
                                        <h6 className='w-auto'>Optional Select PDF</h6>
                                        {isPdfUpload &&
                                            <a className="link-primary text-underline w-auto ms-5" style={{ padding: '0%' }} target='_blank' href={selectedPdfFilePath} rel='noreferrer'>Preview</a>
                                        }
                                        {isPdfUpload === false && updateInfluencerHelpData.pdf_url !== '' &&
                                            <a className="link-primary text-underline w-auto ms-5" style={{ padding: '0%' }} target='_blank' href={updateInfluencerHelpData.pdf_url} rel='noreferrer'>Preview</a>}
                                    </div>
                                    <div className='row'>
                                        <div className='col-12 col-lg-6 mb-2'>
                                            <label
                                                htmlFor='button-pdf'
                                                style={{
                                                    border: '1px solid var(--bs-border-color)',
                                                    padding: '6px 12px',
                                                    color: 'var(--bs-body-color)',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    marginTop: '1%'
                                                }}
                                                className='d-inline-block'
                                            >
                                                Choose PDF
                                            </label>
                                        </div>
                                        <div className='col-12 col-lg-6 mb-2'>
                                            {isPdfUploadStart && <>
                                                <div className="progress">
                                                    <div
                                                        className='progress-bar progress-bar-striped progress-bar-animated'
                                                        role='progressbar'
                                                        style={{ width: pdfProgress }}
                                                    ></div>
                                                </div>
                                                <span>
                                                    {selectedPdfFile !== undefined ?
                                                        uploadProgress('pdf')
                                                        : 0
                                                    }
                                                </span>
                                            </>
                                            }
                                        </div>
                                    </div>
                                    <input
                                        accept='application/pdf'
                                        id='button-pdf'
                                        className='file-upload-new'
                                        name='pdf'
                                        onChange={(e) => {
                                            handleFileUpload(e)
                                        }}
                                        type='file'
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className='col-md-6'>
                                <label className='me-2 mt-2 d-flex align-items-center mb-1'>
                                    Tags
                                </label>
                                <Select
                                    name='tags'
                                    options={helpTags}
                                    isMulti
                                    onChange={onHelpTagsChange}
                                    className='mb-3'
                                    value={selectedHelpTags}
                                />
                            </div>
                            <div className='form-group row mb-2'>
                                <label className='me-2 mt-2 d-flex align-items-center mb-1'>Help Visibility</label>
                                <div className='col-md-12'>
                                    <div className='form-check ps-2 px-1'>
                                        <label className='form-check-label'>
                                            <input
                                                id=''
                                                className='m-2 form-check-input'
                                                name='specificWebsite'
                                                type='radio'
                                                checked={updateInfluencerHelpData.is_visible_to_all_websites === true ? true : false}
                                                onChange={() => {
                                                    updateInfluencerHelpData.is_visible_to_all_websites = true
                                                }}
                                            />All Website
                                        </label>
                                    </div>
                                </div>
                                <div className='col-md-12'>
                                    <div className='form-check ps-2 px-1'>
                                        <label className='form-check-label'>
                                            <input
                                                id=''
                                                className='m-2 form-check-input'
                                                name='specificWebsite'
                                                type='radio'
                                                onChange={() => {
                                                    updateInfluencerHelpData.is_visible_to_all_websites = false
                                                }}
                                                checked={updateInfluencerHelpData.is_visible_to_all_websites === false ? true : false}
                                            />Specific Website
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {updateInfluencerHelpData.is_visible_to_all_websites === false &&
                                <div className='col-md-6'>
                                    <label className='me-2 mt-2 d-flex align-items-center mb-1'>
                                        Specific Websites Tag
                                    </label>
                                    <Select
                                        name='visible_to_tags'
                                        options={specificWebsiteHelpTags}
                                        isMulti
                                        onChange={onHelpTagsChange}
                                        className='mb-3'
                                        value={selectedHelpTagsForSpecific}
                                    />
                                </div>
                            }
                            <div className='form-group row'>
                                <div className='col-md-6 mb-2'>
                                    <label className='mb-2'>Publish Date</label><br />
                                    <DatePicker
                                        selected={targetDate}
                                        className='form-control mb-2'
                                        onChange={handlePublishDateChange}
                                        locale="pt-BR"
                                        showTimeSelect
                                        timeFormat="p"
                                        timeIntervals={10}
                                        dateFormat="Pp"
                                    />
                                    <small className="form-text text-muted">Time is in UTC.</small>
                                </div>
                            </div>
                            <button type='button' className="btn btn-primary mt-3" onClick={(e) => {
                                handleSubmit(e)
                            }}
                            disabled={isApiCall}
                            >
                                {id !== 'add-influencer' ? 'Update' : 'Add'}
                            </button>

                            <button type='button' className="btn btn-danger mt-3" style={{ marginLeft: '1%' }} onClick={(e) => {
                                history('/influencer-help')
                            }}
                            disabled={isApiCall}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(AddInfluencerHelp)
