import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'

interface Props {
    rootStore: RootStore
}

const AddServer: React.FC<Props> = ({ rootStore }) => {
    const { serverStore } = rootStore
    const { setServerData, getServerDataById, editServerData, clearServerData, isLoading } = serverStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()

    useEffect(() => {
        clearServerData()
        if (id !== 'add_server') {
            getServerDataById(id)
        }
    }, [clearServerData, getServerDataById, id])

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name
        const value = e.target.value

        if (name === 'server_name') {
            editServerData.name = value
        } else if (name === 'ip_address') {
            editServerData.ip_address = value
        }
    }

    const handleSubmit = (e: any) => {
        if (editServerData.name !== '' && editServerData.ip_address !== '') {
            setServerData()
            history('/servers')
        } else {
            alert('Please fill data')
        }
    }

    if (isLoading) {
        return <>Loading</>
    }

    return <Container rootStore={rootStore} redirectIfNotLoggedIn={true}>
        <div className='row'>
            <div className='col-md-6'>
                <div className='card'>
                    <div className="card-header"> {id !== 'add_server' ? 'Edit' : 'Add'} Server</div>
                    <div className="card-body">
                        <form>
                            <div className='form-group'>
                                <label className='mt-2 mb-2'>Server Name</label>
                                <input
                                    name='server_name'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder=''
                                    value={editServerData.name}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label className='mb-2'>Ip Address </label>
                                <input
                                    name='ip_address'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder=''
                                    value={editServerData.ip_address}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='my-3 mt-2'>
                                <button type='submit' className="btn btn-primary me-3" onClick={handleSubmit} >
                                    {id !== 'add_server' ? 'Update' : 'Add'} Server
                                </button>
                                <button type='button' className="btn btn-danger" disabled={isLoading} onClick={() => {
                                    history('/servers')
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Container >
}

export default observer(AddServer)
