import React from 'react'
import { Cell } from './Definations'
import { Link, useLocation } from 'react-router-dom'

export const TableCellAction: React.FC<Cell> = (props) => {
    let value = props.value || ''
    const location = useLocation()

    // Convert boolean values to string so that they are visible in table
    if (value === true || value === false) {
        value = value.toString()
    }
    const path = location.pathname.split('/')
    return (
        <>
            <Link to={`/${path[1]}/edit/${value}`}>Edit</Link>
        </>
    )
}

export default TableCellAction