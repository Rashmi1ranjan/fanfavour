import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import { NavLink } from 'react-router-dom'
import moment from 'moment'
import _ from 'lodash'
import { ActionMeta, ValueType } from 'react-select/src/types'
import Domain from '../layout/Domain'
import { OptionType } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const WebsiteReferralHistory: React.FC<Props> = ({ rootStore }) => {
    const { websiteReferralHistory, websiteStore } = rootStore
    const { getWebsiteReferralHistoryData, websiteReferralHistoryData, currentPage, totalPage, limit, totalRows, clearWebsiteData, isLoading } = websiteReferralHistory
    const [selectedWebsite, setSelectedWebsite] = useState<string>('all')
    useEffect(() => {
        clearWebsiteData()
        getWebsiteReferralHistoryData(1, {})
    }, [getWebsiteReferralHistoryData, clearWebsiteData])

    const changePage = (pageNUM: number) => {
        getWebsiteReferralHistoryData(pageNUM, { domain: selectedWebsite })
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>) => {
        const selectedValue = _.get(value, 'value', '')
        setSelectedWebsite(selectedValue)
        getWebsiteReferralHistoryData(1, { domain: selectedValue })
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const currentDate = moment().format('YYYY-MM-DDT00:00:00')
        const targetDate = moment(jsonData.target_date).format('YYYY-MM-DDT00:00:00')
        if (currentDate === targetDate) {
            const Url = '/edit_website_referral/' + jsonData._id
            return (<>
                <NavLink className="link-primary text-underline" to={Url} >Edit</NavLink>
            </>)
        } else {
            return (<></>)
        }
    }

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    const TableCellObject = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const target_date = _.get(jsonData, 'target_date', false)
        const converted_target_date = target_date ? moment(target_date).format('MM/DD/YYYY') : ''
        return <>{converted_target_date}</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className="d-flex justify-content-between align-items-center">
            <h4>Website Referral History</h4>
            <NavLink className="float-end text-decoration-none px-2" to="/add_website_referral">Add Website Referral</NavLink>
        </div>
        <div className="card">
            <div className="card-body">
                <div className='row'>
                    <div className='col-md-3'>
                        <label className='mb-2'>Domain</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            defaultDomain={selectedWebsite}
                            multiSelect={false}
                            requestFrom='referral_history'
                        />
                    </div>
                </div>
                <div className='row'>
                    <div className='col mt-3'>
                        <div className='table-responsive' >
                            <Table
                                unique_key='_id'
                                columns={[
                                    { name: 'website.website_id', title: 'Id' },
                                    { name: 'domain', title: 'Domain' },
                                    { name: 'total_referral', title: 'Total referral' },
                                    { name: 'referral_type', title: 'Referral type1' },
                                    { name: 'referral_name', title: 'Referral name1' },
                                    { name: 'referral_commission', title: 'Referral commission1' },
                                    { name: 'referral_type1', title: 'Referral type2' },
                                    { name: 'referral_name1', title: 'Referral name2' },
                                    { name: 'referral_commission1', title: 'Referral commission2' },
                                    { name: 'referral_type2', title: 'Referral type3' },
                                    { name: 'referral_name2', title: 'Referral name3' },
                                    { name: 'referral_commission2', title: 'Referral commission3' },
                                    { name: 'target_date', title: 'Target Date', component: TableCellObject },
                                    { name: 'action', title: 'Actions', component: tableCellButton }
                                ]}
                                data={websiteReferralHistoryData}
                                isLoading={isLoading}
                            ></Table>
                        </div>
                        <Pagination
                            totalPages={totalPage}
                            currentPage={currentPage}
                            totalItems={totalRows}
                            itemsPerPage={limit}
                            onItemClick={changePage}
                        ></Pagination>
                    </div>
                </div>

            </div>
        </div>
    </Container>
}

export default observer(WebsiteReferralHistory)

