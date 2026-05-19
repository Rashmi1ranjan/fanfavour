import { getAppSettingsData } from '../utils/AppSettings.js'

/**
 * Get domain name of website
 *
 * @returns {string} domain name of website
 */
export const getHostName = () => {
    const websiteUrl = getAppSettingsData('website_url') || 'http://localhost:3000'
    const domain = new URL(websiteUrl)
    const hostName = domain.hostname
    return hostName
}