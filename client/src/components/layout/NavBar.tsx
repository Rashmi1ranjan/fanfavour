import React, { useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSignOutAlt, faSun } from '@fortawesome/free-solid-svg-icons'
import _ from 'lodash'
import RootStore from '../../store/Root'
import { observer } from 'mobx-react'

interface Props {
    rootstore: RootStore
}

const NavBar: React.FC<Props> = ({ rootstore }) => {
    const { authStore } = rootstore
    const { theme, setTheme } = authStore

    useEffect(() => {
        const theme = _.isEmpty(localStorage.getItem('theme')) ? 'light' : localStorage.getItem('theme')
        setTheme(theme)
    }, [])

    const doLogout = () => {
        rootstore.authStore.authToken = ''
        rootstore.sideMenuStore.scrollPosition = 0
        rootstore.authStore.logout()
    }

    const toggle = () => {
        rootstore.navStore.collapse = !rootstore.navStore.collapse
    }
    const { isUserLoggedIn, userMfaStatus, isLoading } = rootstore.authStore

    return <>
        <nav className='navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow'>
            <NavLink className='navbar-brand col-md-3 col-lg-2 me-0 px-3' to='/dashboard'>PCP</NavLink>
            <button
                className='navbar-toggler position-absolute d-md-none collapsed'
                type='button'
                data-toggle='collapse'
                aria-controls='sidebarMenu'
                aria-expanded='false'
                aria-label='Toggle navigation'
                onClick={toggle}
            >
                <span className='navbar-toggler-icon'></span>
            </button>

            <ul
                className='align-items-md-end d-block d-md-flex navbar-nav px-md-3 py-2 w-100 flex-row'
                style={{ justifyContent: 'flex-end' }}
            >
                {theme !== 'dark' ?
                    <li
                        onClick={() => setTheme('dark')}
                        style={{ cursor: 'pointer' }}
                    >
                        <FontAwesomeIcon className='align-items-end' icon={faMoon} color='white' />
                    </li>
                    :
                    <li
                        onClick={() => setTheme('light')}
                        style={{ cursor: 'pointer' }}
                    >
                        <FontAwesomeIcon className='align-items-end' icon={faSun} color='white' />
                    </li>
                }
                <li className={classNames('nav-item ps-4', { 'd-none': !isUserLoggedIn })}>
                    <Link
                        to='#'
                        style={{ color: '#fff' }}
                        className='text-decoration-none'
                        onClick={doLogout}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />&nbsp;&nbsp;Sign out
                    </Link>
                </li>
            </ul>
        </nav>
        {
            (isUserLoggedIn === true && userMfaStatus === false && isLoading === false) &&
            <div className='container-fluid'>
                <div className='row'>
                    <div className='col-md-3 col-lg-2 d-md-block'></div>
                    <div className='col-md-9 col-lg-10'>
                        <div className='responsive alert alert-danger p-3 my-3 rounded'>
                            MFA is disabled on your account. <Link className='text-decoration-none' to='/mfa_setting'>Click here</Link> to enable
                        </div>
                    </div>
                </div>
            </div>
        }
    </>
}

export default observer(NavBar)
