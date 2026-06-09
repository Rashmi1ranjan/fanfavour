import React, { useEffect, useMemo, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, NavLink } from 'react-router-dom'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import Select from 'react-select'
import { ValueType } from 'react-select/src/types'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { OptionType } from '../../types/types'
import styled from 'styled-components'

const CancelButton = styled.a<{ loading?: boolean }>`
    pointer-events: ${props => props.loading ? 'none' : 'auto'} !important;
    cursor: pointer;
    text-align: center;
    color: ${props => props.loading ? 'hsl(0, 0%, 50%)' : ''} !important;
`

const RadioInput = styled.input`
    border: 1px solid #8d8f91;
`

interface Props {
    rootStore: RootStore
}

const AddBlockUser: React.FC<Props> = ({ rootStore }) => {
    const { BlockUserStore, websiteStore } = rootStore
    const { getAllBlockCodeOption, editBlockUser, AddBlockUserData, BlockCodeData, isLoading } = BlockUserStore
    const { getWebsitesData, websiteData } = websiteStore
    const { register, handleSubmit, formState: { errors } } = useForm()
    const history = useNavigate()
    const [sourceDomain, setSourceDomain] = useState<string>('-1')
    const [domain, setDomain] = useState<string>('0')
    const [fieldType, setFieldType] = useState('0')
    const [cardNameSelectedDomain, setCardNameSelectedDomain] = useState('0')

    useEffect(() => {
        getAllBlockCodeOption()
        getWebsitesData()
    }, [])

    const blockCodeOptions = useMemo(() => {
        const blockCode = BlockCodeData.map((block) => {
            return {
                id: block._id,
                message: block.message
            }
        })
        return blockCode.map((block) => {
            return <option key={block.id} value={block.id}>{block.message}</option>
        })
    }, [BlockCodeData])

    const onSubmit = (data: { field: string, block_code_id: string, type: string }) => {
        if (sourceDomain.trim() === '') {
            toast.error('Please select source domain.')
            return
        }

        if (domain.trim() === '' || (fieldType === '2' && cardNameSelectedDomain === '0')) {
            toast.error('Please select domain.')
            return
        }
        if (data.field.trim() === '') {
            if (Number(data.type) === 1) {
                toast.error('Card Id can not be empty.')
                return
            }
            if (Number(data.type) === 2) {
                toast.error('Card Name can not be empty.')
                return
            }
            toast.error('Email can not be empty.')
            return
        }

        if (Number(data.type) === 0 && !/^(([^<>()\]\\.,;:\s@']+(\.[^<>()\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(data.field)) {
            toast.error('Please enter valid email.')
            return
        }
        const pattern = /^[0-9a-fA-F]{24}$|^[0-9a-fA-F]{64}$/
        if (Number(data.type) === 1 && !pattern.test(data.field)) {
            toast.error('Please enter valid card id.')
            return
        }

        if (data.block_code_id === '') {
            toast.error('Please add block code.')
            return
        }
        editBlockUser.block_code_id = data.block_code_id
        editBlockUser.domain_id = Number(domain)
        editBlockUser.field = data.field.trim()
        editBlockUser.type = Number(data.type)
        editBlockUser.source_domain = Number(sourceDomain)
        if (editBlockUser.type === 0) {
            editBlockUser.field = editBlockUser.field?.toLowerCase()
        }
        AddBlockUserData(history)
    }

    const handleChange = (value: ValueType<OptionType, false>) => {
        const selectedValue = _.get(value, 'value', '')
        setSourceDomain(selectedValue)
    }

    const handleDomainChange = (value: ValueType<OptionType, false>) => {
        const selectedValue = _.get(value, 'value', '')
        setDomain(selectedValue)
        setCardNameSelectedDomain(selectedValue)
    }

    const options: OptionType[] = []

    const websiteOptions: OptionType[] = websiteData.map((option: { website_url: string, website_id: number }, index: number) => (
        { label: `${index + 1}. ${option.website_url}`, value: option.website_id.toString() }
    ))
    options.push(...websiteOptions)

    const selectedOption = _.find(options, (item: OptionType) => {
        return item.value === sourceDomain
    })

    let domainOptions: OptionType[] = [
        { label: 'All', value: '0' }
    ]

    let selectedDomain
    if (fieldType === '2') {
        domainOptions = options
        selectedDomain = _.find(domainOptions, (item: OptionType) => {
            return item.value === cardNameSelectedDomain
        })
    } else {
        domainOptions.push(...websiteOptions)
        selectedDomain = _.find(domainOptions, (item: OptionType) => {
            return item.value === domain
        })
    }

    const handleChangeFieldType = (e: any) => {
        setFieldType(e.target.value)
        if (e.target.value === '2') {
            const selectedDomain = cardNameSelectedDomain !== '0' ? cardNameSelectedDomain : domain
            setCardNameSelectedDomain(selectedDomain)
        } else {
            setDomain('0')
        }
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row border-bottom mb-3'>
            <div className='col-md-6'>
                <h4 className='card-title'>Add Block User</h4>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </div>
            <div className='col-md-6'>
                <NavLink className="float-end" to="/block-user-list" >Back</NavLink>
            </div>
        </div>
        <div className='row'>
            <div className='col-md-12'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='form-group'>
                        <label className='mb-2'>Select Domain</label>
                        <Select
                            value={selectedDomain}
                            onChange={handleDomainChange}
                            options={domainOptions}
                            isMulti={false}
                            className='mb-3'
                            name='domain'
                        />
                    </div>
                    <div className='form-group'>
                        <label className='mb-2'>Select Domain Source</label>
                        <Select
                            name='source_domain'
                            value={selectedOption}
                            onChange={handleChange}
                            options={options}
                            isMulti={false}
                            className='mb-3'
                        />
                    </div>
                    <div className='form-group'>
                        <label className='mb-2 me-2'>Select Type</label>
                        <div className='form-check form-check-inline'>
                            <RadioInput
                                className='form-check-input'
                                type='radio'
                                name='type'
                                id='inlineRadio1'
                                value='0'
                                onChange={handleChangeFieldType}
                                checked={fieldType === '0'}
                                ref={register({})}
                            />
                            <label className='form-check-label' htmlFor='inlineRadio1'>Email</label>
                        </div>
                        <div className='form-check form-check-inline'>
                            <RadioInput
                                className='form-check-input'
                                type='radio'
                                name='type'
                                id='inlineRadio2'
                                value='1'
                                onChange={handleChangeFieldType}
                                checked={fieldType === '1'}
                                ref={register({})}
                            />
                            <label className='form-check-label' htmlFor='inlineRadio2'>Card Id</label>
                        </div>
                        <div className='form-check form-check-inline'>
                            <RadioInput
                                className='form-check-input'
                                type='radio'
                                name='type'
                                id='inlineRadio3'
                                value='2'
                                checked={fieldType === '2'}
                                onChange={handleChangeFieldType}
                                ref={register()}
                            />
                            <label className='form-check-label' htmlFor='inlineRadio3'>Card Name</label>
                        </div>

                    </div>
                    <div className='form-group'>
                        <label className='mb-2'>{fieldType === '1' ? 'Card Id' : fieldType === '2' ? 'Card Name' : 'Email'}</label>
                        <input
                            name='field'
                            type='text'
                            className='form-control mb-3'
                            placeholder={fieldType === '1' ? 'Card Id' : fieldType === '2' ? 'Card Name' : 'Email'}
                            ref={register({
                                required: 'Please enter field value'
                            })}
                        />
                        {(errors.field) && <p className="text-danger">{errors.field.message}</p>}
                    </div>
                    <div className='form-group mb-4'>
                        <label className='mb-2'>Select Block Reason</label>
                        <select
                            className='form-control form-select mb-2'
                            id='block_code_id'
                            name='block_code_id'
                            ref={register({})}
                        >
                            {blockCodeOptions}
                        </select>
                    </div>
                    <button type='submit' disabled={isLoading} className="btn btn-primary me-2">Save</button>
                    <NavLink className="ms-2 btn btn-outline-primary" to="/block-user-list" style={{ textAlign: 'right' }} >Cancel</NavLink>
                </form>
            </div>
        </div>
    </Container>
}

export default observer(AddBlockUser)
