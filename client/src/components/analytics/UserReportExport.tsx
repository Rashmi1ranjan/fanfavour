import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import FileSaver from 'file-saver'
import classNames from 'classnames'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

const UserReportExport: React.FC<Props> = ({ rootStore }) => {
    const { AnalyticsReportStore, websiteStore } = rootStore
    const { exportCSVForUserCountAnalytics, setIsCSVAvailable, setReportType, setWebsite, isCSVAvailable, reportType, csvFile, isLoading, website } = AnalyticsReportStore

    const handleSubmit = (e: any) => {
        if (reportType !== '') {
            exportCSVForUserCountAnalytics()
        } else {
            alert('Select Report type')
        }
    }

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value
        setIsCSVAvailable()
        if (name === 'reportType') {
            setReportType(e.target.value)
        }
    }

    const downloadCsvFile = () => {
        if (csvFile) {
            const csvData = new Blob([csvFile], { type: 'text/csv' })
            FileSaver.saveAs(csvData, `user_${reportType}.csv`)
        }
    }

    const handleDomainChange = (selectedOption: OptionType, e: any) => {
        const name = e.name

        if (name === 'domain') {
            setWebsite(selectedOption.value)
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-lg-6'>
                <div className='card mt-4'>
                    <div className='card-header'>
                        Export Monthly User analytics
                    </div>
                    <div className="card-body">
                        <form className='form'>
                            <div className='form-group row'>
                                <div className='col-md-12 mb-2'>
                                    <label className='mb-2'>Domain</label>
                                    <Domain
                                        onDomainChange={handleDomainChange}
                                        websiteStore={websiteStore}
                                        loading={isLoading}
                                        defaultDomain={website}
                                        multiSelect={false}
                                    />
                                </div>
                                <div className='col-md-12'>
                                    <label>Report Type</label>
                                    <div className='form-check mt-2'>
                                        <label className='form-check-label'>
                                            <input
                                                className='me-2 form-check-input'
                                                name='reportType'
                                                type='radio'
                                                onChange={onChange}
                                                value='registration'
                                            />Registration
                                        </label>
                                    </div>
                                </div>
                                <div className='col-md-12'>
                                    <div className='form-check mt-2'>
                                        <label className='form-check-label'>
                                            <input
                                                className='me-2 form-check-input'
                                                name='reportType'
                                                type='radio'
                                                onChange={onChange}
                                                value='subscription'
                                            />Subscription
                                        </label>
                                    </div>
                                </div>
                                <div className='col-md-12'>
                                    <div className='form-check mt-2'>
                                        <label className='form-check-label'>
                                            <input
                                                className='me-2 form-check-input'
                                                name='reportType'
                                                type='radio'
                                                onChange={onChange}
                                                value='cancellation'
                                            />Cancellation
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button type='button' className="btn btn-primary me-3 mt-3" onClick={handleSubmit} disabled={isLoading}>
                                <span className={classNames('spinner-border spinner-border-sm me-1', { 'd-none': !isLoading })} role='status' aria-hidden='true'></span>
                                {isLoading ? 'Loading...' : 'Generate CSV'}
                            </button>
                            {isCSVAvailable ?
                                <button type="button" className="btn btn-link mt-3" onClick={downloadCsvFile}>Download CSV</button>
                                : null}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(UserReportExport)
