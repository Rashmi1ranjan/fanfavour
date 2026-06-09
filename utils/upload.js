const AWS = require('aws-sdk')
const fs = require('fs')
const _ = require('lodash')
const AwsSettings = require('../models/AwsSettings')

/**
 * @description Upload File to S3
 * @param {string} localFilePath local file absolute path or buffer
 * @param {string} s3filePath s3 key path
 * @param {string} contentType provide null or send content type
 * @returns {Promise} promise
 */
async function uploadFileToS3(localFilePath, s3filePath, contentType) {
    return new Promise((resolve, reject) => {
        (async () => {
            const awsSettings = await AwsSettings.findOne({})
            const awsRegion = awsSettings.aws_region
            const awsSecretAccessKey = awsSettings.aws_secret_access_key
            const awsSecretKeyId = awsSettings.aws_secret_key_id
            const awsS3Bucket = awsSettings.aws_s3_bucket
            const isCloudfrontEnabled = awsSettings.is_cloudfront_enabled

            AWS.config.update({
                secretAccessKey: awsSecretAccessKey,
                accessKeyId: awsSecretKeyId,
                region: awsRegion
            })

            const s3 = new AWS.S3({ apiVersion: '2006-03-01' })
            let fileStream = localFilePath
            if (_.isString(localFilePath)) {
                console.log(`uploadFileToS3 ${localFilePath} => ${s3filePath}`)
                fileStream = fs.createReadStream(localFilePath)
            }

            const uploadParams = {
                Bucket: awsS3Bucket,
                Key: s3filePath,
                Body: fileStream
            }

            if (isCloudfrontEnabled !== true) {
                uploadParams.ACL = 'public-read'
            }

            if (contentType != null) {
                uploadParams.ContentType = contentType
            }

            s3.upload(uploadParams, function (err, data) {
                if (err) {
                    console.log('An error occurred uploadFileToS3: ' + err.message)
                    reject(err)
                } else {
                    if (_.isString(localFilePath)) {
                        console.log(`uploadFileToS3 ${localFilePath} => ${s3filePath} Done`)
                    }
                    resolve(data)
                }
            })
        })()
    })
}

module.exports = { uploadFileToS3 }
