import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { DateRangePicker, Range, RangeKeyDict } from 'react-date-range'
import moment from 'moment'

interface IDateRangeProps {
    title: string,
    name: string,
    id: string,
    startDate: string
    endDate: string
    onDateChange: (start_date: string, end_date: string) => void,
    loading?: boolean
}

function DateRange(props: IDateRangeProps) {
    const { title, name, id, startDate, endDate, onDateChange, loading } = props

    const [showDatePicker, setShowDatePicker] = useState(false)
    const [startDateInString, setStartDateInString] = useState(startDate)
    const [endDateInString, setEndDateInString] = useState(endDate)
    const startDateLocal = moment(startDate, 'MM-DD-YYYY').format('MM/DD/YYYY')
    const endDateLocal = moment(endDate, 'MM-DD-YYYY').format('MM/DD/YYYY')
    const [dateRange, setDateRange] = useState<Range>({
        startDate: startDate ? new Date(startDateLocal) : new Date(),
        endDate: endDate ? new Date(endDateLocal) : new Date(),
        key: 'selection'
    })

    const onClick = () => {
        const startDate = moment(dateRange.startDate).format('MM/DD/YYYY')
        const endDate = moment(dateRange.endDate).format('MM/DD/YYYY')
        onDateChange(startDate, endDate)
        setStartDateInString(startDate)
        setEndDateInString(endDate)
        toggleDatePicker()
    }

    const toggleDatePicker = () => { setShowDatePicker(!showDatePicker) }

    const dateRangeChange = (ranges: RangeKeyDict) => { setDateRange(ranges['selection']) }

    const inputValue = (startDateInString && endDateInString) ? `${startDateInString}-${endDateInString}` : ''

    return (<>
        <label className='mb-2'>{title}</label>
        <input
            name={name}
            id={id}
            className='form-control mb-3 bg-white'
            data-target='#datePicker'
            readOnly={true}
            value={inputValue}
            onClick={toggleDatePicker}
            disabled={loading ? loading : false}
        />
        {showDatePicker &&
            <div className='card text-right position-absolute collapsed' id='datePicker' style={{ zIndex: 1 }}>
                <div className='card-body'>
                    <DateRangePicker
                        className='border react-date-picker'
                        data-toggle='collapse'
                        scroll={{ enabled: false }}
                        direction='horizontal'
                        ranges={[dateRange]}
                        onChange={dateRangeChange}
                    />
                </div>
                <div className='card-footer text-end'>
                    <button className='btn btn-outline-secondary me-2' onClick={toggleDatePicker}>Close</button>
                    <button className='btn btn-outline-primary' onClick={onClick}>Apply</button>
                </div>
            </div>
        }</>)
}

DateRange.propTypes = {
    title: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    onDateChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
}

export default DateRange
