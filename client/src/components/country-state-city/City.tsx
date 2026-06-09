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
import { ApiResponse, CityApiData, CityDetails } from '../../types/types'
const baseURL = getAppBaseUrl()

interface Props {
    rootStore: RootStore
}

const City: React.FC<Props> = ({ rootStore }) => {
    const [allCity, setAllCity] = useState<CityDetails[]>([])
    const [limits, setLimit] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRows, setTotalRows] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [inputCountryCode, setInputCountryCode] = useState('')
    const [inputStateCode, setInputStateCode] = useState('')

    const filter = {
        page_num: 1,
        inputCountryCode,
        inputStateCode
    }

    const getAllCities = (filter: object) => {
        setIsLoading(true)
        axios
            .post(
                `${baseURL}/users/get_country_state_city/get_all_cities`,
                filter
            )
            .then((response: ApiResponse<CityApiData>) => {
                setAllCity(response.data.allCity)
                setLimit(response.data.limit)
                setTotalPages(response.data.totalPages)
                setTotalRows(response.data.totalRows)
                setCurrentPage(response.data.currentPage)
                setIsLoading(false)
            })
    }

    useEffect(() => {
        getAllCities(filter)
    }, [])
    const TableCellStateInfo: React.FC<Cell> = (dataObject: { data: CityDetails }) => {
        const data = dataObject.data
        return (
            <>
                <span>{data.state_list.name}</span>&nbsp;
                <span>({data.state_list.state_code})</span>
            </>
        )
    }

    const TableCellCountryInfo: React.FC<Cell> = (dataObject: { data: CityDetails }) => {
        const data = dataObject.data
        return (
            <>
                <span>{data.country_list.name}</span>&nbsp;
                <span>({data.country_list.iso2})</span>
            </>
        )
    }

    const changePage = (pageNUM: number) => {
        filter.page_num = pageNUM
        getAllCities(filter)
    }
    const filterRecords = () => {
        getAllCities(filter)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='row border-bottom py-2'>
                <div className='col-md-6'>
                    <h4>City</h4>
                </div>
            </div>
            <div className='row'>
                <div className='col-md-3 mt-2'>
                    <label className='mb-2'>Country Code</label>
                    <input
                        name='countryCode'
                        type='text'
                        className='form-control'
                        value={inputCountryCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputCountryCode(e.target.value)}
                    />
                </div>
                <div className='col-md-3 mt-2'>
                    <label className='mb-2'>State Code</label>
                    <input
                        name='stateCode'
                        type='text'
                        className='form-control'
                        value={inputStateCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputStateCode(e.target.value)}
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
                            { name: 'name', title: 'City' },
                            {
                                name: 'state_list',
                                title: 'State',
                                component: TableCellStateInfo
                            },
                            {
                                name: 'country_list',
                                title: 'Country',
                                component: TableCellCountryInfo
                            }
                        ]}
                        data={allCity}
                        isLoading={isLoading}
                    ></Table>
                </div>
                {allCity.length > 0 && !isLoading ? (
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

export default observer(City)
