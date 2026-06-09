import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWindowClose } from '@fortawesome/free-solid-svg-icons'
import Select from 'react-select'
import { ActionMeta, ValueType } from 'react-select/src/types'
import _ from 'lodash'
import moment from 'moment'
import { ToastContainer, toast } from 'react-toastify'
import styled from 'styled-components'
import 'react-toastify/dist/ReactToastify.css'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const ViewDetailDiv = styled.div<{ isLoadReadCount: boolean, disableDiv: boolean }>`
    cursor: pointer !important;
    pointer-events: ${props => props.isLoadReadCount === false || props.disableDiv === true ? 'none' : ''} !important;
    color: ${props => props.isLoadReadCount === false || props.disableDiv === true ? 'hsl(0, 0%, 70%)' : ''} !important;
`

const ActionDiv = styled.div<{ isLoadReadCount: boolean }>`
    .disable {
        pointer-events: ${props => props.isLoadReadCount === false ? 'none' : ''} !important;
        cursor: pointer;
        color: ${props => props.isLoadReadCount === false ? 'hsl(0, 0%, 70%)' : ''} !important;
    }
`

type IsMulti = boolean

const InfluencerHelp: React.FC<Props> = ({ rootStore }) => {
    const { InfluencerHelpStore, HelpTagsStore } = rootStore
    const {
        getInfluencerHelpDataList,
        influencerHelpData,
        currentPage,
        totalPage,
        limit,
        totalRows,
        updateStatus,
        isApiCall,
        deleteInfluencerHelp,
        changeFormatOfDate,
        getInfluencerReadCount,
        isLoading,
        filter
    } = InfluencerHelpStore

    const {
        getAllHelpTagsData,
        allHelpTagsData,
        getSpecificWebsiteHelpTagsData,
        specificWebsiteHelpTagsData
    } = HelpTagsStore

    const [showViewModel, setShowViewModel] = useState(false)
    const [viewContentInModel, setViewContentInModel] = useState('')
    const [viewContentType, setViewContentType] = useState('')
    const [viewTitleInModel, setViewTitleInModel] = useState('')

    useEffect(() => {
        getAllHelpTagsData()
        getSpecificWebsiteHelpTagsData()
        getInfluencerHelpDataList(currentPage)
    }, [])

    const changePage = (pageNUM: number) => {
        getInfluencerHelpDataList(pageNUM)
    }

    const setReadCount = (id: string) => {
        const findIndex = influencerHelpData.findIndex(obj => obj._id === id)
        influencerHelpData[findIndex].is_display_read_count = false
        getInfluencerReadCount(id)
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const isActive = _.get(jsonData, 'is_active', true)
        const isPopupEnable = _.get(jsonData, 'display_as_popup', false)
        const Url = '/edit-influencer/' + jsonData._id
        const regex = /<p[^>]*>\s*\S.*?\s*<\/p>/
        return (<div style={{ textAlign: 'start' }}>
            <div className='d-inline-flex'>
                {isPopupEnable === true &&
                    <ViewDetailDiv
                        isLoadReadCount={jsonData.is_display_read_count}
                        disableDiv={!regex.test(jsonData.popup_intro)}
                        className='link-primary text-decoration-underline p-1'
                        onClick={() => {
                            viewDetail(jsonData.popup_intro, jsonData.title, 'Popup Intro')
                        }}
                    >
                        View PopUp Intro
                    </ViewDetailDiv>
                }
                <ViewDetailDiv
                    isLoadReadCount={jsonData.is_display_read_count}
                    disableDiv={!regex.test(jsonData.html)}
                    className='link-primary text-decoration-underline p-1'
                    onClick={() => {
                        viewDetail(jsonData.html, jsonData.title, 'Html')
                    }}
                >
                    View content
                </ViewDetailDiv>
            </div>
            <ActionDiv className='d-inline-flex' isLoadReadCount={jsonData.is_display_read_count}>
                <div className='link-primary p-1 text-decoration-underline p-1'>
                    <NavLink className='link-primary' to={Url}>Edit</NavLink>
                </div>
                <div className='link-primary text-decoration-underline p-1 disable' onClick={() => updateActiveStatus(jsonData._id)}>
                    {isActive ? 'Inactive' : 'Active'}
                </div>
                <div className='link-primary text-decoration-underline p-1 disable' onClick={() => deleteHelp(jsonData._id)}>
                    Delete
                </div>
                <div className='link-primary text-decoration-underline p-1 disable' onClick={() => setReadCount(jsonData._id)}>
                    Get Read Count
                </div>
                {jsonData.is_display_read_count === true &&
                    <div className='p-1'>
                        Read Count: {jsonData.read_count}
                    </div>
                }
            </ActionDiv>
        </div>)
    }

    const deleteHelp = (id: string) => {
        const confirm = window.confirm('Are you sure to Delete this Help?')
        if (confirm === false) {
            return false
        }

        deleteInfluencerHelp(id)
    }

    const updateActiveStatus = (id: string) => {
        updateStatus(id, (success, message) => {
            if (success === true) {
                toast.success(message)
            } else {
                toast.error(message)
            }
        })
    }

    const getFormatDate = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const publishDate = changeFormatOfDate(jsonData.publish_date)
        const date: string = moment(publishDate).format('MM/DD/YYYY HH:mm:ss')
        return (<>
            {
                date
            }<br />
            (<i className='fa fa-clock-o' />{moment.utc(date).fromNow()})
        </>)
    }

    const getActiveData = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        let cssForDisplayActive = 'badge text-bg-success'
        if (jsonData.is_active === false) {
            cssForDisplayActive = 'badge text-bg-danger'
        }
        return (<>
            <span className={cssForDisplayActive}>{jsonData.is_active === true ? 'Active' : 'Inactive'}</span>
        </>)
    }

    const showUserType = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        return <span>{jsonData.for_admin === true ? 'Admin' : 'User'}</span>
    }

    const viewDetail = (content: string, title: string, contentType: string) => {
        setShowViewModel(true)
        setViewContentInModel(content)
        setViewTitleInModel(title)
        setViewContentType(contentType)
        document.body.style.overflow = 'hidden'
    }

    const closeViewDialog = () => {
        setShowViewModel(false)
        setViewContentInModel('')
        setViewContentType('')
        document.body.style.overflow = 'scroll'
    }

    const displayInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        let cssForDisplayNotification = ''
        let cssForDisplayPopup = ''
        let cssForExcludeFromHelp = ''
        if (jsonData.display_as_popup === true) {
            cssForDisplayPopup = 'badge text-bg-info'
        }
        if (jsonData.display_as_notification === true) {
            cssForDisplayNotification = 'badge text-bg-success'
        }
        if (jsonData.exclude_from_help === true) {
            cssForExcludeFromHelp = 'badge text-bg-primary'
        }
        return <div>
            {jsonData.display_as_notification === true && <><span className={cssForDisplayNotification}> Notification</span> <br /></>}
            {jsonData.display_as_popup === true && <><span className={cssForDisplayPopup}>Popup</span> <br /></>}
            {jsonData.exclude_from_help === true && <span className={cssForExcludeFromHelp}>Exclude from help</span>}
        </div>
    }

    const statusOption: OptionType[] = [
        { label: 'All', value: '' },
        { label: 'Notification', value: 'display_as_notification' },
        { label: 'Popup', value: 'display_as_popup' },
        { label: 'Exclude From Help', value: 'exclude_from_help' },
        { label: 'Only Help', value: 'only_help' }
    ]

    const selectedStatusOption = _.find(statusOption, (item: OptionType) => {
        return item.value === filter.key
    })

    const forAdminOption: OptionType[] = [
        { label: 'All', value: '' },
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' }
    ]

    const selectedAdminOption = _.find(forAdminOption, (item: OptionType) => {
        return item.value === filter.for_admin
    })

    const handleChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name
        if (name === 'help_status') {
            const helpStatus = _.get(value, 'value', '')
            filter.key = helpStatus
        }

        if (name === 'for_admin') {
            const forAdmin = _.get(value, 'value', '')
            filter.for_admin = forAdmin
        }

        if (name === 'tags') {
            const helpTag = _.get(value, 'value', '')
            filter.helpTag = helpTag
        }

        if (name === 'visible_to_tags') {
            const websiteTag = _.get(value, 'value', '')
            filter.websiteTag = websiteTag
        }

        getInfluencerHelpDataList(1)
    }

    const displayTags = (objData: object) => {
        const data = _.get(objData, 'data', {}) as { tags: [], tagList: [] }
        return (<>
            {data.tags.length > 0 && data.tagList.map((item: { title: string }, i: number) => {
                return (<><span className='badge text-bg-primary' key={i}>{item.title}</span> <br /></>)
            })}
        </>)
    }

    const displaySpecificWebsiteTags = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const specificWebsiteTagList = _.get(data, 'specificWebsiteTagList', [])
        return (<>
            {specificWebsiteTagList.length > 0 && specificWebsiteTagList.map((item: { title: string, _id: string }, i: number) => {
                return (<><span className='badge text-bg-primary' key={i}>{item.title}</span> <br /></>)
            })}
        </>)
    }

    const getHelpInfo = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))

        const videoUrl = _.get(jsonData, 'video_url', '')
        let videoFileName = ''
        if (!_.isEmpty(jsonData.video_url)) {
            videoFileName = jsonData.video_url.split('/')
            videoFileName = videoFileName[videoFileName.length - 1]
        }
        const videoTitle = _.get(jsonData, 'video_title', '')

        const pdfUrl = _.get(jsonData, 'pdf_url', '')
        let pdfFileName = ''
        if (!_.isEmpty(jsonData.pdf_url)) {
            pdfFileName = jsonData.pdf_url.split('/')
            pdfFileName = pdfFileName[pdfFileName.length - 1]
        }
        const pdfTitle = _.get(jsonData, 'pdf_title', '')

        return (<>
            <div className='row'>
                <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '500px',
                    whiteSpace: 'nowrap'
                }}>Title:&nbsp;&nbsp;{jsonData.title}
                </div>

                {(!_.isEmpty(videoUrl) || !_.isEmpty(videoTitle)) &&
                    <div className='col-12 d-flex'>
                        Video Title:&nbsp;&nbsp;
                        {!_.isEmpty(videoUrl) ?
                            <a className="link-primary" style={{ padding: '0%' }} target='_blank' href={videoUrl} rel='noreferrer'>
                                {!_.isEmpty(videoTitle) ? videoTitle : 'Video Preview'}
                            </a>
                            : videoTitle
                        }
                    </div>
                }
                {(!_.isEmpty(pdfUrl) || !_.isEmpty(pdfTitle)) &&
                    <div className='col-12 d-flex'>
                        PDF Title:&nbsp;&nbsp;
                        {!_.isEmpty(pdfUrl) ?
                            <a className="link-primary" style={{ padding: '0%' }} target='_blank' href={pdfUrl} rel='noreferrer'>
                                {!_.isEmpty(pdfTitle) ? pdfTitle : 'PDF Preview'}
                            </a>
                            : pdfTitle
                        }
                    </div>
                }
            </div>
        </>
        )
    }

    const helpTags: OptionType[] = [
        { label: 'All', value: '' }
    ]
    const helpTagsOptions: OptionType[] = allHelpTagsData.map((option: { title: string, _id: string }) => (
        { label: option.title, value: option._id }
    ))
    helpTags.push(...helpTagsOptions)

    const selectedHelpTagOption = _.find(helpTags, (item: OptionType) => {
        return item.value === filter.helpTag
    })

    const specificWebsiteHelpTags: OptionType[] = [
        { label: 'All', value: '' }
    ]

    const specificWebsiteHelpTagsOptions: OptionType[] = specificWebsiteHelpTagsData.map((option: { title: string, _id: string }) => (
        { label: option.title, value: option._id }
    ))

    specificWebsiteHelpTags.push(...specificWebsiteHelpTagsOptions)

    const selectedSpecificWebsiteHelpTags = _.find(specificWebsiteHelpTags, (item: OptionType) => {
        return item.value === filter.websiteTag
    })

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="row border-bottom py-2">
            <div className='col-md-6'>
                <h4>Influencer Help</h4>
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
            <div className='col-md-6'>
                <NavLink className="float-end text-decoration-underline me-3 link-primary" to="/add-influencer" style={{ fontSize: 'larger' }}>Add</NavLink>
            </div>
        </div>
        <div className='row'>
            <div className='col-md-3' >
                <div className='mt-3'>
                    <label className='mb-2'>Display As</label>
                    <Select
                        name='help_status'
                        options={statusOption}
                        onChange={handleChange}
                        defaultValue={selectedStatusOption}
                        className='ms-3'
                        isDisabled={isLoading}
                    />
                </div>
            </div>
            <div className='col-md-3'>
                <div className='mt-3'>
                    <label className='mb-2'>
                        Tags
                    </label>
                    <Select
                        name='tags'
                        options={helpTags}
                        onChange={handleChange}
                        className='mb-3'
                        defaultValue={selectedHelpTagOption}
                        isDisabled={isLoading}
                    />
                </div>
            </div>
            <div className='col-md-3'>
                <div className='mt-3'>
                    <label className='mb-2'>
                        Specific Websites Tag
                    </label>
                    <Select
                        name='visible_to_tags'
                        options={specificWebsiteHelpTags}
                        onChange={handleChange}
                        className='mb-3'
                        defaultValue={selectedSpecificWebsiteHelpTags}
                        isDisabled={isLoading}
                    />
                </div>
            </div>
            <div className='col-md-3' >
                <div className='mt-3'>
                    <label className='mb-2'>User Type</label>
                    <Select
                        name='for_admin'
                        options={forAdminOption}
                        onChange={handleChange}
                        defaultValue={selectedAdminOption}
                        className='ms-3'
                        isDisabled={isLoading}
                    />
                </div>
            </div>
        </div>
        <div className="card-body px-0">
            <div className='table-responsive mt-3'>
                <Table
                    unique_key='_id'
                    columns={[
                        { name: 'Info', title: 'Info', component: getHelpInfo },
                        { name: 'display', title: 'Display As', component: displayInfo },
                        { name: 'publish_date', title: 'Publish Date', component: getFormatDate },
                        { name: 'tags', title: 'Tags', component: displayTags },
                        { name: 'specific_tags', title: 'Specific Website Tags', component: displaySpecificWebsiteTags },
                        { name: 'is_active', title: 'Status', component: getActiveData },
                        { name: 'for_admin', title: 'User Type', component: showUserType },
                        { name: 'action', title: 'Actions', component: tableCellButton }
                    ]}
                    data={influencerHelpData}
                    isLoading={isLoading}
                ></Table>
            </div>
            {(!isLoading && influencerHelpData.length > 0) &&
                <Pagination
                    totalPages={totalPage}
                    currentPage={currentPage}
                    totalItems={totalRows}
                    itemsPerPage={limit}
                    onItemClick={changePage}
                ></Pagination>
            }
        </div>
        {
            showViewModel &&
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            } >
                <div className='modal-dialog modal-dialog-centered modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ lineBreak: 'anywhere' }}>
                            <h4 className='px-2'>{viewTitleInModel}</h4>
                            <div className='ms-auto' onClick={() => {
                                closeViewDialog()
                            }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>
                        <div className='modal-body' style={{ display: 'contents', lineHeight: 'normal' }}>
                            <div className='container'>
                                <div className='row m-4'>
                                    <div className='col' dangerouslySetInnerHTML={{ __html: viewContentInModel }}>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }
    </Container >
}

export default observer(InfluencerHelp)
