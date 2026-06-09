import React, { useEffect, useMemo, useState } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate, NavLink, useParams } from 'react-router-dom'
import _ from 'lodash'
import { useForm } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import styled from 'styled-components'

interface Props {
    rootStore: RootStore
}

const BackLink = styled.div`
    a, a: hover {
        color: var(--bs-body-bg);
        text-decoration: none
    }
`

const EditBlockUser: React.FC<Props> = ({ rootStore }) => {
    const { BlockUserStore } = rootStore
    const { getAllBlockCodeOption, clearBlockUserData, editBlockUser, setBlockCodeDetailById, AddBlockUserData, isLoading, BlockCodeData } = BlockUserStore
    const history = useNavigate()
    const { id } = useParams<string>()
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [existDomain, setExistDomain] = useState(editBlockUser.domain_id)
    useEffect(() => {
        clearBlockUserData()
        getAllBlockCodeOption()
        if (id) {
            setBlockCodeDetailById(id)
        }
    }, [])

    const blockCodeOptions = useMemo(() => {
        const domainData = BlockCodeData.map((website) => {
            return {
                id: website._id,
                message: website.message
            }
        })
        return domainData.map((website) => {
            return <option key={website.id} value={website.id}>{website.message}</option>
        })
    }, [BlockCodeData])

    const onSubmit = (data: any) => {
        editBlockUser.domain_id = Number(data.domain)
        AddBlockUserData(history)
    }

    if (isLoading) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-12'>
                <div className='card'>
                    <div className="card-header">
                        <BackLink>
                            <NavLink to="/block-user-list" >
                                <FontAwesomeIcon icon={faChevronLeft} className='me-2' />Edit Block User
                            </NavLink>
                        </BackLink>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='form-group'>
                                <label className='mb-2'>Select Domain</label>
                                <select
                                    className='form-control form-select mb-2'
                                    id='domain'
                                    disabled={existDomain === 0 ? true : false}
                                    defaultValue={editBlockUser.domain_id}
                                    ref={register({})}
                                >
                                    <option key={0} value={0}>
                                        All
                                    </option>
                                </select>
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Select Type</label>
                                <select
                                    className='form-control form-select mb-2'
                                    id='type'
                                    name='type'
                                    defaultValue={editBlockUser.type}
                                    ref={register({})}
                                    disabled={true}
                                >
                                    <option key={0} value={0}>
                                        Email
                                    </option>
                                    <option key={1} value={1}>
                                        Card
                                    </option>
                                </select>
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Field</label>
                                <input
                                    name='field'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder='Email or card id'
                                    defaultValue={editBlockUser.field}
                                    ref={register({
                                        required: 'Please enter field value'
                                    })}
                                    disabled={true}
                                />
                                {(errors.field) && <p className="text-danger">{errors.field.message}</p>}
                            </div>
                            <div className='form-group mb-4'>
                                <label className='mb-2'>Select Block Reason</label>
                                <select
                                    className='form-control form-select mb-2'
                                    id='block_code_id'
                                    name='block_code_id'
                                    defaultValue={editBlockUser.block_code_id}
                                    ref={register({})}
                                    disabled={true}
                                >
                                    {blockCodeOptions}
                                </select>
                            </div>
                            <button type='submit' disabled={isLoading || existDomain === 0 ? true : false} className="btn btn-primary me-2">Block User</button>
                            <NavLink className="ms-2 btn btn-outline-primary" to="/block-user-list" style={{ textAlign: 'right' }} >Cancel</NavLink>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container>
}

export default observer(EditBlockUser)
