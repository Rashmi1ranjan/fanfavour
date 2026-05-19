// Form validation regex
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Subscription status constants - unused
export const SUBSCRIPTION_STATUS_ACTIVE = '2'
export const SUBSCRIPTION_STATUS_ACTIVE_CANCELLED = '1'

// File upload validation for media upload limits
export const FILE_SIZE_LIMIT_IN_BYTE = 5000000000

// User role constants - used throughout for role-based access control
export const ROLE_ADMIN = 'admin' // unused
export const ROLE_MODEL = 'model'
export const ROLE_CONTENT_MANAGER = 'content_manager'
export const ROLE_USER = 'user'
export const ROLE_GUEST = 'guest' // unused
export const ROLE_SUPPORT = 'support' // unused
export const ROLE_SUB_ADMIN = 'sub_admin' // unused
export const ROLE_PROXY_USER = 'proxy_user' // unused
export const ROLE_LIVE_STREAM_MANAGER = 'live_stream_manager'

// Used for media type validation
export const MP4 = 'mp4'
export const MOV = 'mov'
export const M4V = 'm4v'
export const PHOTO = 'photo'
export const VIDEO = 'video'
export const GALLERY = 'gallery'
export const mediaTypes = [PHOTO, VIDEO, GALLERY]

// Authentication flow constants - used in auth pages for tracking user action type
export const ADD_ACCOUNT = 'ADD_ACCOUNT'
export const MERGE_ACCOUNT = 'MERGE_ACCOUNT'
export const REGISTER = 'register'
export const LOGIN = 'login'

// Route protection for role-based page access
export const ALLOW_ALL = [ROLE_USER]
