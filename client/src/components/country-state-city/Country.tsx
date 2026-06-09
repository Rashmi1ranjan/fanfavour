import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import { getAppBaseUrl } from '../../api/api'
import { ApiResponse, CountryDetails, CoutryApiData } from '../../types/types'
const baseURL = getAppBaseUrl()

interface Props {
    rootStore: RootStore
}

const Country: React.FC<Props> = ({ rootStore }) => {
    const [allCountries, setAllCountries] = useState<CountryDetails[]>([])
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

    const getAllCountries = (filter: object) => {
        setIsLoading(true)
        axios
            .post(
                `${baseURL}/users/get_country_state_city/get_all_countries`,
                filter
            )
            .then((response: ApiResponse<CoutryApiData>) => {
                setAllCountries(response.data.countries)
                setLimit(response.data.limit)
                setTotalPages(response.data.totalPages)
                setTotalRows(response.data.totalRows)
                setCurrentPage(response.data.currentPage)
                setIsLoading(false)
            })
    }

    useEffect(() => {
        getAllCountries(filter)
    }, [])

    const changePage = (pageNUM: number) => {
        filter.page_num = pageNUM
        getAllCountries(filter)
    }

    return (
        <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
            <div className='row border-bottom py-2'>
                <div className='col-md-6'>
                    <h4>Country</h4>
                </div>
            </div>
            <div className='card-body px-0'>
                <div className='table-responsive mt-3'>
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'name', title: 'Country' },
                            { name: 'iso2', title: 'ISO 2' },
                            { name: 'iso3', title: 'ISO 3' }
                        ]}
                        data={allCountries}
                        isLoading={isLoading}
                    ></Table>
                </div>
                {allCountries.length > 0 && !isLoading ? (
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

export default observer(Country)
