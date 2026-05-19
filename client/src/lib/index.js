export default function cleanDomain(url) {
  if (!url) return ''

  try {
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const domain = new URL(normalizedUrl)
    return domain.hostname
  } catch {
    return String(url).trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  }
}
