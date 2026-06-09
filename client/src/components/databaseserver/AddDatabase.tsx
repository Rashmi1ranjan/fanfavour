import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import Container from '../layout/Container'
import { useNavigate } from 'react-router-dom'

interface Props {
    rootStore: RootStore
}

const AddDatabase: React.FC<Props> = ({ rootStore }) => {
    const { databaseStore } = rootStore
    const { setDatabaseData, getDatabaseDataById, editDatabaseData, isLoading } = databaseStore
    const currentRoute = window.location.pathname.split('/')
    const id = currentRoute[currentRoute.length - 1]
    const history = useNavigate()

    useEffect(() => {
        if (id !== 'add_database') {
            getDatabaseDataById(id)
        }
    }, [getDatabaseDataById, id])

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        editDatabaseData.name = value
    }

    const handleSubmit = () => {
        if (editDatabaseData.name !== '') {
            setDatabaseData()
            history('/databases')
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
                    <div className="card-header">{id !== 'add_database' ? 'Edit' : 'Add'} Database</div>
                    <div className="card-body">
                        <form>
                            <div className='form-group'>
                                <label className='mb-3'>Database Name</label>
                                <input
                                    name='database_name'
                                    type='text'
                                    className='form-control mb-3'
                                    placeholder=''
                                    value={editDatabaseData.name}
                                    onChange={onChange}
                                />
                            </div>
                            <div className='my-3 mt-2'>
                                <button type='submit' className="btn btn-primary me-3" onClick={handleSubmit} >
                                    {id !== 'add_database' ? 'Update' : 'Add'} Database
                                </button>
                                <button type='button' className="btn btn-danger" disabled={isLoading} onClick={() => {
                                    history('/databases')
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

export default observer(AddDatabase)
