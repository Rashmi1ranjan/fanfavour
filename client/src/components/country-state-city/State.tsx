import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { Cell } from './../table/Definations'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { getAppBaseUrl } from '../../api/api'
import { ApiResponse, StateApiData, StateDetails } from '../../types/types'
const baseURL = getAppBaseUrl()

interface Props {
    rootStore: RootStore
}

const State: React.FC<Props> = ({ rootStore }) => {
    const [allState, setAllState] = useState<StateDetails[]>([])
    const [limits, setLimit] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRows, setTotalRows] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [inputCountry, setInputCountry] = useState('')

    const filter = {
        page_num: 1,
        inputCountry
    }

    const getAllState = (filter: object) => {
        setIsLoading(true)
        axios
            .post(
                `${baseURL}/users/get_country_state_city/get_all_state`,
                filter
            )
            .then((response: ApiResponse<StateApiData>) => {
                setAllState(response.data.allState)
                setLimit(response.data.limit)
                setTotalPages(response.data.totalPages)
                setTotalRows(response.data.totalRows)
                setCurrentPage(response.data.currentPage)
                setIsLoading(false)
            })
    }

    useEffect(() => {
        getAllState(filter)
    }, [])

    const TableCellCountryInfo: React.FC<Cell> = (dataObject: { data: StateDetails }) => {
        const data = dataObject.data
        return (
            <>
                <span>{data.countryDetails.name}</span>&nbsp;
                <span>({data.countryDetails.iso2})</span>
            </>
        )
    }

    const changePage = (pageNUM: number) => {
        filter.page_num = pageNUM
        getAllState(filter)
    }
    const filterRecords = () => {
        getAllState(filter)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='row border-bottom py-2'>
                <div className='col-md-6'>
                    <h4>State</h4>
                </div>
            </div>
            <div className='row'>
                <div className='col-md-3 mt-2'>
                    <label className='mb-2'>Country Code</label>
                    <input
                        name='country'
                        type='text'
                        className='form-control'
                        value={inputCountry}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputCountry(e.target.value)}
                    />
                </div>

                <div className='col-md-3 mt-3'>
                    <button
                        type='button'
                        className='btn btn-primary mt-4'
                        onClick={filterRecords}
                        disabled={isLoading}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className='card-body px-0'>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'State' },
                            { name: 'state_code', title: 'State Code' },
                            {
                                name: 'database',
                                title: 'Country',
                                component: TableCellCountryInfo
                            }
                        ]}
                        data={allState}
                        isLoading={isLoading}
                    ></Table>
                </div>
                {allState.length > 0 && !isLoading ? (
                    <Pagination
                        totalPages={totalPages}
                        currentPage={currentPage}
                        totalItems={totalRows}
                        itemsPerPage={limits}
                        onItemClick={changePage}
                    ></Pagination>
                ) : null}
            </div>
        </Container>
    )
}

export default observer(State)
