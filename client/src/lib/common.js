/**
 * Get file extension
 * @param {string} fileName  file name
 * @returns {string} file extension
 */
const getFileExtension = (fileName) => {
    let items = fileName.split(/\.(?=[^.]+$)/)
    if (items.length === 2) {
        return items[1]
    }
    return ''
}

export { getFileExtension }