const AWS = require('aws-sdk')
const uuid = require('uuid')
const _ = require('lodash')
const path = require('path')
const cfsign = require('aws-cloudfront-sign')
const { HTTP_BAD_REQUEST_400, HTTP_INTERNAL_SERVER_ERROR_500 } = require('./http.status')
const { errorResponse } = require('./')

const generatePresignedUrlWithAWS = (req, res) => {
    try {
        const awsRegion = 'us-west-1'
        const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
        const awsSecretKeyId = process.env.AWS_ACCESS_KEY_ID
        const awsS3Bucket = 'fan-favour'
        const mediaType = _.get(req, 'body.media_type', '')
        if (mediaType === '' || mediaType !== 'photo') {
            return {
                error: {
                    message: 'Invalid request. media type is incorrect.',
                    errorCode: HTTP_BAD_REQUEST_400
                }
            }
        }

        let parentDirectoryPath = 'images'
        if (parentDirectoryPath === '') {
            return {
                error: {
                    message: 'Unsupported media file.',
                    errorCode: HTTP_BAD_REQUEST_400
                }
            }
        }

        AWS.config.update({
            secretAccessKey: awsSecretAccessKey,
            accessKeyId: awsSecretKeyId,
            region: awsRegion
        })
        let path = req.body.file_name
        let [fileName, fileExtension] = path.split(/\.(?=[^.]+$)/)
        fileExtension = fileExtension.toLowerCase()

        let newFileName = `original_${uuid.v1()}`

        fileName = `${parentDirectoryPath}/${newFileName}.${fileExtension}`

        let s3 = new AWS.S3({
            signatureVersion: 'v4',
            // region: awsSetting.aws_region,
            apiVersion: '2006-03-01'
        })

        const params = {
            Bucket: awsS3Bucket,
            Key: fileName,
            Expires: 3600,
            ACL: 'public-read',
            // ContentType: 'multipart/form-data'
            ContentType: 'image/jpg'
        }

        const presignedUrl = s3.getSignedUrl('putObject', params)
        const response = { presigned_url: presignedUrl, file_name: `${fileName}` }
        return response
    } catch (error) {
        console.log(error)
        const errorMessage = _.get(error, 'message', 'Error while generate presigned url.')
        return errorResponse(res, error, errorMessage, HTTP_INTERNAL_SERVER_ERROR_500)
    }
}

/**
 * Generate signed url for aws cloudfront
 *
 * @param {string} url url path
 * @param {boolean} shouldChangeS3FilePath should change s3 file path
 * @param {string} customCloudfrontUrl optional custom cloudfront url to use instead of the default
 * @returns {string} signed url
 */
const generateSignedUrl = (url, shouldChangeS3FilePath = true, customCloudfrontUrl = '', isFeed = false) => {
    if (_.isEmpty(url)) {
        return ''
    }
    let isCloudfrontEnabled = true
    let awsUrl = 'https://fan-favour.s3.us-west-1.amazonaws.com'
    let s3FilePath
    if (shouldChangeS3FilePath === true) {
        s3FilePath = url.replace(/http.*?([.](com|net))/g, '')
    } else {
        s3FilePath = url
    }
    let targetUrl = `${awsUrl}${s3FilePath}`
    if (s3FilePath[0] !== '/') {
        targetUrl = `${awsUrl}/${s3FilePath}`
    }
    if (isCloudfrontEnabled === false) {
        return targetUrl
    }

    let publicPaths = ['images/']
    let cloudfrontUrl = !_.isEmpty(customCloudfrontUrl) ? customCloudfrontUrl : 'https://d3h4dmotvq5tlc.cloudfront.net'
    let newCloudfrontUrl = `${cloudfrontUrl}/${s3FilePath}`

    if (s3FilePath.startsWith('/')) {
        newCloudfrontUrl = `${cloudfrontUrl}${s3FilePath}`
    }

    if (!isFeed && newCloudfrontUrl.includes(publicPaths)) {
        return newCloudfrontUrl
    }

    let keyPairId = 'APKAIKKWJD4WJTNVJXHQ'
    let privateKeyFileName = 'pk-APKAIKKWJD4WJTNVJXHQ.pem'
    let privateKeyPath = path.resolve(`${__dirname}`, `./../../${privateKeyFileName}`)
    let signingParams = {
        keypairId: keyPairId,
        privateKeyPath: privateKeyPath,
        expireTime: new Date().getTime() + (6 * 60 * 60 * 1000) // Valid for 6 Hours, Change 6 to the number of hours we want the signed URL valid for
    }

    // Generating a signed URL
    let signedUrl = cfsign.getSignedUrl(
        newCloudfrontUrl,
        signingParams
    )

    return signedUrl
}

module.exports = { generatePresignedUrlWithAWS, generateSignedUrl }
