import React, { useEffect, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWindowClose, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import Container from '../layout/Container'
import Table from '../table/Table'
import Pagination from '../table/Pagination'
import moment from 'moment'
import Domain from '../layout/Domain'
import _ from 'lodash'
import { ValueType } from 'react-select/src/types'
import { OptionType, StickyIOCharge, WebsiteCommissionDetail } from '../../types/types'

interface Props {
    rootStore: RootStore
}

type IsMulti = boolean

const WebsiteCommission: React.FC<Props> = ({ rootStore }) => {
    const { websiteStore } = rootStore
    const { getWebsitesData, getWebsiteCommissionDate, websiteData, websiteCommissionData, currentPage, totalPage, limit, totalRows, setWebsiteCommissionDetail, websiteCommissionDetail } = websiteStore
    const [selectedWebsite, setSelectedWebsite] = useState<string>('')
    const [showViewModel, setShowViewModel] = useState(false)
    useEffect(() => {
        getWebsitesData()
        getWebsiteCommissionDate(1, {})
    }, [getWebsitesData, getWebsiteCommissionDate])

    const changePage = (pageNUM: number) => {
        getWebsiteCommissionDate(pageNUM, { domain: selectedWebsite })
    }

    const handleChange = (value: ValueType<OptionType, IsMulti>) => {
        const selectedValue = _.get(value, 'value', '')
        setSelectedWebsite(selectedValue)
        getWebsiteCommissionDate(currentPage, { domain: selectedValue })
    }

    const tableCellButton = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        return (
            <div onClick={() => { viewDetail(jsonData) }}><FontAwesomeIcon icon={faInfoCircle} /></div>
        )
    }

    const TableCellObject = (objData: object) => {
        const data = _.get(objData, 'data', {})
        const jsonData = JSON.parse(JSON.stringify(data))
        const target_date = _.get(jsonData, 'target_date', false)
        const converted_target_date = target_date ? moment(target_date).format('MM/DD/YYYY') : ''
        return <>{converted_target_date}</>
    }

    const viewDetail = (data: WebsiteCommissionDetail) => {
        setWebsiteCommissionDetail(data)
        setShowViewModel(true)
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <h4 className="card-title">Website Commissions</h4>
        <div className="card">
            <div className="card-body">
                <div className='row'>
                    <div className='col-md-4'>
                        <label className='me-2 mb-2'>Domain</label>
                        <Domain
                            onDomainChange={handleChange}
                            websiteStore={websiteStore}
                            defaultDomain={selectedWebsite}
                            multiSelect={false}
                        />
                    </div>
                </div>
            </div>
        </div>
        <div className='row'>
            <div className='col my-3'>
                <div className='table-responsive' >
                    <Table
                        unique_key='_id'
                        columns={[
                            { name: 'website.website_id', title: 'Id' },
                            { name: 'domain', title: 'Domain' },
                            { name: 'payment_gateway', title: 'Payment Gateway' },
                            { name: 'platform_commission', title: 'Platform Commission' },
                            { name: 'ccbill_fees', title: 'CCBill Fees' },
                            { name: 'ccbill_transaction_charge', title: 'CCBill Per Transaction Charge' },
                            { name: 'sticky_io_transaction_charge', title: 'Sticky.io Charge' },
                            { name: 'forumpay_transaction_charge', title: 'Forumpay Charge' },
                            { name: 'target_date', title: 'Date', component: TableCellObject },
                            { name: 'action', title: 'View Commission', component: tableCellButton }
                        ]}
                        data={websiteCommissionData}
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
        {showViewModel ?
            <div className='modal fade show' role='dialog' style={{ display: 'block', backgroundColor: '#00000080' }
            }>
                <div className='modal-dialog modal-dialog-scrollable modal-lg'>
                    <div className='modal-content'>
                        <div className='modal-header' style={{ justifyContent: 'space-between' }}>
                            <h5 className='modal-title'>{websiteCommissionDetail.domain} Commissions for sticky.io payment gateway</h5>
                            <div onClick={() => setShowViewModel(false)} style={{ cursor: 'pointer' }}>
                                <FontAwesomeIcon icon={faWindowClose} />
                            </div>
                        </div>

                        <div className='modal-body'>
                            {(websiteCommissionDetail.sticky_io_charges !== undefined) ?
                                websiteCommissionDetail.sticky_io_charges.map((charge: StickyIOCharge, index: number) => {
                                    return <table className="table table-sm table-bordered table-hover mt-4" key={index}>
                                        <tbody>
                                            <tr>
                                                <th colSpan={3} className='text-center'>Payment Gateway: {charge.payment_gateway}</th>
                                            </tr>
                                            <tr>
                                                <th className="col-md-4">Transaction Type</th>
                                                <th className="col-md-4">Fixed Charge ($)</th>
                                                <th className="col-md-4">Percentage Charge (%)</th>
                                            </tr>
                                            <tr>
                                                <td>Model Charge</td>
                                                <td>{charge.model_per_transaction_fixed_charge}</td>
                                                <td>{charge.model_per_transaction_percentage_charge}</td>
                                            </tr>
                                            <tr>
                                                <td>New Transaction Charge</td>
                                                <td>{charge.new_per_transaction_fixed_charge}</td>
                                                <td>{charge.new_per_transaction_percentage_charge}</td>
                                            </tr>
                                            <tr>
                                                <td>Void Transaction Charge</td>
                                                <td>{charge.void_per_transaction_fixed_charge}</td>
                                                <td>{charge.void_per_transaction_percentage_charge}</td>
                                            </tr>
                                            <tr>
                                                <td>Refund Transaction Charge</td>
                                                <td>{charge.refund_per_transaction_fixed_charge}</td>
                                                <td>{charge.refund_per_transaction_percentage_charge}</td>
                                            </tr>
                                            <tr>
                                                <td>Decline Transaction Charge</td>
                                                <td>{charge.declined_per_transaction_fixed_charge}</td>
                                                <td>{charge.declined_per_transaction_percentage_charge}</td>
                                            </tr>
                                            <tr>
                                                <td>Chargeback Penalty</td>
                                                <td>{charge.chargeback_penalty}</td>
                                                <td>0</td>
                                            </tr>
                                            <tr>
                                                <td>Notes</td>
                                                <td colSpan={2}>{charge.notes}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                }) : <>
                                    <div><strong>Model Fixed Charge: </strong>{websiteCommissionDetail.sticky_io_fixed_fees}</div>
                                    <div><strong>New Transaction: </strong>{websiteCommissionDetail.sticky_io_new_transaction_fix_charge}</div>
                                    <div><strong>Refund/Void Transaction: </strong>{websiteCommissionDetail.sticky_io_void_refund_transaction_fix_charge}</div>
                                    <div><strong>Declined Transaction: </strong>{websiteCommissionDetail.sticky_io_decline_transaction_fix_charge}</div>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div > : null}
    </Container>
}

export default observer(WebsiteCommission)
