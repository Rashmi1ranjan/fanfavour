
export const getAppBaseUrl = function getAppBaseUrl() {
    if (window.location.hostname === 'localhost') {
        return 'http://localhost:8080'
    }
    const host = window.location.host
    const protocol = window.location.protocol

    if (host.startsWith('www.')) {
        const newHost = host.replace('www.', '')
        return `${protocol}//www.api.${newHost}`
    } else {
        return `${protocol}//api.${host}`
    }
}

export default { getAppBaseUrl }
