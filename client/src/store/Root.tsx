import AuthStore from './Auth'
import 'mobx-react-lite/batchingForReactDom'
import NavStore from './Nav'
import SideMenuStore from './SideMenuStore'
import CcbillErrorStore from './CcbillError'
import Website from './Website'
import Dashboard from './Dashboard'
import Server from './Server'
import Database from './Database'
import EarningReport from './EarningReport'
import MissingWebhook from './MissingWebhook'
import DeclineCodeDescriptionStore from './DeclineCodeDescription'
import CCBillErrorCodeDescriptionStore from './CCBillErrorCodeDescription'
import SummaryReportStore from './CCBillSummaryReport'
import WebsiteReferralHistory from './WebsiteReferralHistory'
import UserCountAnalyticsStore from './UserCountAnalytics'
import AnalyticsReportStore from './AnalyticsReportStore'
import AnalyticsRevenueReportStore from './AnalyticsRevenueReportStore'
import WebsiteLiveStreamStore from './WebsiteLiveStreamStore'
import WebsiteStatusStore from './WebsiteStatusStore'
import MfaSettingStore from './MfaSetting'
import CCBillDuplicateSubscriptionLogStore from './CCbillDuplicateSubscription'
import CCBillRestApiOauthErrorLogStore from './CCBillRestApiOauthErrorLog'
import CCBillRestApiAddCardLogStore from './CCBillRestApiAddCardLog'
import CCBillRestApiErrorCodeDescriptionStore from './CCBillRestApiErrorCodeDescription'
import sendGridWebhookStore from './SendGridWebhook'
import CCBillRestApiReportingByDomainStore from './CCBillRestApiReportingByDomain'
import PromotionReportStore from './PromotionReportStore'
import ApiLimiterReport from './ApiLimiterReportStore'
import StickyIoTransactionImport from './StickyIoTransactionImportStore'
import StickyIoLogsStore from './StickyIoLogsStore'
import StickyIoSummaryReportStore from './StickyIoSummaryReportStore'
import InfluencerHelpStore from './InfluencerHelpStore'
import AwsSettingsStore from './AwsSettingsStore'
import OptInReportStore from './OptInReportStore'
import CCBillTransactionReportsStore from './CCBillTransactionReports'
import StickyIoTransactionReportsStore from './StickyIoTransactionReportsStore'
import ChargebackBlockUserLogStore from './ChargebackBlockUserLogStore'
import StickyIoPaymentProfilesStore from './StickyIoPaymentProfilesStore'
import EarningDashboardStore from './EarningDashboardStore'
import HelpTagsStore from './HelpTags'
import HybridTransactionStore from './HybridTransactionStore'
import HybridTransactionLogListStore from './HybridTransactionLogListStore'
import BlockCodeStore from './BlockCodeStore'
import BlockUserStore from './BlockUserStore'
import ApiLimitConfigurationStore from './ApiLimitConfigurationStore'
import AutoBlockUserLogStore from './AutoBlockUserLogStore'
import ChargebackAlertStore from './ChargebackAlertStore'
import UserLookupStore from './UserLookupStore'
import WebsiteReferralStore from './WebsiteReferralStore'
import WebsiteReferralEarningReport from './WebsiteReferralMonthlyEarningReportStore'
import SuspiciousUserStore from './SuspiciousUserStore'
import ForumPayTransactionHistoryStore from './ForumPayTransactionHistoryStore'
import ForumPayWebhookStore from './ForumPayWebhookStore'
import UserWalletBalanceStore from './UserWalletBalanceStore'
import ForumPayTransactionReportStore from './ForumPayTransactionReportStore'
import ForumPayTransactionStatisticsStore from './ForumPayTransactionStatisticsStore'
import WrongUserSubscriptionStatusStore from './WrongUserSubscriptionStatusStore'
import ContactUsStore from './ContactUsStore'
import WebsiteUserStatisticsStore from './WebsiteUserStatisticsStore'
import ResubscriptionReport from './ResubscriptionReportStore'
import InfluencerActivityStore from './InfluencerActivityStore'
import PWAInfoStore from './PWAInfoStore'
import WebsiteCronStatusStore from './WebsiteCronStatus'
import OneSignalAnalyticsStore from './OneSignalAnalytics'
import SubscriptionStatisticsStore from './SubscriptionStatisticsStore'
import UniversalLoginLogsStore from './UniversalLoginLogsStore'
import UniversalLoginStore from './UniversalLoginStore'
import VideoProcessingStore from './VideoProcessingStore'
import EmailStore from './EmailStore'
import ModelStore from './ModelStore'
import LinkTrackingReferralStore from './LinkTrackingReferralStore'
import LinkTrackingWebsiteReferralMonthlyEarningReportStore from './LinkTrackingWebsiteReferralMonthlyEarningReportStore'

class RootStore {
    public authStore: AuthStore
    public navStore: NavStore
    public sideMenuStore: SideMenuStore
    public ccbillErrorStore: CcbillErrorStore
    public websiteStore: Website
    public dashboard: Dashboard
    public serverStore: Server
    public databaseStore: Database
    public earningReportStore: EarningReport
    public missingWebhookStore: MissingWebhook
    public declineCodeDescriptionStore: DeclineCodeDescriptionStore
    public ccbillErrorCodeDescriptionStore: CCBillErrorCodeDescriptionStore
    public summaryReportStore: SummaryReportStore
    public websiteReferralHistory: WebsiteReferralHistory
    public UserCountAnalyticsStore: UserCountAnalyticsStore
    public AnalyticsReportStore: AnalyticsReportStore
    public AnalyticsRevenueReportStore: AnalyticsRevenueReportStore
    public WebsiteLiveStreamStore: WebsiteLiveStreamStore
    public WebsiteStatusStore: WebsiteStatusStore
    public MfaSettingStore: MfaSettingStore
    public CCBillDuplicateSubscriptionLogStore: CCBillDuplicateSubscriptionLogStore
    public CCBillRestApiOauthErrorLogStore: CCBillRestApiOauthErrorLogStore
    public CCBillRestApiAddCardLogStore: CCBillRestApiAddCardLogStore
    public CCBillRestApiErrorCodeDescriptionStore: CCBillRestApiErrorCodeDescriptionStore
    public sendGridWebhookStore: sendGridWebhookStore
    public CCBillRestApiReportingByDomainStore: CCBillRestApiReportingByDomainStore
    public PromotionReportStore: PromotionReportStore
    public ApiLimiterReport: ApiLimiterReport
    public StickyIoTransactionImport: StickyIoTransactionImport
    public StickyIoLogs: StickyIoLogsStore
    public StickyIoSummaryReportStore: StickyIoSummaryReportStore
    public InfluencerHelpStore: InfluencerHelpStore
    public AwsSettingsStore: AwsSettingsStore
    public OptInReportStore: OptInReportStore
    public CCBillTransactionReportsStore: CCBillTransactionReportsStore
    public StickyIoTransactionReportsStore: StickyIoTransactionReportsStore
    public ChargebackBlockUserLogStore: ChargebackBlockUserLogStore
    public StickyIoPaymentProfilesStore: StickyIoPaymentProfilesStore
    public EarningDashboardStore: EarningDashboardStore
    public HelpTagsStore: HelpTagsStore
    public HybridTransactionStore: HybridTransactionStore
    public HybridTransactionLogListStore: HybridTransactionLogListStore
    public BlockCodeStore: BlockCodeStore
    public BlockUserStore: BlockUserStore
    public ApiLimitConfigurationStore: ApiLimitConfigurationStore
    public AutoBlockUserLogStore: AutoBlockUserLogStore
    public ChargebackAlertStore: ChargebackAlertStore
    public UserLookupStore: UserLookupStore
    public WebsiteReferralStore: WebsiteReferralStore
    public WebsiteReferralEarningReport: WebsiteReferralEarningReport
    public SuspiciousUserStore: SuspiciousUserStore
    public ForumPayTransactionHistoryStore: ForumPayTransactionHistoryStore
    public ForumPayWebhookStore: ForumPayWebhookStore
    public UserWalletBalanceStore: UserWalletBalanceStore
    public ForumPayTransactionReportStore: ForumPayTransactionReportStore
    public ForumPayTransactionStatisticsStore: ForumPayTransactionStatisticsStore
    public WrongUserSubscriptionStatusStore: WrongUserSubscriptionStatusStore
    public ContactUsStore: ContactUsStore
    public WebsiteUserStatisticsStore: WebsiteUserStatisticsStore
    public ResubscriptionReport: ResubscriptionReport
    public InfluencerActivityStore: InfluencerActivityStore
    public PWAInfoStore: PWAInfoStore
    public WebsiteCronStatusStore: WebsiteCronStatusStore
    public OneSignalAnalyticsStore: OneSignalAnalyticsStore
    public SubscriptionStatisticsStore: SubscriptionStatisticsStore
    public UniversalLoginLogsStore: UniversalLoginLogsStore
    public UniversalLoginStore: UniversalLoginStore
    public VideoProcessingStore: VideoProcessingStore
    public EmailStore: EmailStore
    public ModelStore: ModelStore
    public LinkTrackingReferralStore: LinkTrackingReferralStore
    public LinkTrackingWebsiteReferralMonthlyEarningReportStore: LinkTrackingWebsiteReferralMonthlyEarningReportStore

    constructor() {
        this.authStore = new AuthStore(this)
        this.navStore = new NavStore(this)
        this.sideMenuStore = new SideMenuStore(this)
        this.ccbillErrorStore = new CcbillErrorStore(this)
        this.websiteStore = new Website(this)
        this.dashboard = new Dashboard(this)
        this.serverStore = new Server(this)
        this.databaseStore = new Database(this)
        this.earningReportStore = new EarningReport(this)
        this.missingWebhookStore = new MissingWebhook(this)
        this.declineCodeDescriptionStore = new DeclineCodeDescriptionStore(this)
        this.ccbillErrorCodeDescriptionStore = new CCBillErrorCodeDescriptionStore(this)
        this.summaryReportStore = new SummaryReportStore(this)
        this.websiteReferralHistory = new WebsiteReferralHistory(this)
        this.UserCountAnalyticsStore = new UserCountAnalyticsStore(this)
        this.AnalyticsReportStore = new AnalyticsReportStore(this)
        this.AnalyticsRevenueReportStore = new AnalyticsRevenueReportStore(this)
        this.WebsiteLiveStreamStore = new WebsiteLiveStreamStore(this)
        this.WebsiteStatusStore = new WebsiteStatusStore(this)
        this.MfaSettingStore = new MfaSettingStore(this)
        this.CCBillDuplicateSubscriptionLogStore = new CCBillDuplicateSubscriptionLogStore(this)
        this.CCBillRestApiOauthErrorLogStore = new CCBillRestApiOauthErrorLogStore(this)
        this.CCBillRestApiAddCardLogStore = new CCBillRestApiAddCardLogStore(this)
        this.CCBillRestApiErrorCodeDescriptionStore = new CCBillRestApiErrorCodeDescriptionStore(this)
        this.sendGridWebhookStore = new sendGridWebhookStore(this)
        this.CCBillRestApiReportingByDomainStore = new CCBillRestApiReportingByDomainStore(this)
        this.PromotionReportStore = new PromotionReportStore(this)
        this.ApiLimiterReport = new ApiLimiterReport(this)
        this.StickyIoTransactionImport = new StickyIoTransactionImport(this)
        this.StickyIoLogs = new StickyIoLogsStore(this)
        this.StickyIoSummaryReportStore = new StickyIoSummaryReportStore(this)
        this.InfluencerHelpStore = new InfluencerHelpStore(this)
        this.AwsSettingsStore = new AwsSettingsStore(this)
        this.OptInReportStore = new OptInReportStore(this)
        this.CCBillTransactionReportsStore = new CCBillTransactionReportsStore(this)
        this.StickyIoTransactionReportsStore = new StickyIoTransactionReportsStore(this)
        this.ChargebackBlockUserLogStore = new ChargebackBlockUserLogStore(this)
        this.StickyIoPaymentProfilesStore = new StickyIoPaymentProfilesStore(this)
        this.EarningDashboardStore = new EarningDashboardStore(this)
        this.HelpTagsStore = new HelpTagsStore(this)
        this.HybridTransactionStore = new HybridTransactionStore(this)
        this.HybridTransactionLogListStore = new HybridTransactionLogListStore(this)
        this.BlockCodeStore = new BlockCodeStore(this)
        this.BlockUserStore = new BlockUserStore(this)
        this.ApiLimitConfigurationStore = new ApiLimitConfigurationStore(this)
        this.AutoBlockUserLogStore = new AutoBlockUserLogStore(this)
        this.ChargebackAlertStore = new ChargebackAlertStore(this)
        this.UserLookupStore = new UserLookupStore(this)
        this.WebsiteReferralStore = new WebsiteReferralStore(this)
        this.WebsiteReferralEarningReport = new WebsiteReferralEarningReport(this)
        this.SuspiciousUserStore = new SuspiciousUserStore(this)
        this.ForumPayTransactionHistoryStore = new ForumPayTransactionHistoryStore(this)
        this.ForumPayWebhookStore = new ForumPayWebhookStore(this)
        this.UserWalletBalanceStore = new UserWalletBalanceStore(this)
        this.ForumPayTransactionReportStore = new ForumPayTransactionReportStore(this)
        this.ForumPayTransactionStatisticsStore = new ForumPayTransactionStatisticsStore(this)
        this.WrongUserSubscriptionStatusStore = new WrongUserSubscriptionStatusStore(this)
        this.ContactUsStore = new ContactUsStore(this)
        this.WebsiteUserStatisticsStore = new WebsiteUserStatisticsStore(this)
        this.ResubscriptionReport = new ResubscriptionReport(this)
        this.InfluencerActivityStore = new InfluencerActivityStore(this)
        this.PWAInfoStore = new PWAInfoStore(this)
        this.WebsiteCronStatusStore = new WebsiteCronStatusStore(this)
        this.OneSignalAnalyticsStore = new OneSignalAnalyticsStore(this)
        this.SubscriptionStatisticsStore = new SubscriptionStatisticsStore(this)
        this.UniversalLoginLogsStore = new UniversalLoginLogsStore(this)
        this.UniversalLoginStore = new UniversalLoginStore(this)
        this.VideoProcessingStore = new VideoProcessingStore(this)
        this.EmailStore = new EmailStore(this)
        this.ModelStore = new ModelStore(this)
        this.LinkTrackingReferralStore = new LinkTrackingReferralStore(this)
        this.LinkTrackingWebsiteReferralMonthlyEarningReportStore = new LinkTrackingWebsiteReferralMonthlyEarningReportStore(this)
    }
}

export default RootStore
