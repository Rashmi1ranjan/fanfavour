import React from 'react'
import RootStore from '../store/Root'
import DefaultLayout from './layout/DefaultLayout'
import { Link } from 'react-router-dom'

interface Props {
    rootStore: RootStore
}

const PageNotFound: React.FC<Props> = ({ rootStore }) => {
    return <DefaultLayout rootStore={rootStore}>
        <div className="card">
            <div className="card-header">
            </div>
            <div className="card-body">
                <div className='row justify-content-md-center pt-5'>
                    <div className='col col col-md-4'>
                        <h5 className="card-title">404</h5>
                        <p className="card-text">Page Not Found</p>
                        <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                    </div>
                </div>
            </div>
        </div>
    </DefaultLayout>
}

export default PageNotFound
