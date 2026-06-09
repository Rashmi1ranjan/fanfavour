import React from 'react'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'
import { Navigate } from 'react-router-dom'
interface Props {
    rootStore: RootStore,
    redirectIfNotLoggedIn?: boolean,
    children: React.ReactNode
}

const Container: React.FC<Props> = (props) => {
    const rootStore = props.rootStore
    if (props.redirectIfNotLoggedIn === true) {
        if (rootStore.authStore.isUserLoggedIn === false) {
            return <Navigate to="/login" />
        }
    }

    return <div className='container-fluid'>
        <div className='row'>
            <main className='offset-lg-2 offset-md-3 col-md-9 ms-sm-auto col-lg-10 px-md-4 mt-3 '>
                {props.children}
            </main>
        </div>
    </div>
}

export default observer(Container)
