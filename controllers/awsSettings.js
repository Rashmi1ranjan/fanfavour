const express = require('express')
const router = express.Router()
const AwsSettings = require('../models/AwsSettings')
const { SUPER_ADMIN, protectRouteWithRole } = require('../middleware/auth.middleware')
const AWS = require('aws-sdk')
const _ = require('lodash')
const uuid = require('uuid')
const { errorResponse, successResponse } = require('../utils')

router.get('/get-aws-settings', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const awsSettings = await AwsSettings.find()

    return successResponse(res, { rows: awsSettings }, 'Get Aws Settings successfully', 200)
})

router.post('/get-presigned-url', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const awsSetting = await AwsSettings.findOne()
    if (awsSetting === null) {
        return errorResponse(res, 'error', 'Aws Settings is not found', 500)
    }
    try {
        const type = _.get(req, 'body.type', '')
        if (_.isEmpty(type)) {
            return errorResponse(res, 'error', 'Type is not passed', 500)
        }
        AWS.config.update({
            secretAccessKey: awsSetting.aws_secret_access_key,
            accessKeyId: awsSetting.aws_secret_key_id,
            region: awsSetting.aws_region
        })
        let path = req.body.file_name
        let [fileName, fileExtension] = path.split(/\.(?=[^\.]+$)/)
        let newFileName = uuid.v1()
        fileName = `${type}/${newFileName}.${fileExtension}`

        let s3 = new AWS.S3({
            signatureVersion: 'v4',
            // region: awsSetting.aws_region,
            apiVersion: '2006-03-01'
        })

        const contentType = (type === 'video') ? 'video/mp4' : 'application/pdf'
        // let s3 = new AWS.S3({ apiVersion: '2006-03-01' })

        const params = {
            Bucket: awsSetting.aws_s3_bucket,
            Key: fileName,
            Expires: 3600,
            ACL: 'public-read',
            // ContentType: 'multipart/form-data'
            ContentType: contentType
        }

        const presignedUrl = s3.getSignedUrl('putObject', params)
        return successResponse(res, { presigned_url: presignedUrl, file_name: `${fileName}` }, 'Presigned Url generated successfully', 200)
    } catch (error) {
        console.log(error)
        return errorResponse(res, error, 'Error in Generate Presigned Url', 500)
    }
})

router.post('/save-aws-settings', protectRouteWithRole([SUPER_ADMIN]), async (req, res) => {

    const data = req.body
    const _id = _.get(data, '_id', '')

    const awsSecretKeyId = _.get(req, 'body.aws_secret_key_id', '')
    const awsSecretAccessKey = _.get(req, 'body.aws_secret_access_key', '')
    const awsRegion = _.get(req, 'body.aws_region', '')
    const awsS3Bucket = _.get(req, 'body.aws_s3_bucket', '')
    const awsUrl = _.get(req, 'body.aws_url', '')
    const isCloudFrontEnable = _.get(req, 'body.is_cloud_front_enable', false)
    const cloudFrontUrl = _.get(req, 'body.cloud_front_url', '')

    if (_id === '') {
        const awsSettingsData = {
            aws_secret_key_id: awsSecretKeyId,
            aws_secret_access_key: awsSecretAccessKey,
            aws_region: awsRegion,
            aws_s3_bucket: awsS3Bucket,
            aws_url: awsUrl,
            is_cloud_front_enable: isCloudFrontEnable,
            cloud_front_url: cloudFrontUrl
        }
        let awsSettings = new AwsSettings(awsSettingsData)

        await awsSettings.save()
        return successResponse(res, {}, 'Aws Settings Save successfully', 200)
    } else {
        const newValues = {
            $set: {
                aws_secret_key_id: awsSecretKeyId,
                aws_secret_access_key: awsSecretAccessKey,
                aws_region: awsRegion,
                aws_s3_bucket: awsS3Bucket,
                aws_url: awsUrl,
                is_cloud_front_enable: isCloudFrontEnable,
                cloud_front_url: cloudFrontUrl
            }
        }
        const query = { _id: _id }
        try {
            await AwsSettings.updateOne(query, newValues)

            return successResponse(res, {}, 'Aws Settings Updated successfully', 200)
        } catch (error) {
            return errorResponse(res, error, error.message, 500)
        }
    }
})

module.exports = router
