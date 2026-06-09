import React, { useState, useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import RootStore from '../../store/Root'
import classNames from 'classnames'
import './sidebar.css'
import { observer } from 'mobx-react'
import { MenuItem, MenuSection } from '../../types/types'

interface Props {
    rootstore: RootStore
}

const sideMenusForSuperAdmins = [
    {
        title: 'Statistics',
        menus: [
            { to: '/dashboard', name: 'Dashboard' },
            { to: '/earning-dashboard', name: 'Earning Dashboard' },
            { to: '/subscription-statistics', name: 'Subscription Statistics' },
            { to: '/website/cron-status', name: 'Website Cron Status' },
            { to: '/email', name: 'Email' }
        ]
    },
    {
        title: 'Earning Report',
        menus: [
            { to: '/export-monthly-earning-reports', name: 'Export Monthly Earning Report' },
            { to: '/dailyearningreport', name: 'Daily Earning Report' },
            { to: '/monthly-earning-reports', name: 'Monthly Earning Report' },
            { to: '/website-referral-monthly-earning-report', name: 'Referral Monthly Earning Report' },
            { to: '/link-tracking-website-referral-monthly-earning-report', name: 'Link Tracking Referral Monthly Earning Report' }
        ]
    },
    {
        title: 'Universal Login',
        menus: [
            { to: '/universal-login-logs', name: 'Logs' },
            { to: '/universal-login-users', name: 'Users' },
            { to: '/all-website-users', name: 'All Website Users' },
            { to: '/universal-login-cards', name: 'Cards' },
            { to: '/universal-login-statistics', name: 'Statistics' }
        ]
    },
    {
        title: 'Link Tracking',
        menus: [
            { to: '/analytics/link-tracking', name: 'Link Tracking Referral Analytics' }
        ]
    },
    {
        title: 'OneSignal',
        menus: [
            { to: '/one-signal-analytics', name: 'OneSignal Analytics' }
        ]
    },
    {
        title: 'Hybrid Payment',
        menus: [
            { to: '/hybrid-transaction-summary', name: 'Transaction Summary' },
            { to: '/hybrid-transaction-log-list', name: 'Transaction Logs' }
        ]
    },
    {
        title: 'Crypto Payment',
        menus: [
            { to: '/forumpay-transaction-history', name: 'Transaction History' },
            { to: '/forumpay-webhook-logs', name: 'Webhook Logs' },
            { to: '/user-wallet-balance', name: 'User Wallet Balance' },
            { to: '/wallet-transaction-reports', name: 'Wallet Transaction Reports' },
            { to: '/forumpay-transaction-statistics', name: 'Transaction Statistics' }
        ]
    },
    {
        title: 'Reports & Analytics',
        menus: [
            { to: '/ccbill_summary_report', name: 'CCBill Summary Report' },
            { to: '/analytics/user_count', name: 'User Count Analytics' },
            { to: '/analytics/export', name: 'Monthly Analytics Report' },
            { to: '/analytics/revenue/export', name: 'Monthly Revenue Report' },
            { to: '/sendGridWebhook', name: 'Email Webhook Report' },
            { to: '/optInReport', name: 'Opt In Report' },
            { to: '/chargeback_blocked_user_logs', name: 'Chargeback Blocked User Logs' }

        ]
    },
    {
        title: 'Error Code Description',
        menus: [
            { to: '/decline_code_description', name: 'Decline Code Description' },
            { to: '/ccbill_error_code_description', name: 'CCBill Error Code Description' },
            { to: '/ccbill_rest_api_error_code_description', name: 'CCBill Rest API Error Code Description' }
        ]
    },
    {
        title: 'Logs',
        menus: [
            { to: '/api_limiter_logs', name: 'API Limiter Log' },
            { to: '/liveStream/log', name: 'Website Live Stream Log' },
            { to: '/ccbill_duplicate_subscription_error_log', name: 'CCBill Duplicate Subscription Log' },
            { to: '/ccbill_rest_api_reporting_by_domain', name: 'CCBill Rest API Reporting By Domain' },
            { to: '/ccbill_rest_api_error_log', name: 'CCBill Rest API Oauth Error Logs' },
            { to: '/missingwebhooks', name: 'Missing Webhooks' },
            { to: '/promotion_report', name: 'Promotion Report' },
            { to: '/ccbill-transactions', name: 'CCBill Transactions' },
            { to: '/auto-block-user-log', name: 'Auto Block Users' },
            { to: '/wrong-user-subscription-status-log', name: 'Wrong User Subscription Status' },
            { to: '/resubscription-report', name: 'Resubscription Report' }
        ]
    },
    {
        title: 'Video Processing',
        menus: [
            { to: '/video-processing/queue', name: 'Queue' },
            { to: '/video-processing/errors', name: 'Errors' },
            { to: '/video-processing/health', name: 'Health' }
        ]
    },
    {
        title: 'Payment Success / Error Logs',
        menus: [
            { to: '/add_card_logs', name: 'Add Card Logs' },
            { to: '/ccbill_success_error_logs', name: 'CCBill Success / Error Logs' },
            { to: '/sticky_io_success_error_logs', name: 'Sticky-Io Success / Error Logs' }
        ]
    },
    {
        title: 'Websites & Servers',
        menus: [
            { to: '/websites', name: 'Websites' },
            { to: '/servers', name: 'Servers' },
            { to: '/databases', name: 'Databases' },
            { to: '/subscription-count', name: 'Subscription Count' },
            { to: '/influencer-activity', name: 'Influencer Activity' }
        ]
    },
    {
        title: 'Referrals & Commission',
        menus: [
            { to: '/website-referral', name: 'Website Referral' },
            { to: '/website_referral_history', name: 'Website Referral History' },
            { to: '/websitecommission', name: 'Website Commission' }
        ]
    },
    {
        title: 'Link Tracking',
        menus: [
            { to: '/link-tracking-referral', name: 'Link Tracking Referral' },
            { to: '/link-tracking-users', name: 'Link Tracking Users' }
        ]
    },
    {
        title: 'Health & Status',
        menus: [
            { to: '/website/check-status', name: 'Check Website Status' }
        ]
    },
    {
        title: 'Sticky.io',
        menus: [
            { to: '/sticky_io_summary_report', name: 'Sticky Io Summary Report' },
            { to: '/sticky-io/import-transaction', name: 'Import Sticky.io Transactions' },
            { to: '/sticky_io_transactions_report', name: 'Sticky Io Transaction Report' },
            { to: '/sticky_io_payment_profiles', name: 'Sticky Io Payment Profiles' }
        ]
    },
    {
        title: 'Chargeback',
        menus: [
            { to: '/chargeback-alerts', name: 'ECSuite Chargeback Alert' }
        ]
    },
    {
        title: 'Influencer Help',
        menus: [
            { to: '/influencer-help', name: 'Influencer Help' },
            { to: '/influencer-help-tags', name: 'Help Tags' }
        ]
    },
    {
        title: 'Security',
        menus: [
            { to: '/api-limit-configuration-list', name: 'API Limit Configuration' },
            { to: '/mfa_setting', name: 'MFA Settings' },
            { to: '/settings', name: 'AWS Settings' },
            { to: '/suspicious-user', name: 'Suspicious User' }
        ]
    },
    {
        title: 'Block',
        menus: [
            { to: '/block-code-list', name: 'Block Code' },
            { to: '/block-user-list', name: 'Block User' }
        ]
    },
    {
        title: 'Country State City',
        menus: [
            { to: '/country-list', name: 'Country' },
            { to: '/state-list', name: 'State' },
            { to: '/city-list', name: 'City' }
        ]
    },
    {
        title: 'PWA',
        menus: [
            { to: '/pwa-info', name: 'PWA Info' }
        ]
    },
    {
        title: 'Lookup',
        menus: [
            { to: '/user-lookup', name: 'User Lookup' }
        ]
    },
    {
        title: 'Fan Favour',
        menus: [
            { to: '/model-list', name: 'Model List' }
        ]
    },
    {
        title: 'Contact Us',
        menus: [
            { to: '/contact-us', name: 'Contact Us' }
        ]
    }
]

const sideMenusForAnalytics = [
    {
        title: 'Reports & Analytics',
        menus: [
            { to: '/analytics/user_count', name: 'User Count Analytics' },
            { to: '/analytics/export', name: 'Monthly Analytics Report' },
            { to: '/analytics/revenue/export', name: 'Monthly Revenue Report' }
        ]
    },
    {
        title: 'Logs',
        menus: [
            { to: '/liveStream/log', name: 'Website Live Stream Log' },
            { to: '/missingwebhooks', name: 'Missing Webhooks' }
        ]
    },
    {
        title: 'Health & Status',
        menus: [
            { to: '/website/check-status', name: 'Check Website Status' }
        ]
    },
    {
        title: 'Security',
        menus: [
            { to: '/mfa_setting', name: 'MFA Settings' }
        ]
    }
]

const sideMenusForSupport = [
    {
        title: 'Statistics',
        menus: [
            { to: '/subscription-statistics', name: 'Subscription Statistics' },
            { to: '/website/cron-status', name: 'Website Cron Status' }
        ]
    },
    {
        title: 'Universal Login',
        menus: [
            { to: '/universal-login-logs', name: 'Logs' },
            { to: '/universal-login-users', name: 'Users' },
            { to: '/all-website-users', name: 'All Website Users' },
            { to: '/universal-login-cards', name: 'Cards' },
            { to: '/universal-login-statistics', name: 'Statistics' }
        ]
    },
    {
        title: 'Reports & Analytics',
        menus: [
            { to: '/ccbill_summary_report', name: 'CCBill Summary Report' }
        ]
    },
    {
        title: 'Crypto Payment',
        menus: [
            { to: '/forumpay-transaction-history', name: 'Transaction History' },
            { to: '/forumpay-webhook-logs', name: 'Webhook Logs' },
            { to: '/user-wallet-balance', name: 'User Wallet Balance' }
        ]
    },
    {
        title: 'Hybrid Payment',
        menus: [
            { to: '/hybrid-transaction-log-list', name: 'Transaction Logs' },
            { to: '/hybrid-transaction-summary', name: 'Transaction Summary' }
        ]
    },
    {
        title: 'Logs',
        menus: [
            { to: '/ccbill_duplicate_subscription_error_log', name: 'CCBill Duplicate Subscription Log' },
            { to: '/ccbill_rest_api_reporting_by_domain', name: 'CCBill Rest API Reporting By Domain' },
            { to: '/ccbill_rest_api_error_log', name: 'CCBill Rest API Oauth Error Logs' },
            { to: '/missingwebhooks', name: 'Missing Webhooks' },
            { to: '/chargeback_blocked_user_logs', name: 'Chargeback Blocked User Logs' },
            { to: '/ccbill-transactions', name: 'CCBill Transactions' },
            { to: '/auto-block-user-log', name: 'Auto Block Users' },
            { to: '/wrong-user-subscription-status-log', name: 'Wrong User Subscription Status' },
            { to: '/resubscription-report', name: 'Resubscription Report' }
        ]
    },
    {
        title: 'Payment Success / Error Logs',
        menus: [
            { to: '/add_card_logs', name: 'Add Card Logs' },
            { to: '/ccbill_success_error_logs', name: 'CCBill Success / Error Logs' },
            { to: '/sticky_io_success_error_logs', name: 'Sticky-Io Success / Error Logs' }
        ]
    },
    {
        title: 'Health & Status',
        menus: [
            { to: '/website/check-status', name: 'Check Website Status' }
        ]
    },
    {
        title: 'Sticky.io',
        menus: [
            { to: '/sticky_io_summary_report', name: 'Sticky Io Summary Report' },
            { to: '/sticky-io/import-transaction', name: 'Import Sticky.io Transactions' },
            { to: '/sticky_io_transactions_report', name: 'Sticky Io Transaction Report' },
            { to: '/sticky_io_payment_profiles', name: 'Sticky Io Payment Profiles' }
        ]
    },
    {
        title: 'Chargeback',
        menus: [
            { to: '/chargeback-alerts', name: 'ECSuite Chargeback Alert' }
        ]
    },
    {
        title: 'Security',
        menus: [
            { to: '/mfa_setting', name: 'MFA Settings' }
        ]
    },
    {
        title: 'Contact Us',
        menus: [
            { to: '/contact-us', name: 'Contact Us' }
        ]
    }
]

const sideMenusForReferral = [
    {
        title: 'Earning Report',
        menus: [
            { to: '/website-referral-monthly-earning-report', name: 'Monthly Earning Report' },
            { to: '/link-tracking-website-referral-monthly-earning-report', name: 'Link Tracking Monthly Earning Report' }
        ]
    },
    {
        title: 'Security',
        menus: [
            { to: '/mfa_setting', name: 'MFA Settings' }
        ]
    }
]

const sideMenusForAccountManager = [
    {
        title: 'Dashboard',
        menus: [
            { to: '/forumpay-transaction-history', name: 'Dashboard' }
        ]
    }
]

const sideMenusForLinkReferral = [
    {
        title: 'Link Tracking',
        menus: [
            { to: '/analytics/link-tracking', name: 'Link Tracking Referral Analytics' }
        ]
    },
    {
        title: 'Security',
        menus: [
            { to: '/mfa_setting', name: 'MFA Settings' }
        ]
    }
]

const SideBar: React.FC<Props> = ({ rootstore }) => {
    const [loginUserRole, setLoginUserRole] = useState(rootstore.authStore.userRole)
    const [mainSideBarArray, setMainSideBarArray] = useState<MenuSection[]>([])
    const { theme } = rootstore.authStore

    useEffect(() => {
        filterMenu(rootstore.sideMenuStore.searchFilter.toString().toUpperCase())
    }, [rootstore.sideMenuStore.searchFilter])

    useEffect(() => {
        restorePosition(rootstore.sideMenuStore.scrollPosition)
    }, [])

    const sideMenu = useMemo(() => {
        let sideMenuArray: MenuSection[] = []

        if (loginUserRole === 'SUPER_ADMIN') {
            sideMenuArray = sideMenusForSuperAdmins
        } else if (loginUserRole === 'ANALYTICS') {
            sideMenuArray = sideMenusForAnalytics
        } else if (loginUserRole === 'SUPPORT') {
            sideMenuArray = sideMenusForSupport
        } else if (loginUserRole === 'REFERRAL') {
            sideMenuArray = sideMenusForReferral
        } else if (loginUserRole === 'ACCOUNT_MANAGER') {
            sideMenuArray = sideMenusForAccountManager
        } else if (loginUserRole === 'LINK_REFERRAL') {
            sideMenuArray = sideMenusForLinkReferral
        }

        if (sideMenuArray.length === 0) {
            const userRole = localStorage.getItem('userRole')

            if (userRole === 'SUPER_ADMIN') {
                sideMenuArray = sideMenusForSuperAdmins
            } else if (userRole === 'ANALYTICS') {
                sideMenuArray = sideMenusForAnalytics
            } else if (userRole === 'SUPPORT') {
                sideMenuArray = sideMenusForSupport
            } else if (userRole === 'REFERRAL') {
                sideMenuArray = sideMenusForReferral
            } else if (userRole === 'ACCOUNT_MANAGER') {
                sideMenuArray = sideMenusForAccountManager
            } else if (userRole === 'LINK_REFERRAL') {
                sideMenuArray = sideMenusForLinkReferral
            }
        }
        setMainSideBarArray(sideMenuArray)
        return sideMenuArray
    }, [loginUserRole])

    useEffect(() => {
        setLoginUserRole(rootstore.authStore.userRole)
    }, [rootstore.authStore.userRole, loginUserRole, mainSideBarArray])

    const filterFunction = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Declare variables
        const filter = ''
        const input = e.target.value
        rootstore.sideMenuStore.searchFilter = input
    }

    function filterMenu(filter: string) {
        if (filter === '') {
            setMainSideBarArray(sideMenu)
        } else {
            const copy = JSON.parse(JSON.stringify(sideMenu))
            let filteredMenu = copy.map(
                (sideMenu: MenuSection) => {
                    if (sideMenu.title.toUpperCase().includes(filter)) {
                        return sideMenu
                    }
                    sideMenu.menus = sideMenu.menus.filter((menu: MenuItem) => menu.name.toUpperCase().includes(filter))
                    return sideMenu
                })
            filteredMenu = filteredMenu.filter((menu: MenuSection) => menu.menus.length > 0)
            setMainSideBarArray(filteredMenu)
        }
    }

    const resetSearch = () => {
        rootstore.sideMenuStore.searchFilter = ''
        const element = document.getElementById('mySearch')
        if (element !== null) {
            element.focus()
        }
    }

    const getScrollPosition = (e: React.MouseEvent<HTMLLIElement>) => {
        e.preventDefault()
        const scrollPositionFromTop = document.getElementById('mySideBar')
        if (scrollPositionFromTop) rootstore.sideMenuStore.scrollPosition = scrollPositionFromTop.scrollTop
    }

    const restorePosition = (e: any) => {
        const scrollPositionFromTop = document.getElementById('mySideBar')
        scrollPositionFromTop!.scrollTo(0, rootstore.sideMenuStore.scrollPosition)
    }

    if (mainSideBarArray === undefined) {
        window.location.reload()
    }

    return <>
        <nav className={classNames('col-md-3 col-lg-2 d-md-block sidebar collapse', {
            'show': rootstore.navStore.collapse,
            'bg-dark': theme === 'dark',
            'bg-light': theme === 'light'
        })} data-bs-theme={theme === 'dark' ? 'dark' : 'light'}>
            <div className='sidebar-sticky pt-3 px-2' id='mySideBar'>
                <div className='input-group mb-3' style={{ position: 'relative' }}>
                    <input
                        type='text'
                        name='focus'
                        required
                        autoComplete='off'
                        onChange={filterFunction}
                        className='form-control'
                        id='mySearch'
                        value={rootstore.sideMenuStore.searchFilter}
                        placeholder='Search'
                        style={{ boxShadow: 'none' }}
                    />
                    {rootstore.sideMenuStore.searchFilter !== '' &&
                        <span className='input-group-text'>
                            <button className='btn btn-close' type='reset' onClick={resetSearch}></button>
                        </span>
                    }
                </div>
                <ul className='nav flex-column' id='myMenu'>
                    {mainSideBarArray.map((mainSideBarArray: MenuSection, index: number) => {
                        const title = mainSideBarArray.title
                        const sideSubMenuForSuperAdmins = mainSideBarArray.menus
                        return <>
                            {title !== '' ?
                                <li key={index} className='ps-2 menu-title my-1 rounded-3'>
                                    <NavLink className={({ isActive }) => isActive ? 'text-decoration-none text-dark active' : 'text-decoration-none text-dark'} to="/" aria-disabled >{title}</NavLink></li> : <></>}
                            {sideSubMenuForSuperAdmins.map((sideSubMenuForSuperAdmins: MenuItem, index: number) => {
                                return (<li key={index} className='nav-item rounded-3' onClick={(e) => getScrollPosition(e)} style={{ margin: '2.5px 0px' }}>
                                    <NavLink className={({ isActive }) => isActive ? 'active nav-link position-relative rounded-3' : 'nav-link position-relative rounded-3'} to={sideSubMenuForSuperAdmins.to} >
                                        <span className='d-inline-block'>
                                            {sideSubMenuForSuperAdmins.name}
                                        </span>
                                    </NavLink>
                                </li>)
                            })}
                        </>
                    })}
                </ul>
            </div>
        </nav >
    </>
}

export default observer(SideBar)
