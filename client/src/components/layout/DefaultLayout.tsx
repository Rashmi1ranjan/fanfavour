import React from 'react'
import NavBar from './NavBar'
import RootStore from '../../store/Root'
import { Navigate } from 'react-router-dom'

interface Props {
    rootStore: RootStore,
    redirectIfNotLoggedIn?: boolean
    children: React.ReactNode
}

const DefaultLayout: React.FC<Props> = (props) => {
    const rootStore = props.rootStore
    if (props.redirectIfNotLoggedIn === true) {
        if (rootStore.authStore.isUserLoggedIn === false) {
            return <Navigate to="/login" />
        }
    }

    return <>
        <NavBar rootstore={props.rootStore} />
        <div className='container-fluid'>
            {props.children}
        </div>
    </>
}

export default DefaultLayout
