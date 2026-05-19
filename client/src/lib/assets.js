const CLOUDFRONT_URL = 'https://d3cn8z1d1ca676.cloudfront.net/'

export const getCloudFrontAssetsUrl = (s3_assets_path) => {
    return `${CLOUDFRONT_URL}${s3_assets_path}`
}
