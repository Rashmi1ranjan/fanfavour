import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

interface DateFormatProps {
    date: string
}

function DateFormat(props: DateFormatProps) {
    const { date } = props

    return (<span>{moment(date).format('YYYY-MM-DD HH:MM:SS')}</span>)
}

DateFormat.propTypes = {
    date: PropTypes.string.isRequired
}

export default DateFormat
