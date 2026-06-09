import React from 'react'
import { Cell } from './Definations'

export const TableCellActiveInactive: React.FC<Cell> = (props) => {
    let value = props.value
    const status = (value === 0) ? 'Inactive' : 'Active'
    return (
        <>
            {status}
        </>
    )
}

export default TableCellActiveInactive
