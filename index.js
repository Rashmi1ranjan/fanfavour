require('dotenv').config()
// const mysql = require('mysql2')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
// const moment = require('moment')
const Sentry = require('@sentry/node')
const port = process.env.PORT || 8080
const fileupload = require('express-fileupload')
const getIpDetails = require('./controllers/getIpDetails')
const getTransactionDetails = require('./controllers/getTransactionDetails')
const appSettings = require('./controllers/appSettings')
const chargeByPrevious = require('./controllers/getChargeByPreviousDetails')
const getSubscriptionId = require('./controllers/getSubscriptionId')
const getUserAmountSpent = require('./controllers/getUserAmountSpent')
const sendCcbillErrorEmail = require('./controllers/sendCcbillErrorEmail')
const logCCBillError = require('./controllers/logCCBillError')
const getCountryStateCityList = require('./controllers/getCountryStateCityList')
const cbptErrorLog = require('./controllers/cbptErrorLog')
const users = require('./controllers/user')
const website = require('./controllers/website')
const server = require('./controllers/server')
const database = require('./controllers/database')
const modelEarning = require('./controllers/getModelEarning')
const { updateAppSettingsCache } = require('./utils/app-settings')
// const { generateDailyEarningReportByDate } = require('./dailyEarningReport')
const missingWebhooks = require('./controllers/getMissingWebhooks')
// const { loopAllWebsites } = require('./utils/verifyTransactionReport')
const CCBillErrorCodeDescription = require('./controllers/CCBillErrorCodeDescription')
const DeclineCodeDescription = require('./controllers/DeclineCodeDescription')
// const { removeCCBillErrorLog } = require('./utils/removeCCBillErrorLog')
const WebsiteReferralHistory = require('./controllers/websiteReferralHistory')
const analyticsUserCounts = require('./controllers/analyticsUserCounts')
const getWebsiteLiveStreamLog = require('./controllers/getWebsiteLiveStreamLog')
const checkWebsiteStatus = require('./controllers/checkWebsiteStatus')
const videoProcessingQueue = require('./controllers/videoProcessingQueue')
const ccbillTransactionLog = require('./controllers/ccbillTransactionLog')
const mfaSetting = require('./controllers/mfaSetting')
const webhookFromSendGrid = require('./controllers/getEmailWebhookFromSendGrid')
const ccbillDuplicateSubscriptionLog = require('./controllers/ccbillDuplicateSubscriptionLog')
const ccbillRestApiOauthErrorLog = require('./controllers/ccbillRestApiOauthErrorLog')
const ccbillRestApiAddCardLog = require('./controllers/ccbillRestApiAddCardLog')
const ccbillRestApiErrorCodeDescription = require('./controllers/ccbillRestApiErrorCodeDescription')
const promotionReport = require('./controllers/promotionReport')
const apiLimiter = require('./controllers/apiLimiterLogs')
const stickyIoTransactionImport = require('./controllers/stickyIoTransactionImport')
const stickyIoLogs = require('./controllers/stickyIoLogs')
const influencerHelp = require('./controllers/influencerHelp')
const awsSettings = require('./controllers/awsSettings')
const optInReport = require('./controllers/optInReport')
const CCBillTransactionReports = require('./controllers/CCBillTransactionReports')
const stickyIoTransactionReports = require('./controllers/stickyIoTransactionReports')
const chargebackAlert = require('./controllers/chargebackAlert')
const chargebackBlockUserLog = require('./controllers/chargebackBlockUserLog')
const stickyIoPaymentProfiles = require('./controllers/stickyIoPaymentProfiles')
const userMigrationSubscription = require('./controllers/userMigrationSubscription')
const earningDashboard = require('./controllers/earningDashboard')
const helpTags = require('./controllers/helpTags')
const hybridTransactionLog = require('./controllers/hybridTransactionLog')
const blockCode = require('./controllers/BlockCode')
const blockUser = require('./controllers/BlockUser')
const apiLimitConfiguration = require('./controllers/apiLimitConfiguration')
const websiteReferralController = require('./controllers/websiteReferral')
const suspiciousUser = require('./controllers/suspiciousUser')
const forumPayTransactionLog = require('./controllers/forumPayTransactionLog')
const wallet = require('./controllers/wallet')
const forumPayWebhook = require('./controllers/forumPayWebhook')
const package_version = require('./package.json').version
const packageVersion = package_version || '1.0.0'
const websiteUserStatistics = require('./controllers/websiteUserStatistics')
const voidsRefundsandChargebacks = require('./controllers/voidsRefundsandChargebacks')
const ForumPayTransactionReport = require('./controllers/forumPayTransactionReport')
const WrongUserSubscriptionLog = require('./controllers/wrongUserSubscriptionStatusLog')
const ContactUs = require('./controllers/contactUs')
const resubscriptionOfferReport = require('./controllers/resubscriptionOfferReport')
const InfluencerActivity = require('./controllers/influencerActivity')
const WebsiteAverageEarnings = require('./controllers/websiteAverageEarnings')
const WebsiteDataDump = require('./controllers/websiteDataDump')
const PWAInfo = require('./controllers/pwaInfo')
const HourlyTransaction = require('./controllers/hourlyTransactionChart')
const TransactionsCount = require('./controllers/transactionsCountChart')
const websiteCron = require('./controllers/websiteCron')
const userInfluencerHelp = require('./controllers/userInfluencerHelp')
const oneSignalAnalytic = require('./controllers/oneSignalAnalytic')
// Use for Subscription Statistics
const subscriptionStatistics = require('./controllers/subscriptionStatistics')
const universalLoginUserStatistics = require('./controllers/universalLoginUserStatistics')
const universalLoginLogger = require('./controllers/universalLoginLogger')
const universalLogin = require('./controllers/universalLogin')
const reports = require('./controllers/reports')
const universalLoginTransactionsAnalytics = require('./controllers/universalLoginTransactionsAnalytics')
const universalChat = require('./controllers/universalChatModel')
const activePayingSubscribersCount = require('./controllers/activePayingSubscribersCount')
const payingUserCountAnalytics = require('./controllers/payingUserCountAnalytics')
const storeUserAndTransactionInfo = require('./controllers/storeUserAndTransactionInfo')
const checkSiteIsActiveOrNot = require('./controllers/checkSiteIsActiveOrNot')
const sendGridWebhook = require('./controllers/sendGridWebhook')
const couponController = require('./controllers/coupon.controller')
const stoppedWebsiteList = require('./controllers/getStoppedWebsiteList')
const modelController = require('./controllers/fanFavourModel')
const fileUpload = require('./controllers/file-upload')
const emailNotificationWebsite = require('./controllers/getEmailNotificationData')
const fanFavourLogin = require('./controllers/fanFavourLogin')
const LinkTrackingReferral = require('./controllers/linkTrackingReferral')
const ffSSO = require('./controllers/ffSSO')
const topSpendingUserController = require('./controllers/topSpendingUser')
const blogData = require('./controllers/blogData')
const aggregatedFeed = require('./controllers/aggregatedFeed')

const connection = require('./utils/db')

// API Limiters
// const { apiLimiterForSSO } = require('./utils/apiLimiter')
const { protectWebsiteRoute } = require('./middleware/auth.middleware')
const { generateWebsiteSSOSecret } = require('./utils/manageSSOToken')
const { isConnected: isRedisConnected } = require('./utils/redis.util')

// Create a MySQL connection
if (process.env.MYSQL_HOST_NAME && process.env.MYSQL_USER_NAME && process.env.MYSQL_PASSWORD) {
    connection.connect((err) => {
        if (err) {
            console.error('MySQL connection error:', err)
            return
        }

        console.log('Connected to MySQL')
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS sendgrid_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255),
                event_type VARCHAR(50),
                timestamp DATETIME,
                sg_event_id VARCHAR(255),
                sg_message_id VARCHAR(255),
                reason TEXT,
                ip VARCHAR(45),
                useragent TEXT,
                url TEXT,
                user_id VARCHAR(45),
                tracking VARCHAR(45),
                domain VARCHAR(45),
                send_date VARCHAR(45),
                template_id VARCHAR(255)
            )
        `

        connection.query(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating table:', err)
            }
        })
    })
}

// DB Config
const db = process.env.MONGO_URI

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: 'https://3ededa314e394f1696508cccb2e0da09@o392495.ingest.sentry.io/5916409',
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
        ],
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 0.001,
        release: 'services-node@' + packageVersion
    })

    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
    app.use(Sentry.Handlers.errorHandler())
}

// Connect to MongoDB
mongoose
    .connect(
        db
    )
    .then(() => {
        console.log('Connected to Database')
        updateAppSettingsCache(() => {
            console.log('Cache Updated')
        })
        console.log('isRedisConnected', isRedisConnected())
        if (isRedisConnected()) {
            generateWebsiteSSOSecret()
        }
    })
    .catch((err) => {
        console.log('Not Connected to Database ERROR! ', err)
    })

app.use(cors())
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true
    })
)
app.use(bodyParser.json({ limit: '50mb' }))
app.use(fileupload({}))

app.get('/', (req, res) => res.send('Hello World!'))
app.use('/users/get_ip_details', getIpDetails)
app.use('/users/transactions', getTransactionDetails)
app.use('/users/app_settings', appSettings)
app.use('/users/charge_by_previous', chargeByPrevious)
app.use('/users/get_subscription_id', getSubscriptionId)
app.use('/users/get_user_amount_spent', getUserAmountSpent)
app.use('/users/send_ccbill_error_email', sendCcbillErrorEmail)
app.use('/users/log_ccbill_error', logCCBillError)
app.use('/users/get_country_state_city', getCountryStateCityList)
app.use('/api/cbpt_error_logs', cbptErrorLog)
app.use('/users', users)
app.use('/users/website', website)
app.use('/users/server', server)
app.use('/users/database', database)
app.use('/users/earning_report', modelEarning)
app.use('/webhooks', missingWebhooks)
app.use('/users/ccbill_error_description', CCBillErrorCodeDescription)
app.use('/users/decline_code_description', DeclineCodeDescription)
app.use('/users/website_referral_history', WebsiteReferralHistory)
app.use('/analytics/user_count', analyticsUserCounts)
app.use('/liveStream', getWebsiteLiveStreamLog)
app.use('/websites', checkWebsiteStatus)
app.use('/video-processing', videoProcessingQueue)
app.use('/ccbill-transaction-log', ccbillTransactionLog)
app.use('/mfa', mfaSetting)
app.use('/webhook', webhookFromSendGrid)
app.use('/ccbill-duplicate-subscription', ccbillDuplicateSubscriptionLog)
app.use('/ccbill-rest-api-oauth-error', ccbillRestApiOauthErrorLog)
app.use('/ccbill-add-card-log', ccbillRestApiAddCardLog)
app.use('/ccbill-rest-api-error-code', ccbillRestApiErrorCodeDescription)
app.use('/promotion-report', promotionReport)
app.use('/api_limiter', apiLimiter)
app.use('/sticky-io-transaction', stickyIoTransactionImport)
app.use('/users/get_user_amount_spent/sticky-io', getUserAmountSpent)
app.use('/sticky-io', stickyIoLogs)
app.use('/help', influencerHelp)
app.use('/settings', awsSettings)
app.use('/opt-in-report', optInReport)
app.use('/ccbill-transactions', CCBillTransactionReports)
app.use('/sticky-io', stickyIoTransactionReports)
app.use('/chargeback-alert', chargebackAlert)
app.use('/chargeback-block-user', chargebackBlockUserLog)
app.use('/payment_profiles', stickyIoPaymentProfiles)
app.use('/payment', hybridTransactionLog)
app.use('/report', express.static('temp'))
app.use('/user', userMigrationSubscription)
app.use('/earning', earningDashboard)
app.use('/suspicious-user', suspiciousUser)
app.use('/help', helpTags)
app.use('/api/website_average_earnings', WebsiteAverageEarnings)
app.use('/api', blockCode)
app.use('/api', blockUser)
app.use('/api-limit', apiLimitConfiguration)
app.use('/website-referral', websiteReferralController)
app.use('/forum-pay', forumPayTransactionLog)
app.use('/wallet', wallet)
app.use('/forum-pay-webhook', forumPayWebhook)
app.use('/api', websiteUserStatistics)
app.use('/refundAndChargeback', voidsRefundsandChargebacks)
app.use('/forum_pay_transaction_report', ForumPayTransactionReport)
app.use('/api', WrongUserSubscriptionLog)
app.use('/contact_us', ContactUs)
app.use('/resubscription', resubscriptionOfferReport)
app.use('/api', InfluencerActivity)
app.use('/api/pwa', PWAInfo)
app.use('/api/subscription-statistics', subscriptionStatistics)
app.use('/api/websiteDataDump', WebsiteDataDump)
app.use('/api/hourly-transaction', HourlyTransaction)
app.use('/api/transactions-count', TransactionsCount)
app.use('/website-cron', websiteCron)
app.use('/user-help', userInfluencerHelp)
app.use('/api/one-signal-analytics', oneSignalAnalytic)
app.use('/api/universal-login-user-statistics', universalLoginUserStatistics)
app.use('/api/universal-login-logger', universalLoginLogger)
app.use('/api/universal-login', universalLogin)
app.use('/api/reports', reports)
app.use('/api/universal-login-transactions', universalLoginTransactionsAnalytics)
app.use('/universal-chat', universalChat)
app.use('/api/active-paying-subscriber-counts', activePayingSubscribersCount)
app.use('/api/paying-user-analytics', payingUserCountAnalytics)
app.use('/api/user-data', storeUserAndTransactionInfo)
app.use('/api/check-if-site-is-active', checkSiteIsActiveOrNot)
app.use('/', sendGridWebhook)
app.use('/api/coupon', couponController)
app.use('/', stoppedWebsiteList)
app.use('/model', modelController)
app.use('/api/upload', fileUpload)
app.use('/api', emailNotificationWebsite)
app.use('/api', fanFavourLogin)
app.use('/link-tracking-referral', LinkTrackingReferral)
app.use('/ff-sso', [protectWebsiteRoute], ffSSO)
app.use('/api', topSpendingUserController)
app.use('/api/blogs', blogData)
app.use('/api/aggregated-feed', aggregatedFeed)

require('./controllers/calculateCharge')(app)

app.listen(port, () => {
    console.log(`Server up and running on port ${port} !`)
})
