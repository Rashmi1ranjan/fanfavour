import React, { useEffect } from 'react'
import RootStore from '../../store/Root'
import NavBar from './NavBar'
import SideBar from './SideBar'
interface Props {
    rootStore: RootStore,
    redirectIfNotLoggedIn?: boolean
}

const DefaultContainer: React.FC<Props> = (props) => {
    const rootStore = props.rootStore

    return <>
        {rootStore.authStore.isUserLoggedIn === true && <>
            <NavBar rootstore={rootStore} />
            <SideBar rootstore={rootStore} />
        </>}
    </>
}

export default DefaultContainer
