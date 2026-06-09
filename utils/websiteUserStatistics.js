const WebsiteUserDetails = require('../models/WebsiteUserDetails')
const Website = require('../models/Website')
const axios = require('axios')
const moment = require('moment')
const WebsiteDailyEarningReport = require('./../models/WebsiteDailyEarningReport')
const InfluencerActivity = require('./../models/influencerActivity')
const { API_STATIC_AUTH_TOKEN } = require('../constants')
const { getWebsiteDomain } = require('./getWebsiteDomain')

/**
 * Get User statistics from website.
 */
async function getUserStatisticsFromWebsites() {
    try {
        let websitesData = await Website.find({
            status: { $in: ['live', 'published'] }
        })
        for (const element of websitesData) {
            await getWebsiteUserStatistics(element.website_url)
        }
    } catch (e) {
        console.log(e)
    }
}

/**
 * get website user Statistics
 *
 * @param {string} website_url website url
 */
async function getWebsiteUserStatistics(website_url) {
    const token = API_STATIC_AUTH_TOKEN
    const apiDomain = getWebsiteDomain(website_url)

    try {
        const apiUrl = `${apiDomain}/api/get-user-statistics`
        const websiteUserStatistics = await axios.post(apiUrl, { token })

        const {
            totalRegistration,
            totalSubscription,
            totalActiveCancelledSubscription,
            totalActiveSubscription,
            recentlyVisitedAllUsers,
            recentlyVisitedActiveSubscribers7,
            recentlyVisitedActiveSubscribers45,
            recentlyVisitedActiveCanceledSubscribers7,
            recentlyVisitedActiveCanceledSubscribers45,
            totalBlockUsers,
            lastSeenOfModel,
            lastSeenOfContentManager,
            lastBlogTime,
            lastMassMessageTime,
            blogCount,
            massMessageCount
        } = websiteUserStatistics.data.data

        const startDate = moment().subtract(3, 'month').startOf('month').format('YYYY-MM-DDT00:00:00+00:00')
        const endDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DDT23:59:59+00:00')
        let totalEarning = 0

        const lastTreeMonthlyEarnings = await WebsiteDailyEarningReport.find({
            domain: website_url,
            target_date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }, 'revenue_collected')

        for (const earning of lastTreeMonthlyEarnings) {
            totalEarning += earning.revenue_collected
        }
        const averageMonthlyRevenue = totalEarning / 3

        const updatedRecords = {
            registered: totalRegistration,
            subscribed_ever: totalSubscription,
            active_cancelled_subscription: totalActiveCancelledSubscription,
            active_subscription: totalActiveSubscription,
            recently_visited_all: recentlyVisitedAllUsers,
            recently_visited_subscribers_7: recentlyVisitedActiveSubscribers7,
            recently_visited_subscribers_45: recentlyVisitedActiveSubscribers45,
            recently_visited_active_cancelled_7: recentlyVisitedActiveCanceledSubscribers7,
            recently_visited_active_cancelled_45: recentlyVisitedActiveCanceledSubscribers45,
            average_monthly_revenue: averageMonthlyRevenue,
            block_users: totalBlockUsers
        }

        const data = {
            lastSeenOfModel,
            lastSeenOfContentManager,
            lastBlogTime,
            lastMassMessageTime,
            blogCount,
            massMessageCount
        }

        await updateLastSeenAndMessageDate(data, website_url)

        const existRecord = await WebsiteUserDetails.findOne({ domain: website_url })
        if (existRecord !== null) {
            await WebsiteUserDetails.findOneAndUpdate({ domain: website_url }, { $set: updatedRecords })
        } else {
            updatedRecords.domain = website_url
            const newWebsiteData = new WebsiteUserDetails(updatedRecords)
            await newWebsiteData.save()
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * update last seen on modal and content manager
 *
 * @param {object} data Last visited time of modal
 * @param {string} website_url domain name
 */
async function updateLastSeenAndMessageDate(data, website_url) {
    const influencerActivityData = {
        modal_last_seen: data.lastSeenOfModel === '' ? undefined : data.lastSeenOfModel,
        content_manager_last_seen: data.lastSeenOfContentManager === '' ? undefined : data.lastSeenOfContentManager,
        date_of_last_blog_added: data.lastBlogTime === '' ? undefined : data.lastBlogTime,
        date_of_last_mass_message: data.lastMassMessageTime === '' ? undefined : data.lastMassMessageTime,
        blog_count: data.blogCount === 0 ? undefined : data.blogCount,
        mass_message_count: data.massMessageCount === 0 ? undefined : data.massMessageCount
    }
    const existWebsite = await InfluencerActivity.findOne({ domain: website_url })
    if (existWebsite !== null) {
        await InfluencerActivity.findOneAndUpdate({ domain: website_url }, { $set: influencerActivityData })
    } else {
        influencerActivityData.domain = website_url
        const newInfluencerActivity = new InfluencerActivity(influencerActivityData)
        await newInfluencerActivity.save()
    }
}

module.exports = {
    getUserStatisticsFromWebsites
}
