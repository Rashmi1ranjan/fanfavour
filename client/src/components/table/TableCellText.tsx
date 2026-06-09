import React from 'react'
import PropTypes from 'prop-types'
import { Cell } from './Definations'

const TableCellText: React.FC<Cell> = (props) => {
    let value = props.value || []

    // Convert boolean values to string so that they are visible in table
    if (value === true || value === false) {
        value = value.toString()
    }

    return (
        value
    )
}

TableCellText.propTypes = {
    value: PropTypes.any.isRequired
}

export default TableCellText
