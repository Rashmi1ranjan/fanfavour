import React from 'react'
interface Props {
    currentPage: number,
    totalPages: number,
    contentColor?: string,
    contentFontColor?: string,
    totalItems?: number,
    totalAllItems?: number,
    itemsPerPage?: number,
    isFiltered?: boolean,
    isLoading?: boolean,
    onItemClick?: (page: number) => void
}

const Pagination: React.FC<Props> = (props) => {
    const currentPage = props.currentPage
    const totalPages = props.totalPages
    const contentColor = props.contentColor || '#fff'
    const contentFontColor = props.contentFontColor || '#000'
    const totalItems = props.totalItems || 0
    const totalAllItems = props.totalAllItems || 0
    const itemsPerPage = props.itemsPerPage || 0
    const isFiltered = props.isFiltered || false
    const isLoading = props.isLoading || false

    const addPageNumbers = (totalPages: number, currentPage: number) => {
        const numbers = []
        const pad = 3

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


    const handleClick = (page: number) => {
        if (props.onItemClick) {
            props.onItemClick(page)
        }
    }

    const numbers = addPageNumbers(totalPages, currentPage)
    const start = itemsPerPage * (currentPage - 1) + 1
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
        <div className="row align-items-center">
            <div className="ms-sm-3 mt-2 mx-auto responsive w-auto">
                {message}
            </div>
            <div className='d-sm-inline-block me-sm-3 mt-2 mx-auto w-100 w-auto'>
                <nav>
                    <ul className='pagination justify-content-end mb-0'>
                        {numbers.map((item, i) => {
                            const isActive = (currentPage === item)
                            return (
                                <li
                                    key={i}
                                    className={isActive ? isLoading ? 'page-item active disabled' : 'page-item active' : isLoading ? 'page-item disabled' : 'page-item'}
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span
                                        className="page-link"
                                        style={{
                                            backgroundColor: isActive ? '#0d6efd' : '#fff',
                                            color: isActive ? '#fff' : '#000'
                                        }}
                                        onClick={() =>
                                            isActive ? null : handleClick(item)
                                        }
                                    >
                                        {item}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
        </div>

    )
}

export default Pagination
