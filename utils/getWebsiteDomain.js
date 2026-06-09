const getWebsiteDomain = (website_url) => {
    if (website_url.includes('localhost')) {
        return 'http://localhost:8000'
    }
    if (process.env.NODE_ENV === 'development') {
        return `http://api.${website_url}`
    }
    return `https://api.${website_url}`
}

module.exports = { getWebsiteDomain }
