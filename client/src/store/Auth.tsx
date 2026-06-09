import { makeObservable, observable, action } from 'mobx'
import RootStore from './Root'
import axios from 'axios'
import jwt_decode from 'jwt-decode'
import { checkMfaStatus } from '../api/LoginActions'

interface JwtDecoded {
    exp: number,
    role: string,
    is_mfa_enabled: boolean
}

class AuthStore {

    public rootStore: RootStore
    @observable public authToken: string
    @observable public currentUser: string
    @observable public userRole: string
    @observable public isUserLoggedIn: boolean
    @observable public userMfaStatus: boolean
    @observable public isLoading: boolean
    @observable public theme: string
    @observable public bgColor: string
    @observable public fontColor: string

    constructor(rootStore: RootStore) {
        const rootStyles = getComputedStyle(document.documentElement)
        makeObservable(this)
        this.rootStore = rootStore
        this.authToken = ''
        this.currentUser = ''
        this.userRole = ''
        this.isUserLoggedIn = false
        this.restoreToken()
        this.reStoreCurrentUser()
        this.userMfaStatus = false
        this.isLoading = true
        this.getUserMfaStatus()
        this.theme = 'light'
        this.bgColor = rootStyles.getPropertyValue('--bs-body-bg').trim()
        this.fontColor = rootStyles.getPropertyValue('--bs-body-color').trim()
    }

    logout(): void {
        this.setAuthToken('')
    }

    setAuthToken(token: string): void {
        if (token) {
            this.authToken = token
            axios.defaults.headers.common['authorization'] = token
            localStorage.setItem('authorization', token)
            // Apply token token to every request if logged in
            this.isUserLoggedIn = true
        } else {
            // Delete auth header
            delete axios.defaults.headers.common['authorization']
            localStorage.removeItem('authorization')
            this.isUserLoggedIn = false
        }
    }

    setCurrentUser(email: string): void {
        this.currentUser = email
        localStorage.setItem('currentUser', email)
    }

    setUserRole(role: string): void {
        this.userRole = role
        localStorage.setItem('userRole', role)
    }

    reStoreCurrentUser(): void {
        const currentUser = localStorage.getItem('currentUser')
        if (currentUser != null) {
            this.currentUser = currentUser
        }
    }

    restoreToken(): void {
        const token = localStorage.getItem('authorization')
        if (token != null) {
            this.authToken = token
            axios.defaults.headers.common['authorization'] = token
            const decoded: JwtDecoded = jwt_decode(token)
            // Check for expired token
            const currentTime = Date.now() / 1000
            if (decoded.exp < currentTime) {
                this.setAuthToken('')
                this.isUserLoggedIn = false
            } else {
                this.setAuthToken(token)
                this.setUserRole(decoded.role)
            }
        }
    }

    setUserMfaStatus(status: boolean): void {
        this.userMfaStatus = status
    }

    getUserMfaStatus = (): void => {
        checkMfaStatus().then((response) => {
            if (response.status === 200) {
                this.setUserMfaStatus(response.data.is_mfa_enabled)
                this.isLoading = false
            } else {
                alert('Something went wrong')
            }
        }).catch((e) => {
            console.log('Error in Get Mfa Status', e)
            this.setAuthToken('')
            this.isUserLoggedIn = false
        })
    }

    @action.bound
    setTheme(newTheme: string | null): void {
        const rootStyles = getComputedStyle(document.documentElement)
        if (newTheme !== null && newTheme !== undefined) {
            localStorage.setItem('theme', newTheme)
            this.theme = newTheme
        }

        const htmlElement: HTMLElement | null = document.querySelector('html')
        if (htmlElement !== null) {
            htmlElement.setAttribute('data-bs-theme', newTheme === 'dark' ? 'dark' : 'light')
        }

        this.bgColor = rootStyles.getPropertyValue('--bs-body-bg').trim()
        this.fontColor = rootStyles.getPropertyValue('--bs-body-color').trim()
    }
}

export default AuthStore
