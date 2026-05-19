'use client'

import { useSelector } from "react-redux"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import Loader from "./Loader"
import TableCellText from './TableCellText'
import { cn } from '../../lib/utils'

export default function Table(props) {
    const shouldSort = props.shouldSort
    const onTableAction = props.onTableAction
    const defaultSort = props.defaultSort || { key: '_id', direction: 'asc' }
    const [sortConfig, setSortConfig] = useState(defaultSort)
    const isLoading = props.isLoading

    const auth = useSelector((state) => state.auth)

    const requestSort = (key) => {
        let direction = 'desc'
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc'
        }
        setSortConfig({ key, direction })
        shouldSort({ key, direction })
    }

    useEffect(() => {
        if (props.isSaveToLocalStorage === true && _.isEmpty(props.storageData) === false && isLoading === false) {
            saveDataIntoLocalStorage()
        }
    }, [props.storageData])

    useEffect(() => {
        setSortConfig(defaultSort)
    }, [props.defaultSort])

    const saveDataIntoLocalStorage = () => {
        localStorage.setItem(props.storageData.keyName, JSON.stringify(props.storageData.filter))
    }

    const columns = props.columns || []
    const data = props.data || []

    return (
        <>
            {isLoading === true &&
                <div
                    className='absolute inset-0 z-[2] flex items-center justify-center'
                    style={{ background: 'rgba(255, 255, 255, 0.67)' }}>
                    <Loader loading={true} />
                </div>}
            <table className="table" style={{ color: '#000000' }}>
                <thead>
                    <tr>
                        {columns.map((col) => {
                            let columnName = col.name
                            let className = cn(col.class || '')
                            let isSortable = _.get(col, 'sort', false)
                            return <th key={col.title}
                                style={{
                                    textDecoration: isSortable === true ? 'underline' : 'none',
                                    textUnderlinePosition: 'under',
                                    cursor: isSortable === true ? 'pointer' : 'auto'
                                }} onClick={() => {
                                    if (isSortable === false) {
                                        return
                                    }
                                    requestSort(columnName)
                                }}
                                className={className}>{col.title}{sortConfig.key === columnName ? <>{sortConfig.direction === 'asc' ? <>↓</> : <>↑</>}</> : null}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => {
                        return <tr key={row._id}>
                            {columns.map((col) => {
                                let className = cn(col.class || '')
                                let value = _.get(row, col.name, '')

                                // Convert boolean values to string so that they are visible in table
                                if (value === true || value === false || value === 0) {
                                    value = value.toString()
                                }
                                const Component = col.component || TableCellText
                                const dynamicProps = col.props || {}

                                let RenderComponent = <Component value={value} data={row} onTableAction={onTableAction} {...dynamicProps}></Component>

                                return <td key={col.name} className={className} >
                                    {RenderComponent}
                                </td>
                            })}
                        </tr>
                    })}
                </tbody >
            </table>
            {isLoading === false && (data.length === 0) ? <div className='responsive flex justify-center mb-3'>No records found</div> : null}
        </>
    )
}