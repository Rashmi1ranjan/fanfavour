'use client'

import { setAuthToken } from '../lib/set-auth-token'
import { api } from './base-url'
import { logoutUser } from './users.action'

let interceptorsConfigured = false

/**
 * Configures the API interceptors with Redux and navigation handlers.
 * Only runs once globally, regardless of component mount/unmount cycles.
 * Safe to call multiple times - subsequent calls are no-ops.
 *
 * @param {Function} dispatch - Redux dispatch function from useDispatch hook
 * @param {Object} router - Next.js router object from useRouter hook
 */
export const configureApiInterceptors = (dispatch, router) => {
    if (interceptorsConfigured) return

    api.interceptors.response.use(
        response => response,
        error => {
            if (error.response?.status === 401) {
                setAuthToken(false)
                logoutUser(dispatch)
                if (router) {
                    router.push('/')
                }
            }
            return Promise.reject(error)
        }
    )

    interceptorsConfigured = true
}
