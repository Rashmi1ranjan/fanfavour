const AWS = require('aws-sdk')
const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')
const { addCronStatusLog } = require('../utils/addCronStatus')

const moveLiveStreamVideo = async (dryRun) => {
    if (!['true', 'false'].includes(dryRun)) {
        return console.log('Please enter dry run value true/false.')
    }
    let target_date = moment().format('YYYY-MM-DDT00:00:00.000+00:00')
    target_date = new Date(target_date)
    AWS.config.update({
        secretAccessKey: process.env.LIVE_STREAM_secretAccessKey,
        accessKeyId: process.env.LIVE_STREAM_accessKeyId
    })

    const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

    const params = {
        Bucket: 'livestream.recordings',
        Prefix: 'https_api.'
    }

    s3.listObjectsV2(params, async function (err, data) {
        if (err) {
            console.log(err)
            const errorMessage = _.get(err, 'message', '')
            const cronStatusData = {
                domain: 'services',
                command_name: 'Move LiveStream Video',
                cron_status: 'error',
                target_date: target_date,
                message: errorMessage
            }
            await addCronStatusLog(cronStatusData)
            throw err
        }

        const fileNames = data.Contents.map((file) => file.Key)
        console.log({ fileNames })
        if (dryRun === 'false') {
            console.log(`${fileNames.length} Streams recording found.`)
            let movedStreamCount = 0
            let errorStreamFilenames = []
            for (let index = 0; index < fileNames.length; index++) {
                const filename = fileNames[index]
                const fileData = {
                    filename
                }
                console.log(filename)
                const url = filename.split('_LIVE_STREAM_')
                const apiUrl = url[0].replace('_', '://') + '/live-archives/record'
                try {
                    const res = await axios.post(apiUrl, fileData)
                    console.log(res.data)
                    if (res.data.success === 1) {
                        movedStreamCount++
                    }
                } catch (error) {
                    console.log(error)
                    errorStreamFilenames.push(filename)
                }
            }
            console.log(`Moved ${movedStreamCount} out of ${fileNames.length} live streams successfully.`)
            if (errorStreamFilenames.length > 0) {
                console.log(`Error in moving ${errorStreamFilenames.length} out of ${fileNames.length} live streams.`)
                console.log({ errorStreamFilenames })
            }
            const cronStatusData = {
                domain: 'services',
                command_name: 'Move LiveStream Video',
                cron_status: 'success',
                target_date: target_date,
                message: ''
            }
            await addCronStatusLog(cronStatusData)
            return
        } else {
            const cronStatusData = {
                domain: 'services',
                command_name: 'Move LiveStream Video',
                cron_status: 'success',
                target_date: target_date,
                message: ''
            }
            await addCronStatusLog(cronStatusData)
            return console.log(`${fileNames.length} Streams recording found.`)
        }

    })
}

module.exports = { moveLiveStreamVideo }
