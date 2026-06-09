import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import _ from 'lodash'

interface Props {
    rootStore: RootStore
}

const AddAwsSettings: React.FC<Props> = ({ rootStore }) => {
    const { AwsSettingsStore } = rootStore

    const {
        getAwsSettingsData,
        editAwsSettingsData,
        setAwsSettingsData,
        isLoading
    } = AwsSettingsStore

    useEffect(() => {
        getAwsSettingsData()
    }, [getAwsSettingsData])

    const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setAwsSettingsData()
    }

    if (isLoading) {
        return <div className='text-center'>
            <div className='spinner-border' role='status'>
                <span className='sr-only'>Loading...</span>
            </div>
        </div>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-5'>
                <div className='card'>
                    <div className="card-header">
                        Aws Settings
                    </div>
                    <div className="card-body">
                        <div className='form-group'>
                            <label className='mb-2'>Aws Secret Key</label>
                            <input
                                name='aws_secret_key_id'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.aws_secret_key_id}
                                onChange={(e) => {
                                    editAwsSettingsData.aws_secret_key_id = e.target.value
                                }} />
                        </div>
                        <div className='form-group'>
                            <label className='mb-2'>Aws Secret Access Key</label>
                            <input
                                name='aws_secret_access_key'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.aws_secret_access_key}
                                onChange={(e) => {
                                    editAwsSettingsData.aws_secret_access_key = e.target.value
                                }} />
                        </div>
                        <div className='form-group'>
                            <label className='mb-2'>Aws Region</label>
                            <input
                                name='aws_region'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.aws_region}
                                onChange={(e) => {
                                    editAwsSettingsData.aws_region = e.target.value
                                }} />
                        </div>
                        <div className='form-group'>
                            <label className='mb-2'>Aws S3 Bucket</label>
                            <input
                                name='aws_s3_bucket'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.aws_s3_bucket}
                                onChange={(e) => {
                                    editAwsSettingsData.aws_s3_bucket = e.target.value
                                }} />
                        </div>
                        <div className='form-group'>
                            <label className='mb-2'>Aws Url</label>
                            <input
                                name='aws_url'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.aws_url}
                                onChange={(e) => {
                                    editAwsSettingsData.aws_url = e.target.value
                                }} />
                        </div>
                        <div className='form-group row'>
                            <div className='form-check mt-2 ms-3 mb-2'>
                                <label className='form-check-label'>
                                    <input
                                        type='checkbox'
                                        className='form-check-input mb-3'
                                        placeholder=''
                                        checked={editAwsSettingsData.is_cloud_front_enable}
                                        onChange={() => {
                                            editAwsSettingsData.is_cloud_front_enable = !editAwsSettingsData.is_cloud_front_enable
                                        }}
                                    /> Enable Cloud Front
                                </label>
                            </div>
                        </div>
                        <div className='form-group'>
                            <label className='mb-2'>Cloud Front Url</label>
                            <input
                                name='cloud_front_url'
                                type='text'
                                className='form-control mb-3'
                                value={editAwsSettingsData.cloud_front_url}
                                onChange={(e) => {
                                    editAwsSettingsData.cloud_front_url = e.target.value
                                }} />
                        </div>
                        <button type='button' className="btn btn-primary" onClick={handleSubmit} >
                            Save Aws Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(AddAwsSettings)
