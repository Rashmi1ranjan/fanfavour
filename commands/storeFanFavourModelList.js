const axios = require('axios')
const FanFavourModel = require('../models/FanFavourModel')
const InfluencerActivity = require('../models/influencerActivity')
const Website = require('../models/Website')
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')
const { getWebsiteDomain } = require('../utils/getWebsiteDomain')

const TARGET_BUCKET = 'fan-favour'
const awsRegion = 'us-west-1'
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const awsSecretKeyId = process.env.AWS_ACCESS_KEY_ID

const s3 = new AWS.S3({
    region: awsRegion,
    secretAccessKey: awsSecretAccessKey,
    accessKeyId: awsSecretKeyId
})


async function storeFanFavourModel() {
    try {
        const query = {
            status: { $in: ['live', 'published'] }
        }
        const websiteList = await Website.find(query, { model_name: 1, website_url: 1, _id: 0 })

        // 2. Get latest activity per model (grouped by domain)
        const activityData = await InfluencerActivity.aggregate([
            {
                $match: {
                    domain: { $in: websiteList.map(w => w.website_url) }
                }
            },
            {
                $sort: { date_of_last_blog_added: -1 }
            },
            {
                $group: {
                    _id: '$domain',
                    latestUpload: { $first: '$date_of_last_blog_added' }
                }
            }
        ])

        // 3. Create a lookup map from domain to latest upload
        const activityMap = {}
        for (const act of activityData) {
            activityMap[act._id] = act.latestUpload
        }

        // 4. Combine websiteList with latest upload info
        const topModels = websiteList.map(model => ({
            model_name: model.model_name,
            website_url: model.website_url,
            latestUpload: activityMap[model.website_url] || null
        }))

        const sortedTopModels = topModels.sort((a, b) => {
            return new Date(b.latestUpload) - new Date(a.latestUpload)
        })


        // 6. Insert these models into FanFavourModel
        let display_order = await FanFavourModel.countDocuments() + 1

        for (const top of sortedTopModels) {
            const website = websiteList.find(w => w.website_url === top.website_url)
            const exists = await FanFavourModel.findOne({ website_url: top.website_url })

            const data = {
                model_name: website.model_name,
                display_order,
                likes: Math.floor(Math.random() * (19000 - 5000 + 1)) + 5000,
                website_url: website.website_url,
                image: ''
            }

            if (!exists) {
                await FanFavourModel.create({
                    model_name: website.model_name,
                    website_url: website.website_url,
                    display_order,
                    likes: Math.floor(Math.random() * (19000 - 5000 + 1)) + 5000, // random likes
                    image: website.image || ''
                })
                display_order += 1
            } else {
                data.display_order = exists.display_order
                data.likes = exists.likes
                await FanFavourModel.findByIdAndUpdate(exists._id, { $set: data })
            }
            await getWebsiteSignUpImages(website.website_url)
        }
    } catch (error) {
        console.log('Error in log update', error)
    }
}

/**
 * Store the top 10 models first in the website.
 */
async function topTenModel() {
    try {
        const websiteList = [
            'yasmeennicole.com',
            'vipaubrey.com',
            'thegraceboor.com',
            'thekendrarowe.com',
            'kyndallynn.com',
            'phoebevip.com',
            'reneegracievip.com',
            'anouksam.com',
            'amberjasminevip.com',
            'alyssagriffithx.com'
        ]

        const allSites = await Website.find({ website_url: { $in: websiteList } })

        let display_order = 1
        let baseLikes = 40000
        for (const url of websiteList) {
            const site = allSites.find(s => s.website_url === url)
            if (!site) continue

            const { model_name, website_url } = site
            // Assign highest likes to first, then gradually less
            const randomOffset = Math.floor(Math.random() * 1000) // random 0–999
            const likes = baseLikes - randomOffset
            const data = {
                model_name,
                display_order,
                likes,
                website_url,
                image: ''
            }

            const modelData = await FanFavourModel.findOne({ website_url }, 'display_order likes')

            if (!modelData) {
                const newModel = new FanFavourModel(data)
                await newModel.save()
            } else {
                data.display_order = modelData.display_order
                data.likes = modelData.likes
                await FanFavourModel.findByIdAndUpdate(modelData._id, { $set: data })
            }

            await getWebsiteSignUpImages(website_url)

            display_order += 1
            baseLikes -= Math.floor(Math.random() * 1000 + 1000)
        }
        console.log('store all model')
    } catch (error) {
        console.log('Error in log update', error)
    }
}

async function getWebsiteSignUpImages(websiteUrl) {
    try {
        const domainUrl = getWebsiteDomain(websiteUrl)
        const websiteData = await axios.get(`${domainUrl}/api/services/get-sign-up-image-url`)

        const cloudfrontUrl = websiteData.data?.data?.imageURL
        if (!cloudfrontUrl) {
            console.log('No image URL returned from API')
            return
        }

        console.log(`✅ Got CloudFront image URL: ${cloudfrontUrl}`)

        const fileExtension = getFileExtension(cloudfrontUrl)
        const s3Key = `images/${uuidv4()}.${fileExtension}`

        // Step 3: Download image — no auth required, baby!
        const imageResponse = await axios.get(cloudfrontUrl, {
            responseType: 'arraybuffer'
        })

        const contentType = imageResponse.headers['content-type'] || 'application/octet-stream'

        // Step 4: Upload to S3
        await s3.putObject({
            Bucket: TARGET_BUCKET,
            Key: s3Key,
            Body: imageResponse.data,
            ContentType: contentType
        }).promise()

        console.log(`✅ Uploaded to s3://${TARGET_BUCKET}/${s3Key}`)

        await FanFavourModel.updateOne(
            { website_url: websiteUrl },
            { $set: { image: s3Key } }
        )

        console.log('✅ MongoDB updated with S3 image URL')
    } catch (error) {
        console.error(`❌ Failed to process image for ${websiteUrl}:`, error.message)
    }
}

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

module.exports = { storeFanFavourModel, topTenModel }
