import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import RootStore from './store/Root'
import LoginPage from './components/LoginPage'
import DashboardPage from './components/dashboard/DashboardPage'
import PageNotFound from './components/PageNotFound'
import CCBillSuccessErrorLogs from './components/ccbillerrorlog/CCBillSuccessErrorLogs'
import Website from './components/websiteConfig/Website'
import AddWebsite from './components/websiteConfig/AddWebsite'
import Server from './components/server/Server'
import AddServer from './components/server/AddServer'
import Database from './components/databaseserver/database'
import AddDatabase from './components/databaseserver/AddDatabase'
import WebsiteCommission from './components/websiteCommission/WebsiteCommission'
import MonthlyEarningReport from './components/earningReport/MonthlyEarningReport'
import DailyEarningReport from './components/earningReport/DailyEarningReport'
import MissingWebhook from './components/missingwebhooks/MissingWebhook'
import DeclineCodeDescriptionPage from './components/ccbillErrorLogDescription/DeclineCodeDescription'
import AddDeclineCodeDescription from './components/ccbillErrorLogDescription/AddDeclineCodeDescription'
import CCBillErrorCodeDescription from './components/ccbillErrorLogDescription/CCBillErrorCodeDescription'
import AddCCBillErrorCodeDescription from './components/ccbillErrorLogDescription/AddCCBillErrorCodeDescription'
import CCBillSummaryReport from './components/dashboard/CCBillSummaryReport'
import WebsiteReferralHistory from './components/websiteReferralHistory/WebsiteReferralHistory'
import AddWebsiteReferral from './components/websiteReferralHistory/AddWebsiteReferral'
import UserCountReport from './components/analytics/UserCountReport'
import UserReportExport from './components/analytics/UserReportExport'
import RevenueReportExport from './components/analytics/RevenueReportExport'
import WebsiteLiveStreamLog from './components/websiteLiveStream/WebsiteLiveStreamLog'
import WebsiteStatusCheck from './components/websiteStatusCheck/WebsiteStatusCheck'
import MfaSetting from './components/mfaSetting/MfaSetting'
import CCbillSubscriptionErrorLog from './components/ccbillDuplicateSubscriptionErrorLog/ccbillDuplicateSubscriptionErrorLog'
import CCBillRestApiAddCardLog from './components/ccbillRestApiAddCardLog/ccbillRestApiAddCardLog'
import CCBillRestApiOauthErrorLog from './components/ccbillRestApiOauthErrorLog/ccbillRestApiOauthErrorLog'
import EditDeclineCodeDescription from './components/ccbillErrorLogDescription/EditDeclineCodeDescription'
import EditCCBillErrorCodeDescription from './components/ccbillErrorLogDescription/EditCCBillErrorCodeDescription'
import CCBillRestApiErrorCodeDescription from './components/CCBillRestApiErrorCodeDescription/CCBillRestApiErrorCodeDescription'
import AddCCBillRestApiErrorCodeDescription from './components/CCBillRestApiErrorCodeDescription/AddCCBillRestApiErrorCodeDescription'
import EditCCBillRestApiErrorCodeDescription from './components/CCBillRestApiErrorCodeDescription/EditCCBillRestApiErrorCodeDescription'
import SendGridWebhookLog from './components/sendGridWebhook/SendGridWebhook'
import CCBillRestApiReportingByDomain from './components/ccbillRestApiAddCardLog/CCBillRestApiReportingByDomain'
import PromotionReport from './components/promotionReport/PromotionReport'
import ApiLimiter from './components/apiLimiterLogs/ApiLimiterLogs'
import ImportTransaction from './components/stickyIo/ImportTransaction'
import StickyIoSuccessErrorLogs from './components/stickyIoLogs/StickyIoSuccessErrorLogs'
import StickyIoSummaryReport from './components/dashboard/StickyIoSummaryReport'
import InfluencerHelp from './components/influencerHelp/InfluencerHelp'
import AddOrUpdateHelp from './components/influencerHelp/AddOrUpdateHelp'
import AwsSettings from './components/awsSettings/AddAwsSettings'
import OptInReport from './components/sendGridWebhook/OptInReport'
import CCBillTransactionReports from './components/CCBillTransactionReports/CCBillTransactionReports'
import StickyIoTransactionReports from './components/stickyIoTransactionReports/stickyIoTransactionReports'
import ChargebackBlockUserLogs from './components/chargebackBlockUserLogs/ChargebackBlockUserLogs'
import DefaultContainer from './components/layout/DefaultContainer'
import StickyIoPaymentProfiles from './components/stickyIoPaymentProfiles/StickyIoPaymentProfiles'
import EarningDashboard from './components/earningDashboard/EarningDashboard'
import WebsiteMonthlyEarningReport from './components/earningReport/WebsiteMonthlyEarning'
import HelpTags from './components/helpTags/helpTags'
import AddOrUpdateHelpTags from './components/helpTags/AddOrUpdateHelpTags'
import HybridTransactionCountLogs from './components/hybridTransactionLogs/HybridTransactionCountLogs'
import HybridTransactionList from './components/hybridTransactionLogs/HybridTransactionList'
import HybridTransactionSummary from './components/hybridTransactionLogs/HybridTransactionSummary'
import ApiLimitConfigurationList from './components/apiLimitConfiguration/ApiLimitConfigurationList'
import AddApiLimitConfiguration from './components/apiLimitConfiguration/AddApiLimitConfiguration'
import EditApiLimitConfiguration from './components/apiLimitConfiguration/EditApiLimitConfiguration'
import AutoBlockUserLog from './components/autoBlockUserLog/AutoBlockUserLog'
import ChargebackEvents from './components/chargebackEvents/ChargebackEvents'
import { observer } from 'mobx-react-lite'
import BlockCode from './components/BlockCode/AddBlockCode'
import BlockCodeList from './components/BlockCode/BlockCodeList'
import EditBlockCode from './components/BlockCode/EditBlockCode'
import AddBlockUser from './components/BlockUser/AddBlockUser'
import BlockUserList from './components/BlockUser/BlockUserList'
import EditBlockUser from './components/BlockUser/EditBlockUser'
import WebsiteBlockedUserList from './components/userLookup/UserLookup'
import WebsiteReferral from './components/websiteReferralHistory/WebsiteReferral'
import AddOrUpdateWebsiteReferral from './components/websiteReferralHistory/AddOrUpdateWebsiteReferralMaster'
import WebsiteReferralMonthlyEarningReport from './components/earningReport/WebsiteReferralMonthlyEarningReport'
import ForumPayTransactionHistory from './components/ForumPayTransactionHistory/ForumPayTransactionHistory'
import WebsiteUserStatistics from './components/websiteUserStatistics/WebsiteUserStatistics'
import Country from './components/country-state-city/Country'
import State from './components/country-state-city/State'
import City from './components/country-state-city/City'
import SuspiciousUser from './components/suspiciousUser/SuspiciousUser'
import ForumPayWebhooks from './components/ForumPayTransactionHistory/ForumPayWebhooks'
import UserWalletBalance from './components/ForumPayTransactionHistory/UserWalletBalance'
import ForumPayTransactionReport from './components/ForumPayTransactionHistory/ForumPayTransactionReport'
import ForumPayTransactionStatistics from './components/ForumPayTransactionHistory/ForumPayTransactionStatistics'
import WrongUserSubscriptionStatusLog from './components/wrongUserSubscriptionStatusLog/wrongUserSubscriptionStatusLog'
import ContactUs from './components/contactUs/ContactUs'
import ResubscriptionReport from './components/ResubscriptionReport/ResubscriptionReport'
import InfluencerActivity from './components/influencerActivity/influencerActivity'
import PWAInfo from './components/pwa/PWAInfo'
import OneSignalAnalytics from './components/oneSignal/OneSignalAnalytics'
import WebsiteCronStatus from './components/cronStatus/WebsiteCronStatus'
import SubscriptionStatistics from './components/subscriptionStatistics/subscriptionStatistics'
import UniversalLoginEventLogs from './components/universalLogin/UniversalLoginEventLogs'
import UniversalUserDetails from './components/universalLogin/UniversalUserDetails'
import UniversalLoginUserCards from './components/universalLogin/UniversalLoginUserCards'
import AllWebsiteUserDetails from './components/universalLogin/AllWebsiteUserDetails'
import VideoProcessingQueue from './components/videoProcessing/Queue'
import VideoProcessingErrors from './components/videoProcessing/Errors'
import VideoProcessingHealth from './components/videoProcessing/Health'
import Statistics from './components/universalLogin/Statistics'
import EmailStatistics from './components/emailStatistics/Email'
import FanFavour from './components/FanFavour/FanFavour'
import AddModel from './components/FanFavour/AddModel'
import ChangeFeaturedModelText from './components/FanFavour/ChangeFeaturedModelText'
import LinkTrackingReferral from './components/LinkTrackingReferralHistory/LinkTrackingReferral'
import AddOrUpdateLinkTrackingReferral from './components/LinkTrackingReferralHistory/AddOrUpdateLinkTrackingReferral'
import LinkTrackingWebsiteReferralMonthlyEarningReport from './components/earningReport/LinkTrackingWebsiteReferralMonthlyEarningReport'
import LinkTrackingAnalytics from './components/LinkTrackingReferralHistory/LinkTrackingAnalytics'
import AddOrUpdateUser from './components/LinkTrackingReferralHistory/AddOrUpdateUser'
import MangeLinkTrackingUsers from './components/LinkTrackingReferralHistory/MangeLinkTrackingUsers'

const rootStore = new RootStore()

const App: React.FC = observer(() => {
    return <Router>
        {rootStore.authStore.isUserLoggedIn === true &&
            <DefaultContainer rootStore={rootStore} />
        }
        <Routes>
            <Route path='/' element={<DashboardPage rootStore={rootStore} />} />
            <Route path='/login' element={<LoginPage rootStore={rootStore} />} />
            <Route path='/dashboard' element={<DashboardPage rootStore={rootStore} />} />
            <Route path='/ccbill_success_error_logs' element={<CCBillSuccessErrorLogs rootStore={rootStore} />} />
            <Route path='/websites' element={<Website rootStore={rootStore} />} />
            <Route path='/add_website' element={<AddWebsite rootStore={rootStore} />} />
            <Route path='/edit_website/:id' element={<AddWebsite rootStore={rootStore} />} />
            <Route path='/website_referral_history' element={<WebsiteReferralHistory rootStore={rootStore} />} />
            <Route path='/add_website_referral' element={<AddWebsiteReferral rootStore={rootStore} />} />
            <Route path='/edit_website_referral/:id' element={<AddWebsiteReferral rootStore={rootStore} />} />
            <Route path='/servers' element={<Server rootStore={rootStore} />} />
            <Route path='/add_server' element={<AddServer rootStore={rootStore} />} />
            <Route path='/edit_server/:id' element={<AddServer rootStore={rootStore} />} />
            <Route path='/databases' element={<Database rootStore={rootStore} />} />
            <Route path='/add_database' element={<AddDatabase rootStore={rootStore} />} />
            <Route path='/edit_database/:id' element={<AddDatabase rootStore={rootStore} />} />
            <Route path='/websitecommission' element={<WebsiteCommission rootStore={rootStore} />} />
            <Route path='/export-monthly-earning-reports' element={<MonthlyEarningReport rootStore={rootStore} />} />
            <Route path='/dailyearningreport' element={<DailyEarningReport rootStore={rootStore} />} />
            <Route path='/missingwebhooks' element={<MissingWebhook rootStore={rootStore} />} />
            <Route path='/decline_code_description' element={<DeclineCodeDescriptionPage rootStore={rootStore} />} />
            <Route path='/add_decline_code_description' element={<AddDeclineCodeDescription rootStore={rootStore} />} />
            <Route path='/edit_decline_code_description/:id' element={<EditDeclineCodeDescription rootStore={rootStore} />} />
            <Route path='/ccbill_error_code_description' element={<CCBillErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/add_ccbill_error_code_description' element={<AddCCBillErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/edit_ccbill_error_code_description/:id' element={<EditCCBillErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/ccbill_summary_report' element={<CCBillSummaryReport rootStore={rootStore} />} />
            <Route path='/analytics/user_count' element={<UserCountReport rootStore={rootStore} />} />
            <Route path='/analytics/export' element={<UserReportExport rootStore={rootStore} />} />
            <Route path='/analytics/revenue/export' element={<RevenueReportExport rootStore={rootStore} />} />
            <Route path='/liveStream/log' element={<WebsiteLiveStreamLog rootStore={rootStore} />} />
            <Route path='/website/check-status' element={<WebsiteStatusCheck rootStore={rootStore} />} />
            <Route path='/mfa_setting' element={<MfaSetting rootStore={rootStore} />} />
            <Route path='/ccbill_duplicate_subscription_error_log' element={<CCbillSubscriptionErrorLog rootStore={rootStore} />} />
            <Route path='/add_card_logs' element={<CCBillRestApiAddCardLog rootStore={rootStore} />} />
            <Route path='/ccbill_rest_api_error_log' element={<CCBillRestApiOauthErrorLog rootStore={rootStore} />} />
            <Route path='/ccbill_rest_api_error_code_description' element={<CCBillRestApiErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/add_ccbill_rest_api_error_code_description' element={<AddCCBillRestApiErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/edit_ccbill_rest_api_error_code_description/:id' element={<EditCCBillRestApiErrorCodeDescription rootStore={rootStore} />} />
            <Route path='/sendGridWebhook' element={<SendGridWebhookLog rootStore={rootStore} />} />
            <Route path='/ccbill_rest_api_reporting_by_domain' element={<CCBillRestApiReportingByDomain rootStore={rootStore} />} />
            <Route path='/promotion_report' element={<PromotionReport rootStore={rootStore} />} />
            <Route path='/api_limiter_logs' element={<ApiLimiter rootStore={rootStore} />} />
            <Route path='/sticky-io/import-transaction' element={<ImportTransaction rootStore={rootStore} />} />
            <Route path='/sticky_io_success_error_logs' element={<StickyIoSuccessErrorLogs rootStore={rootStore} />} />
            <Route path='/sticky_io_summary_report' element={<StickyIoSummaryReport rootStore={rootStore} />} />
            <Route path='/influencer-help' element={<InfluencerHelp rootStore={rootStore} />} />
            <Route path='/add-influencer' element={<AddOrUpdateHelp rootStore={rootStore} />} />
            <Route path='/edit-influencer/:id' element={<AddOrUpdateHelp rootStore={rootStore} />} />
            <Route path='/settings' element={<AwsSettings rootStore={rootStore} />} />
            <Route path='/optInReport' element={<OptInReport rootStore={rootStore} />} />
            <Route path='/ccbill-transactions' element={<CCBillTransactionReports rootStore={rootStore} />} />
            <Route path='/sticky_io_transactions_report' element={<StickyIoTransactionReports rootStore={rootStore} />} />
            <Route path='/chargeback_blocked_user_logs' element={<ChargebackBlockUserLogs rootStore={rootStore} />} />
            <Route path='/sticky_io_payment_profiles' element={<StickyIoPaymentProfiles rootStore={rootStore} />} />
            <Route path='/earning-dashboard' element={<EarningDashboard rootStore={rootStore} />} />
            <Route path='/monthly-earning-reports' element={<WebsiteMonthlyEarningReport rootStore={rootStore} />} />
            <Route path='/influencer-help-tags' element={<HelpTags rootStore={rootStore} />} />
            <Route path='/influencer-help-tags/add' element={<AddOrUpdateHelpTags rootStore={rootStore} />} />
            <Route path='/influencer-help-tags/edit/:id' element={<AddOrUpdateHelpTags rootStore={rootStore} />} />
            <Route path='/hybrid-transaction-log-summary' element={<HybridTransactionCountLogs rootStore={rootStore} />} />
            <Route path='/hybrid-transaction-log-list' element={<HybridTransactionList rootStore={rootStore} />} />
            <Route path='/hybrid-transaction-summary' element={<HybridTransactionSummary rootStore={rootStore} />} />
            <Route path='/block-code' element={<BlockCode rootStore={rootStore} />} />
            <Route path='/block-code-list' element={<BlockCodeList rootStore={rootStore} />} />
            <Route path='/edit-block-code/:id' element={<EditBlockCode rootStore={rootStore} />} />
            <Route path='/add-block-user' element={<AddBlockUser rootStore={rootStore} />} />
            <Route path='/block-user-list' element={<BlockUserList rootStore={rootStore} />} />
            <Route path='/edit-block-user/:id' element={<EditBlockUser rootStore={rootStore} />} />
            <Route path='/api-limit-configuration-list' element={<ApiLimitConfigurationList rootStore={rootStore} />} />
            <Route path='/add-api-limit-configuration' element={<AddApiLimitConfiguration rootStore={rootStore} />} />
            <Route path='/edit-api-limit-configuration/:id' element={<EditApiLimitConfiguration rootStore={rootStore} />} />
            <Route path='/auto-block-user-log' element={<AutoBlockUserLog rootStore={rootStore} />} />
            <Route path='/chargeback-alerts' element={<ChargebackEvents rootStore={rootStore} />} />
            <Route path='/user-lookup' element={<WebsiteBlockedUserList rootStore={rootStore} />} />
            <Route path='/website-referral' element={<WebsiteReferral rootStore={rootStore} />} />
            <Route path='/add-referral' element={<AddOrUpdateWebsiteReferral rootStore={rootStore} />} />
            <Route path='/edit-referral/:id' element={<AddOrUpdateWebsiteReferral rootStore={rootStore} />} />
            <Route path='/website-referral-monthly-earning-report' element={<WebsiteReferralMonthlyEarningReport rootStore={rootStore} />} />
            <Route path='/forumpay-transaction-history' element={<ForumPayTransactionHistory rootStore={rootStore} />} />
            <Route path='/subscription-count' element={<WebsiteUserStatistics rootStore={rootStore} />} />
            <Route path='/country-list' element={<Country rootStore={rootStore} />} />
            <Route path='/state-list' element={<State rootStore={rootStore} />} />
            <Route path='/city-list' element={<City rootStore={rootStore} />} />
            <Route path='/suspicious-user' element={<SuspiciousUser rootStore={rootStore} />} />
            <Route path='/forumpay-webhook-logs' element={<ForumPayWebhooks rootStore={rootStore} />} />
            <Route path='/user-wallet-balance' element={<UserWalletBalance rootStore={rootStore} />} />
            <Route path='/wallet-transaction-reports' element={<ForumPayTransactionReport rootStore={rootStore} />} />
            <Route path='/forumpay-transaction-statistics' element={<ForumPayTransactionStatistics rootStore={rootStore} />} />
            <Route path='/wrong-user-subscription-status-log' element={<WrongUserSubscriptionStatusLog rootStore={rootStore} />} />
            <Route path='/contact-us' element={<ContactUs rootStore={rootStore} />} />
            <Route path='/resubscription-report' element={<ResubscriptionReport rootStore={rootStore} />} />
            <Route path='/influencer-activity' element={<InfluencerActivity rootStore={rootStore} />} />
            <Route path='/pwa-info' element={<PWAInfo rootStore={rootStore} />} />
            <Route path='/website/cron-status' element={<WebsiteCronStatus rootStore={rootStore} />} />
            <Route path='/one-signal-analytics' element={<OneSignalAnalytics rootStore={rootStore} />} />
            <Route path='/subscription-statistics' element={<SubscriptionStatistics rootStore={rootStore} />} />
            <Route path='/universal-login-logs' element={<UniversalLoginEventLogs rootStore={rootStore} />} />
            <Route path='/universal-login-users' element={<UniversalUserDetails rootStore={rootStore} />} />
            <Route path='/all-website-users' element={<AllWebsiteUserDetails rootStore={rootStore} />} />
            <Route path='/universal-login-cards' element={<UniversalLoginUserCards rootStore={rootStore} />} />
            <Route path='/video-processing/queue' element={<VideoProcessingQueue rootStore={rootStore} />} />
            <Route path='/video-processing/errors' element={<VideoProcessingErrors rootStore={rootStore} />} />
            <Route path='/video-processing/health' element={<VideoProcessingHealth rootStore={rootStore} />} />
            <Route path='/universal-login-statistics' element={<Statistics rootStore={rootStore} />} />
            <Route path='/model-list' element={<FanFavour rootStore={rootStore} />} />
            <Route path='/add-model' element={<AddModel rootStore={rootStore} />} />
            <Route path='/edit-model/:id' element={<AddModel rootStore={rootStore} />} />
            <Route path='/change-featured-model-text' element={<ChangeFeaturedModelText rootStore={rootStore} />} />
            <Route element={<PageNotFound rootStore={rootStore} />} />
            <Route path='/email' element={<EmailStatistics rootStore={rootStore} />} />
            <Route path='/link-tracking-referral' element={<LinkTrackingReferral rootStore={rootStore} />} />
            <Route path='/add-link-tracking-referral' element={<AddOrUpdateLinkTrackingReferral rootStore={rootStore} />} />
            <Route path='/edit-link-tracking-referral/:id' element={<AddOrUpdateLinkTrackingReferral rootStore={rootStore} />} />
            <Route path='/link-tracking-website-referral-monthly-earning-report' element={<LinkTrackingWebsiteReferralMonthlyEarningReport rootStore={rootStore} />} />
            <Route path='/analytics/link-tracking' element={<LinkTrackingAnalytics rootStore={rootStore} />} />
            <Route path='/link-tracking-users/add-user' element={<AddOrUpdateUser rootStore={rootStore} />} />
            <Route path='/link-tracking-users/edit-user/:id' element={<AddOrUpdateUser rootStore={rootStore} />} />
            <Route path='/link-tracking-users' element={<MangeLinkTrackingUsers rootStore={rootStore} />} />
        </Routes>
    </Router>
})

export default App
