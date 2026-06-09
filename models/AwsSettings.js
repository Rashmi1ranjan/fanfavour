const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AwsSettingsSchema = new Schema({
    aws_secret_key_id: {
        type: String
    },
    aws_secret_access_key: {
        type: String
    },
    aws_region: {
        type: String
    },
    aws_s3_bucket: {
        type: String
    },
    aws_url: {
        type: String
    },
    is_cloud_front_enable: {
        type: Boolean
    },
    cloud_front_url: {
        type: String
    }
})

module.exports = mongoose.model('AwsSettings', AwsSettingsSchema, 'awsSettings')
