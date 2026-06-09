import React, { useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import moment from 'moment'
import FileSaver from 'file-saver'
import classNames from 'classnames'

interface Props {
    rootStore: RootStore
}

const MonthlyEarningReport: React.FC<Props> = ({ rootStore }) => {
    const { earningReportStore } = rootStore
    const allMonth = [
        { key: '01', value: 'January' }, { key: '02', value: 'February' }, { key: '03', value: 'March' },
        { key: '04', value: 'April' }, { key: '05', value: 'May' }, { key: '06', value: 'June' }, { key: '07', value: 'July' },
        { key: '08', value: 'August' }, { key: '09', value: 'September' }, { key: '10', value: 'October' }, { key: '11', value: 'November' }, { key: '12', value: 'December' }]

    const { generateMonthlyEarningReportCSV, setIsCSVAvailable, isCSVAvailable, csvFile, isLoading } = earningReportStore
    const [monthRecord, setMonthRecord] = useState<{ key: string, value: string }[]>([])
    const [filterMonth, setFilterMonth] = useState(moment().format('MM'))
    const [isReferral, setReferral] = useState(false)
    const [filterYear, setFilterYear] = useState(moment().format('YYYY'))
    const [isFormula, setIsFormula] = useState(false)
    const [excludeStoppedWebsites, setExcludeStoppedWebsites] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const yearRecord = []
    let oldYear = 2019
    const [earningReportSelect, setEarningReportSelect] = useState('earningReport')
    const [stickyIoSelect, setStickyIoSelect] = useState('real')

    let currentMonth = moment().format('MM')
    const currentYear = moment().format('YYYY')

    const yearDiff = Number(currentYear) - oldYear
    for (let i = 0; i <= yearDiff; i++) {
        yearRecord.push(oldYear)
        oldYear = oldYear + 1
    }

    const setRecord = (currentMonth: string) => {
        const monthRecords = []
        for (const element of allMonth) {
            if (element.key <= currentMonth) {
                monthRecords.push(element)
            }
        }
        // @ ts-ignore
        setMonthRecord(monthRecords)
        if (currentMonth !== '12') {
            const month = moment().format('MM')
            if (filterMonth > month) {
                // @ ts-ignore
                setFilterMonth(monthRecords[0].key)
            }
        }
    }

    if (isLoaded === false) {
        setIsLoaded(true)
        setRecord('12')
    }
    const selectMonthOptions = monthRecord.map(option => (
        // @ ts-ignore
        <option key={option.key} value={option.key} selected={option.key === currentMonth}>{option.value}</option>
    ))

    const selectYearOptions = yearRecord.map(option => (
        <option key={option} value={option} selected={option === parseInt(currentYear)}>{option}</option>
    ))

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name
        const value = e.target.value
        setIsCSVAvailable()
        if (name === 'year') {
            if (value < moment().format('YYYY')) {
                setRecord('12')
            } else {
                currentMonth = moment().format('MM')
                setRecord(currentMonth)
            }
            setFilterYear(value)
        } else if (name === 'month') {
            setFilterMonth(value)
        } else if (name === 'isReferral') {
            (isReferral) ? setReferral(false) : setReferral(true)
        } else if (name === 'isFormula') {
            (isFormula) ? setIsFormula(false) : setIsFormula(true)
        } else if (name === 'excludeStoppedWebsites') {
            (excludeStoppedWebsites) ? setExcludeStoppedWebsites(false) : setExcludeStoppedWebsites(true)
        } else if (name === 'earningReportSelection') {
            setEarningReportSelect(value)
        } else if (name === 'stickyIoSelection') {
            setStickyIoSelect(value)
        }
    }

    const handleSubmit = (e: any) => {
        if (filterMonth !== '' && filterYear !== '') {
            let startDate = filterYear + '-' + filterMonth + '-01'

            startDate = moment(startDate).clone().startOf('month').format('YYYY-MM-DD 00:00:00')
            const endDate = moment(startDate).clone().endOf('month').format('YYYY-MM-DD 23:59:59')

            const object = {
                startDate: startDate,
                endDate: endDate,
                isReferral: isReferral,
                withFormula: isFormula,
                excludeStoppedWebsites: excludeStoppedWebsites,
                earningReportSelect: earningReportSelect,
                stickyIoSelect: stickyIoSelect
            }
            generateMonthlyEarningReportCSV(object)
        } else {
            alert('Select month and year')
        }
    }

    const downloadCsvFile = () => {
        if (csvFile) {
            const csvData = new Blob([csvFile], { type: 'text/csv' })
            FileSaver.saveAs(csvData, `${moment(filterMonth).format('MMMM')}-${filterYear}.csv`)
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-lg-6'>
                <div className='card mt-4'>
                    <div className='card-header'>
                        Export Monthly Earning Report
                    </div>
                    <div className="card-body">
                        <form className='form'>
                            <div className='form-group'>
                                <label className='me-2 mb-2'>Year</label>
                                <select
                                    className='form-control form-select mb-2'
                                    id='year'
                                    name='year'
                                    onChange={onChange}>
                                    {selectYearOptions}
                                </select>
                            </div>
                            <div className='form-group'>
                                <label className='me-2 mb-2'>Month</label>
                                <select
                                    className='form-control form-select mb-2'
                                    id='month'
                                    name='month'
                                    onChange={onChange}>
                                    {selectMonthOptions}
                                </select>
                            </div>
                            <div className='form-group row'>
                                <div className='col-md-12'>
                                    <div className='form-check mt-2'>
                                        <label className='form-check-label'>
                                            <input
                                                id=''
                                                className='form-check-input'
                                                name='earningReportSelection'
                                                type='radio'
                                                checked={earningReportSelect === 'earningReport' ? true : false}
                                                onChange={onChange}
                                                value='earningReport'
                                            />Earning Report
                                        </label>
                                    </div>
                                </div>
                                <div className='col-md-12'>
                                    <div className='form-check mt-2'>
                                        <label className='form-check-label'>
                                            <input
                                                id=''
                                                className='form-check-input'
                                                name='earningReportSelection'
                                                type='radio'
                                                onChange={onChange}
                                                checked={earningReportSelect === 'nonWebsiteReferealPayoutReport' ? true : false}
                                                value='nonWebsiteReferealPayoutReport'
                                            />Non Website Referral Payout Report
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {earningReportSelect === 'earningReport' ?
                                <div className='form-group row mt-4'>
                                    <div className='col-sm-12'>
                                        <div className='form-check mt-2'>
                                            <label className='form-check-label'>
                                                <input
                                                    id='isReferral'
                                                    name='isReferral'
                                                    type='checkbox'
                                                    className='form-check-input'
                                                    placeholder=''
                                                    checked={isReferral}
                                                    onChange={onChange}
                                                /> Websites with Referrals Only
                                            </label>
                                        </div>
                                    </div>
                                    <div className='col-sm-12'>
                                        <div className='form-check mt-2'>
                                            <label className='form-check-label'>
                                                <input
                                                    id='isFormula'
                                                    name='isFormula'
                                                    type='checkbox'
                                                    className='form-check-input'
                                                    placeholder=''
                                                    checked={isFormula}
                                                    onChange={onChange}
                                                />Export with Excel Formulas
                                            </label>
                                        </div>
                                    </div>
                                    <div className='col-sm-12'>
                                        <div className='form-check mt-2'>
                                            <label className='form-check-label'>
                                                <input
                                                    id='excludeStoppedWebsites'
                                                    name='excludeStoppedWebsites'
                                                    type='checkbox'
                                                    className='form-check-input'
                                                    placeholder=''
                                                    checked={excludeStoppedWebsites}
                                                    onChange={onChange}
                                                />Removed stopped websites
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                : null}
                            <button type='button' className="btn btn-primary me-3 mt-3" onClick={handleSubmit} disabled={isLoading}>
                                <span className={classNames('spinner-border spinner-border-sm me-1', { 'd-none': !isLoading })} role='status' aria-hidden='true'></span>
                                {isLoading ? 'Loading...' : 'Generate CSV'}
                            </button>
                            {isCSVAvailable ?
                                <button type="button" className="btn btn-link text-decoration-none mt-3" onClick={downloadCsvFile}>Download CSV</button>
                                : null}

                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(MonthlyEarningReport)
