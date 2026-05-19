import { api } from '../action/base-url'

export const setAuthToken = (token) => {
  if (token) {
    if (token.startsWith('ff_')) {
      api.defaults.headers.common['token'] = token
    } else {
      api.defaults.headers.common['Authorization'] = token
    }
  } else {
    delete api.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['token']
  }
}
