import React, { useState } from 'react'
import _ from 'lodash'
import TableCellText from './TableCellText'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'
import { Cell } from '../../types/types'

interface Column {
    name: string,
    title: string,
    class?: string,
    component?: React.FC<Cell>,
    sort?: boolean
}

interface SortConfig {
    key: string,
    direction: string
}

interface Props {
    unique_key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Array<any>
    columns: Array<Column>
    shouldSort?: (sortConfig: SortConfig) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTableAction?: (action: string, value: any, data: any) => void
    isLoading?: boolean
    defaultSort?: SortConfig
}

const Table: React.FC<Props> = (props) => {
    const shouldSort = props.shouldSort
    const onTableAction = props.onTableAction
    const isLoading = props.isLoading ? props.isLoading : false
    const defaultSort = props.defaultSort || { key: '_id', direction: 'asc' }
    const [sortConfig, setSortConfig] = useState(defaultSort)

    const requestSort = (key: string) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const firstUpdate = React.useRef(true)
    React.useEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false
            return
        }
        if (shouldSort) {
            shouldSort(sortConfig)
        }
    }, [sortConfig])

    const columns = props.columns || []
    const data = props.data || []
    const unique_key = props.unique_key || '_id'

    return (
        <div>
            <table className="table table-bordered table-hover table-sm">
                <thead>
                    <tr>
                        {columns.map((col) => {
                            const columnName = col.name
                            const key = uuidv4()
                            const isSortable = _.get(col, 'sort', false)
                            return <th key={key} style={{
                                textDecoration: isSortable === true ? 'underline' : 'none',
                                textUnderlinePosition: 'under',
                                cursor: isSortable === true ? 'pointer' : 'auto'
                            }} onClick={() => {
                                if (isSortable === false) {
                                    return
                                }
                                requestSort(columnName)
                            }}>{col.title}{sortConfig.key === columnName ? <>{sortConfig.direction === 'asc' ? <>↓</> : <>↑</>}</> : null}</th>
                        })}
                    </tr>
                </thead>
                <tbody style={{ position: 'relative' }} className='card-img-overlay'>
                    {isLoading === true ?
                        <tr>
                            <td colSpan={columns.length}>
                                <div className='col-12 text-center d-block'>
                                    <div className='spinner-border' role='status'>
                                        <span className='sr-only'>Loading...</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        : data.map((row) => {
                            return <tr key={uuidv4()}>
                                {columns.map((col) => {
                                    const key = uuidv4()
                                    const className = col.class ? col.class : ''
                                    const columnName = col.name
                                    const component = col.component
                                    let value = _.get(row, col.name, '')

                                    // Convert boolean values to string so that they are visible in table
                                    if (value === true || value === false || value === 0) {
                                        value = value.toString()
                                    }

                                    const Component = component || TableCellText
                                    const RenderComponent = <Component value={value} data={row} onTableAction={onTableAction}></Component>

                                    return <td key={key} className={className} >
                                        {RenderComponent}
                                    </td>
                                })}
                            </tr>
                        })}

                </tbody>
            </table>
            {(data.length === 0 && isLoading === false) ? <div className='responsive d-flex justify-content-center mb-3'>No records found</div> : null}
        </div>
    )
}

export default Table
