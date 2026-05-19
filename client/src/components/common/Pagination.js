'use client'
import _ from 'lodash'
import { cn } from '../../lib/utils'

export default function Pagination(props) {
    let currentPage = props.currentPage ? props.currentPage : 1
    const totalPages = props.totalPages                 // This is total count of records available in database
    const contentColor = props.contentColor || '#fff'
    const contentFontColor = props.contentFontColor || '#000'
    const totalItems = props.totalItems || 0
    const totalAllItems = props.totalAllItems || 0          // This is count of records fetched after filtering the data
    const itemsPerPage = props.itemsPerPage || 0
    const isFiltered = props.isFiltered || false
    const showFirstAndLastBtn = props.showFirstAndLastBtn || false
    const isLoading = _.get(props, 'isLoading', false)

    const addPageNumbers = (totalPages, currentPage) => {
        let numbers = []
        let pad = 3

        if (currentPage <= pad) {
            for (let index = 1; index < currentPage; index++) {
                numbers.push(index)
            }
        }

        if (currentPage > pad) {
            for (let index = currentPage - pad; index < currentPage; index++) {
                numbers.push(index)
            }
        }

        numbers.push(currentPage)

        if (totalPages > currentPage) {
            for (let index = currentPage + 1; index <= totalPages; index++) {
                if (index > currentPage + pad) {
                    break
                }
                numbers.push(index)
            }
        }

        return numbers
    }


    const handleClick = (page) => {
        if (props.onItemClick) {
            props.onItemClick(page)
        }
    }

    let numbers = addPageNumbers(totalPages, currentPage)
    let start = itemsPerPage * (currentPage - 1) + 1
    let end = itemsPerPage * (currentPage)
    if (end > totalItems) {
        end = totalItems
    }

    let message = ''
    if (totalItems > 0) {
        message = `Showing ${start} to ${end} of ${totalItems} entries`
    }
    if (isFiltered) {
        message += ` (filtered from ${totalAllItems} total entries)`
    }

    return (
        <div
            className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'
            style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
        >
            {/* Message */}
            {message && (
                <div className='text-sm text-gray-600'>
                    {message}
                </div>
            )}
            {/* Pagination */}
            <ul className='flex items-center bg-gray-100 shadow-sm rounded-lg overflow-hidden text-sm font-medium'>

                {showFirstAndLastBtn && (
                    <li>
                        <button
                            disabled={currentPage === 1 || isLoading}
                            onClick={() => handleClick(1)}
                            className='px-4 py-2 border-r border-gray-300 hover:bg-[#ff1d9d]/60 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer'
                        >
                            &lt;&lt;
                        </button>
                    </li>
                )}

                {numbers.map((num) => {
                    const isActive = currentPage === num

                    return (
                        <li key={num}>
                            <button
                                disabled={isLoading}
                                onClick={() => !isActive && handleClick(num)}
                                className={cn(
                                    'px-4 py-2 border-r border-gray-300 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
                                    isActive
                                        ? 'bg-[#ff1d9d]/80 text-[#fff] font-semibold'
                                        : 'hover:bg-[#ff1d9d]/60'
                                )}
                            >
                                {num}
                            </button>
                        </li>
                    )
                })}

                {showFirstAndLastBtn && (
                    <li>
                        <button
                            disabled={currentPage === totalPages || isLoading}
                            onClick={() => handleClick(totalPages)}
                            className='px-4 py-2 hover:bg-[#ff1d9d]/60 disabled:opacity-40 disabled:cursor-not-allowed transition'
                        >
                            &gt;&gt;
                        </button>
                    </li>
                )}
            </ul>
        </div>

    )
}