import React, { SyntheticEvent, useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'
import _ from 'lodash'
import Loader from '../loader/Loader'
import Select from 'react-select'
import { OptionType } from '../../types/types'
import { ActionMeta, ValueType } from 'react-select/src/types'
import { getPresignedUrl, uploadFileToS3 } from '../../utils/getPresignedUrl'

type IsMulti = boolean

interface Props {
    rootStore: RootStore
}

interface Options {
    label: string
    value: boolean
}


const AddModel: React.FC<Props> = ({ rootStore }) => {
    const { ModelStore, websiteStore } = rootStore
    const { setModel, getModelDataById, clearModelData, editModelData, isLoading, isDataLoading, clearModelFilter } = ModelStore
    const [uploadLoading, setUploadLoading] = useState(false)
    const { getWebsitesData, websiteData } = websiteStore
    const [uploadProgress, setUploadProgress] = useState(0)

    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()
    const [isApiCall, setIsApiCall] = useState(false)
    const [files, setFiles] = useState<File[]>([])

    useEffect(() => {
        getWebsitesData()
    }, [getWebsitesData])

    useEffect(() => {
        clearModelData()
        if (window.location.pathname.includes('edit-model')) {
            getModelDataById(id)
        }
    }, [clearModelData, getModelDataById, id])

    const onChange = (value: ValueType<OptionType, IsMulti>, action: ActionMeta<OptionType>) => {
        const name = action.name as string
        const selectedValue = value
        _.set(editModelData, name, selectedValue)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value.trim()
        let is_featured_model = false
        if (value === 'yes') {
            is_featured_model = true
        }
        _.set(editModelData, name, is_featured_model)
    }

    const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        // Only accept PDF, PNG, JPG
        const allowedTypes = ['image/png', 'image/jpeg']
        const newValidFiles = selectedFiles.filter(file =>
            allowedTypes.includes(file.type)
        )

        if (newValidFiles.length === 0) {
            alert('Please upload valid files (PNG, JPG, JPEG)')
            return
        }

        // Optional: Prevent duplicate files (by name + size)
        const existingFileKeys = new Set(files.map(f => `${f.name}-${f.size}`))
        const filteredFiles = newValidFiles.filter(
            file => !existingFileKeys.has(`${file.name}-${file.size}`)
        )

        const previewUrl = URL.createObjectURL(selectedFiles[0])
        editModelData.image = previewUrl
        editModelData.previewUrl = previewUrl

        // Append to existing state
        setFiles(filteredFiles)
        e.target.value = ''
    }

    const onSubmit = async (e: SyntheticEvent) => {
        e.preventDefault()
        const websiteUrl = _.get(editModelData, 'website_url.value', '').trim()
        const is_featured_model = _.get(editModelData, 'is_featured_model', '')
        const featured_model_display_order = _.get(editModelData, 'featured_model_display_order', 0)

        if (websiteUrl === '' && id === '') {
            alert('Please select website url')
            return
        }

        if (is_featured_model) {
            if (featured_model_display_order === 0) {
                alert('Please enter featured model display order')
                return
            }
        }

        const selectedFile = files[0]
        if (selectedFile) {
            setUploadLoading(true)
            const presignedUrlData = await getPresignedUrl(files[0].name, 'photo')

            const { presigned_url, file_name } = presignedUrlData
            await uploadFileToS3(presigned_url, selectedFile, 'image/jpg', setUploadProgress)
            editModelData.image = file_name
            setUploadLoading(false)
        }

        setIsApiCall(true)
        setModel((success: boolean) => {
            setIsApiCall(false)
            if (success === true) {
                if (id === 'add-model') {
                    clearModelFilter()
                }
                history('/model-list')
            }
        })
    }

    const websiteOptions: OptionType[] = websiteData.map((option) => (
        { label: `${option.website_url}`, value: option.website_url }
    ))

    const featuredModelOption: Options[] = [
        { label: 'false', value: false },
        { label: 'true', value: true }
    ]

    if (isLoading && isApiCall === false) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className='card-title border-bottom'>{id !== 'add-model' ? 'Edit' : 'Add'} Model</h4>
        {isDataLoading ?
            <div className='text-center'>
                <Loader isLoading={true} />
            </div>
            :
            <div className='col-12'>
                <form onSubmit={(e) => onSubmit(e)}>
                    <div className='mb-3'>
                        <div className='card-body row mt-4'>
                            {!window.location.pathname.includes('edit-model') &&
                                <div className='form-group col-6 mb-3'>
                                    <label className='mb-2'>Website Url</label>
                                    <Select
                                        name='website_url'
                                        onChange={onChange}
                                        options={websiteOptions}
                                        isMulti={false}
                                    />
                                </div>
                            }
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Model Name</label>
                                <input
                                    name='model_name'
                                    type='text'
                                    className='form-control'
                                    value={editModelData.model_name}
                                    onChange={(e) => editModelData.model_name = e.target.value.trim()}
                                />
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Likes</label>
                                <input
                                    name='likes'
                                    type='number'
                                    className='form-control'
                                    value={editModelData.likes}
                                    onChange={(e) => editModelData.likes = Number(e.target.value)}
                                />
                            </div>
                            <div className='form-group col-6 mb-3'>
                                <label className='mb-2'>Display Order</label>
                                <input
                                    name='display_order'
                                    type='number'
                                    className='form-control'
                                    value={editModelData.display_order}
                                    onChange={(e) => editModelData.display_order = Number(e.target.value)}
                                />
                                <small className="form-text text-muted">e.g 1, 2, 3</small>
                            </div>
                            <div className='form-group col-6'>
                                <div className='col-md-3 mt-2'>
                                    <label className='me-2 mb-2'>Is Featured Model</label>
                                    <div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='is_featured_model' id='yes' value='yes' defaultChecked={editModelData.is_featured_model === true} onChange={handleChange} />
                                            <label className='form-check-label' htmlFor='is_featured_model'>Yes</label>
                                        </div>
                                        <div className='form-check form-check-inline'>
                                            <input className='form-check-input' type='radio' name='is_featured_model' id='no' defaultChecked={editModelData.is_featured_model === false} value='no' onChange={handleChange} />
                                            <label className='form-check-label' htmlFor='is_featured_model'>No</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {editModelData.is_featured_model === true &&
                                <div className='form-group col-6 '>
                                    <label className='mb-2'>Featured Model Display Order</label>
                                    <input
                                        name='display_order'
                                        type='number'
                                        className='form-control'
                                        value={editModelData.featured_model_display_order}
                                        onChange={(e) => editModelData.featured_model_display_order = Number(e.target.value)}
                                    />
                                    <small className="form-text text-muted">e.g 1, 2, 3</small>
                                </div>
                            }
                            <div className='mt-3'>
                                <div className='form-group col-6 mb-3'>
                                    <label className='mb-2'>Image</label>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        name='image'
                                        className='form-control'
                                        onChange={handleUploadFile}
                                    />
                                    {editModelData.previewUrl && (
                                        <div className='mt-3'>
                                            <img
                                                src={editModelData.previewUrl}
                                                alt='Selected Preview'
                                                style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className='progress mt-2'>
                                            <div
                                                className='progress-bar progress-bar-striped progress-bar-animated'
                                                role='progressbar'
                                                style={{ width: `${uploadProgress}%` }}
                                                aria-valuenow={uploadProgress}
                                                aria-valuemin={0} // <-- number, not string
                                                aria-valuemax={100} // <-- number, not string
                                            >
                                                {uploadProgress}%
                                            </div>
                                        </div>
                                    )}
                                    <small className="form-text text-muted">Only image files are allowed.</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-6 my-3'>
                        <button type='submit' className='btn btn-primary' disabled={isLoading || uploadLoading} style={{ marginRight: '20px' }} >
                            {(isLoading === true || uploadLoading) && (
                                <span
                                    className='spinner-border spinner-border-sm me-1'
                                    role='status'
                                    aria-hidden='true'
                                ></span>
                            )}
                            {id !== 'add-model' ? 'Update' : 'Add'} Model
                        </button>
                        <button type='button' className="btn btn-danger" disabled={isLoading || uploadLoading} onClick={() => {
                            history('/model-list')
                        }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        }
    </Container>
}

export default observer(AddModel)
