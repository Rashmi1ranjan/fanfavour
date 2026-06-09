export type OptionType = {
    value: string
    label: string
}

export type OptionTypeNumericValue = {
    value: number
    label: string
}

export interface SortConfig {
    key: string,
    direction: string
}

export interface ApiLimitConfiguration {
    api_end_point: string;
    max_attempt: number | string;
    duration: number | string;
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ErrorCodeDescription {
    ccbill_error_code: string;
    description: string;
    error_message: string;
}

export interface DeclineCodeDescription {
    payment_gateway: string;
    decline_code: string;
    description: string;
    error_message: string;
    link_to_change_card: boolean;
    link_text: string;
}

export interface CCBillCardErrorDetail {
    is_processed: boolean;
    is_unique: boolean;
    payment_gateway: string;
    _id: string;
    domain: string;
    user_id: string;
    email: string;
    ip: string;
    is_error: boolean;
    card_last_four_digits: number;
    card_id: string;
    name_on_card: string;
    expire_month: number;
    expire_year: number;
    address: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
    card_type: string;
    from_subscription: boolean;
    is_subscription_success: boolean;
    ccbill_response: object;
    sticky_io_response: object;
    sticky_io_error_code: string;
    sticky_io_error_message: string;
    ccbill_error_message: string;
    ccbill_error_code: string;
    createdAt: string;
    updatedAt: string;
}

export interface CCBillCardOauthErrorDetail {
    domain: string;
    user_id: string;
    email: string;
    ccbill_url: string;
    ccbill_response: string;
    ccbill_error_code: string;
    ccbill_error_message: string;
}

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

export interface CoutryApiData extends Pagination { countries: Array<CountryDetails> }

export interface CountryDetails {
    _id: string;
    name: string;
    iso3: string;
    iso2: string;
    phone_code: string;
    created_at: string;
}

export interface StateApiData extends Pagination { allState: Array<StateDetails> }

export interface StateDetails {
    _id: string;
    name: string;
    country_id: string;
    state_code: string;
    countryDetails: CountryDetails;
}

export interface CityApiData extends Pagination { allCity: Array<CityDetails> }

export interface CityDetails {
    _id: string;
    name: string;
    country_id: string;
    state_id: string;
    country_list: CountryDetails;
    state_list: {
        _id: string;
        name: string;
        country_id: string;
        state_code: string;
    };
}

interface Pagination {
    totalPages: number;
    currentPage: number;
    totalRows: number;
    limit: number;
}

export interface GatewayInfo {
    _id: string;
    gateway_id: string;
    createdAt: string;
    gateway_active: string;
    gateway_alias: string;
    gateway_created: string;
    gateway_provider: string;
    gateway_type: string;
    updatedAt: string;
}

export interface TransactionSummary {
    _id: string;
    success: number;
    success_amount: number;
    failed: number;
    unique_failed: number;
    unique_failed_amount: number;
}

export interface GlobalTransactionSummary {
    success: number;
    success_amount: number;
    unique_failed: number;
    unique_failed_amount: number;
    failed: number;
    cascade_success: number;
    cascade_success_amount: number;
    cascade_failed: number;
    cascade_failed_amount: number;
    processed_count_by_secondary_gateway: number;
    processed_amount_by_secondary_gateway: number;
    normal_success: number;
    normal_success_amount: number;
    normal_failed: number;
    normal_unique_failed: number;
    normal_unique_failed_amount: number;
    processed_count_by_secondary_gateway_not_cascade: number;
    processed_amount_by_secondary_gateway_not_cascade: number;
}

export interface ForumPayTransactionDetails {
    transaction_status: string;
    is_ignore: boolean;
    wallet_transaction_status: string;
    _id: string;
    domain: string;
    user_id: string;
    email: string;
    transaction_type: string;
    amount: number;
    ip_address: string;
    transaction_info: {
        crypto_currency: string;
        address: string;
        payment_id: string;
        transaction_for: string;
        notes: string;
        pos_id: string;
        is_confirm_by_cron: boolean;
        _id: string;
        content_type: string;
    };
    mst_created_date: string;
    createdAt: string;
    updatedAt: string;
    forumpay_response: {
        reference_no: string;
        inserted: string;
        invoice_amount: string;
        type: string;
        invoice_currency: string;
        amount: string;
        min_confirmations: string;
        accept_zero_confirmations: string;
        require_kyt_for_confirmation: string;
        currency: string;
        confirmed: boolean;
        confirmed_time: string;
        reason: string | null;
        payment: string;
        last_transaction_time: string;
        sid: string | null;
        confirmations: string;
        access_token: string;
        access_url: string;
        wait_time: string | null;
        status: string;
        invoice_date: string | null;
        print_string: string;
        state: string;
    };
}

export interface WebsiteOption {
    _id: string
    website_url: string
    is_referral: boolean
    subscription_sub_account: string
    shop_sub_account: string
    tip_sub_account: string
    payment_gateway: string
}

export interface MenuItem {
    to: string;
    name: string;
}

export interface MenuSection {
    title: string;
    menus: Array<MenuItem>;
}

interface StickyIoResponse {
    gateway_id: string;
    response_code: string;
    error_found: string;
    order_id: string;
    transactionID: string;
    customerId: string;
    authId: string;
    orderTotal: string;
    orderSalesTaxPercent: string;
    orderSalesTaxAmount: string;
    test: string;
    prepaid_match: string;
    line_items: Array<{
        product_id: string;
        variant_id: string;
        quantity: string;
        subscription_id: string;
    }>;
    gatewayCustomerService: string;
    gatewayDescriptor: string;
    subscription_id: Record<string, string>;
    resp_msg: string;
    provider_type: string;
    provider_name: string;
    response_message: string;
    error_message: string;
}

export interface StickyIoTransactionInfo {
    transaction_type: string;
    transaction_status: string;
    sticky_io_response: StickyIoResponse
}

export interface StickyIoTransactionReport {
    _id: string;
    has_chargeback: boolean;
    campaign_id: string;
    order_id: string;
    product_id: string;
    transaction_type: string;
    amount: string;
    auth_number: string;
    card_type: string;
    createdAt: string;
    email: string;
    first_name: string;
    gateway_id: string;
    is_cascaded: string;
    is_recurring: string;
    last_name: string;
    notes: string;
    original_decline_reason: string;
    original_gateway_id: string;
    pcp_transaction_id: string;
    pcp_transaction_type: string;
    pcp_user_id: string;
    transaction_date: string;
    transaction_number: string;
    transaction_payment_gateway: string;
    updatedAt: string;
    website_url: string;
}

export interface TipInfo {
    notes: Array<string>;
    model_message_count?: number;
    user_message_count?: number;
    total_user_message_count?: number;
    total_model_message_count?: number;
    _id?: string;
    count?: number;
    user_id?: string;
    email?: string;
    tip_amount?: number;
    name?: string;
    website_url?: string;
    type?: string;
    fraudDetectionDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Cell {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTableAction?: (action: string, value: any, data: any) => void
}

export interface StickyIOCharge {
    payment_gateway: string;
    model_per_transaction_fixed_charge: string;
    model_per_transaction_percentage_charge: string;
    new_per_transaction_fixed_charge: string;
    new_per_transaction_percentage_charge: string;
    void_per_transaction_fixed_charge: string;
    void_per_transaction_percentage_charge: string;
    refund_per_transaction_fixed_charge: string;
    refund_per_transaction_percentage_charge: string;
    declined_per_transaction_fixed_charge: string;
    declined_per_transaction_percentage_charge: string;
    chargeback_penalty: string;
    notes: string;
    _id?: string;
}

export interface CommissionDetails {
    _id: string;
    payment_gateway: string;
    sticky_io_charges: Array<StickyIOCharge>;
    domain: string;
    platform_commission: number;
    sticky_io_transaction_charge: string;
    ccbill_fees: number;
    target_date: string;
    created_at: string;
    website: {
        website_id: number;
    };
}

export interface AutoBlockUser {
    _id: string;
    is_processed: boolean;
    api_end_point: string;
    user_id: string;
    domain: string;
    ip_address: string;
    createdAt: string;
    updatedAt: string;
}

export interface CCBillTransactionReport {
    _id: string;
    type: string;
    client_account_number: string;
    client_sub_account: string;
    subscription_id: string;
    transaction_timestamp: string;
    first_name: string;
    last_name: string;
    email_address: string;
    partner_id: string;
    subscription_status: string;
    accounting_amount: number;
    initial_period: number;
    recurring_accounting_amount: number;
    recurring_period: number;
    recurring_status: number;
    card_type: string;
    pcp_model_earnings: number;
    pcp_platform_commission: number;
    pcp_ccbill_charge: number;
    pcp_transaction_date: string;
}

export interface CCBillTransactionReportApiResponse {
    rows: Array<CCBillTransactionReport>;
    totalPages: number;
    currentPage: number;
    totalRows: number;
    limit: number;
    success?: number;
    message?: string;
}

export interface ChargebackAlert {
    _id: string;
    is_processed: boolean;
    alert_type: string;
    body: {
        hook: {
            requestId: number;
            event: string;
        };
        data: {
            chargebacks: {
                chargeback: {
                    id: number;
                    dba: string;
                    mcc: string | null;
                    date: string;
                    action: string;
                    amount: string;
                    reason: string;
                    reply_form: string;
                    updated_at: string | null;
                    card_number: string;
                    case_action: string | null;
                    case_number: string;
                    case_status: string;
                    merchant_id: string;
                    reason_code: string;
                    respond_due: string;
                    order_number: string | null;
                    process_date: string | null;
                    invoice_number: string | null;
                    cycle_indicator: string;
                    original_amount: string;
                    tracking_number: string | null;
                    last_status_date: string | null;
                    microfilm_number: string | null;
                    transaction_date: string;
                    card_product_type: string | null;
                    transaction_method: string | null;
                    dispute_jurisdiction: string | null;
                    airline_ticket_number: string | null;
                    case_status_description: string;
                };
            };
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface ContactUsEmail {
    name: string;
    email: string;
    subject: string;
    body: string;
    domain: string;
    is_processed: boolean;
    created_at: Date;
    processed_by?: string;
    updated_at?: Date;
}

export interface LastTransaction {
    _id: string;
    url: string;
    error_from: string;
    domain: string;
    created_at: string;
}

interface StickyIOTransactionRequestData {
    firstName?: string;
    lastName?: string;
    billingFirstName?: string;
    billingLastName?: string;
    billingAddress1?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
    email?: string;
    creditCardType?: string;
    creditCardNumber?: string;
    expirationDate?: string;
    CVV?: string;
    tranType: string;
    ipAddress: string;
    campaignId: string;
    offers: Array<{
        offer_id: string;
        billing_model_id?: string;
        product_id: string;
        quantity: number;
        price: string;
    }>;
    notes: string;
    website: string;
    shippingId: number;
    shippingCountry: string;
    c1: string;
    c2: string;
    c3: string;
    AFID: string;
    SID: string;
    custom_fields: Array<{
        token: string;
        value: string;
    }>;
    previousOrderId?: string;
}

export interface StickyIOTransaction {
    _id: string;
    request_data: StickyIOTransactionRequestData;
    transaction_for: string;
    domain: string;
    createdAt: string;
}

export interface Earning {
    date: string;
    domain: string;
    payment_gateway: {
        sticky_io_payment_gateway?: string;
        payment_gateway: string;
    };
    new_transaction: string;
    refund: string;
    void: string;
    chargeback: string;
    net_revenue: string;
    revenue_collected: string;
    payment_gateway_charge: string;
    sticky_io_transaction_cost: string;
    model_earning: string;
    percentage: string;
    netProfitPercentage: string;
    stickyIoPercentage: string;
    netProfit: string;
}

export interface ForumPayTransactionHistory {
    transaction_status: string;
    is_ignore: boolean;
    wallet_transaction_status: string;
    _id: string;
    domain: string;
    user_id: string;
    email: string;
    transaction_type: string;
    amount: number;
    pcp_transaction_id: string;
    ip_address: string;
    transaction_info: {
        crypto_currency: string;
        address: string;
        payment_id: string;
        transaction_for: string;
        notes: string;
        pos_id: string;
        is_confirm_by_cron: boolean;
        _id: string;
        content_type: string;
        content_id?: string;
    };
    mst_created_date: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    forumpay_response?: {
        reference_no: string;
        inserted: string;
        invoice_amount: string;
        type: string;
        invoice_currency: string;
        amount: string;
        min_confirmations: string;
        accept_zero_confirmations: string;
        require_kyt_for_confirmation: string;
        currency: string;
        confirmed: boolean;
        confirmed_time: string;
        reason: null | string;
        payment: string;
        last_transaction_time: string;
        sid: null | string;
        confirmations: string;
        access_token: string;
        access_url: string;
        wait_time: null | string;
        status: string;
        invoice_date: null | string;
        print_string: string;
        state: string;
    };
}

export interface ITransactionInfo {
    transaction_id: string
    notes: string
    chargeback_date: string
}

export interface ForumPayWebhookDetails {
    is_processed: boolean;
    is_duplicate_webhook: boolean;
    _id: string;
    body: {
        post_id: string;
        currency: string;
        payment_id: string;
        reference_no: string;
        address: string;
    };
    created_at: string;
    __v: number;
}

interface HybridTransactionLogResponse {
    gateway_id?: string;
    response_code: string;
    error_found: string;
    order_id: string;
    transactionID?: string;
    customerId: string;
    authId?: string;
    orderTotal: string;
    orderSalesTaxPercent: string;
    orderSalesTaxAmount: string;
    test: string;
    prepaid_match: string;
    line_items?: Array<HybridTransactionLogResponseLineItem>;
    gatewayCustomerService: string;
    gatewayDescriptor: string;
    subscription_id?: { [key: string]: string };
    resp_msg: string;
}

interface HybridTransactionLogResponseLineItem {
    product_id: string;
    variant_id: string;
    quantity: string;
    subscription_id: string;
}

export interface HybridTransactionLog {
    is_cascade_transaction: boolean;
    payment_gateways: Array<string>;
    is_cascade_enabled: boolean;
    by_primary_gateway: boolean;
    cascade_type: number;
    transaction_execution_time: number;
    _id: string;
    domain: string;
    user_id: string;
    is_success: boolean;
    recurring: string;
    amount: number;
    transaction_date: string;
    pcp_transaction_id: string;
    response?: HybridTransactionLogResponse;
    final_payment_gateway: string;
    ip_address: string;
    country: string;
    is_unique: boolean;
    transaction_type: string;
    cascade?: object
}

export interface GlobalTransactionSummary {
    _id: string | null;
    success: number;
    success_amount: number;
    unique_failed: number;
    unique_failed_amount: number;
    failed: number;
    cascade_success: number;
    cascade_success_amount: number;
    cascade_failed: number;
    cascade_failed_amount: number;
    processed_count_by_secondary_gateway: number;
    processed_amount_by_secondary_gateway: number;
    normal_success: number;
    normal_success_amount: number;
    normal_failed: number;
    normal_unique_failed: number;
    normal_unique_failed_amount: number;
    processed_count_by_secondary_gateway_not_cascade: number;
    processed_amount_by_secondary_gateway_not_cascade: number;
}

export interface PaymentGatewayTransactionSummary {
    _id?: string;
    success: number;
    success_amount: number;
    failed: number;
    unique_failed: number;
    unique_failed_amount: number;
}

export interface SecondaryPaymentSummary {
    total_count: number;
    total_amount: number;
    cascade_count: number;
    cascade_amount: number;
    normal_count: number;
    normal_amount: number;
}


export interface InfluencerActivityDetail {
    domain: string;
    modal_last_seen: Date;
    content_manager_last_seen: Date;
    date_of_last_blog_added: Date;
    date_of_last_mass_message: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PwaInfo {
    _id: string;
    is_running_from_pwa: boolean;
    user_id: string;
    domain: string;
    non_pwa_user_agent: string;
    non_pwa_last_seen: string;
    createdAt: string;
    updatedAt: string;
    ccbill_subscription_status?: string;
}

export interface ResubscriptionOfferDetail {
    user_min_amount_spend: number;
    _id: string;
    id: string;
    user_min_active_month: number;
    title: string;
    recurring_price: number;
    give_free_month_subscription: number;
}

export interface ResubscriptionSummary {
    _id: string;
    domain: string;
    user_id: string;
    email: string;
    name: string;
    registration_date: string;
    subscription_date: string;
    subscription_payment_gateway: string;
    subscription_detail: {
        _id: string;
        recurring_price: number;
        initial_price: number;
    };
    resubscription_offer_detail: ResubscriptionOfferDetail;
    total_amount_spent: number;
    total_amount_spent_since_last_subscription: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface SuspiciousUserNotes {
    _id?: string;
    notes?: Array<string>;
    model_message_count?: number;
    user_message_count?: number;
    total_user_message_count?: number;
    total_model_message_count?: number;
    count?: number;
    user_id?: string;
    email?: string;
    tip_amount?: number;
    name?: string;
    website_url?: string;
    type?: string;
    fraudDetectionDate?: string;
    createdAt?: string;
    updatedAt?: string;
}


export interface UserCountDetail {
    _id: string;
    date: Date;
    registration: number;
    cancellation: number;
    subscription: number;
    subscription_revenue: number;
    domain: string;
    website: {
        website_id: number;
    };
}

export interface UserWalletDetails {
    _id: string;
    domain: string;
    email: string;
    __v: number;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
    user_id?: string;
}

export interface WebsiteCommissionDetail {
    _id?: string;
    payment_gateway?: string;
    sticky_io_charges?: Array<StickyIOCharge>;
    ccbill_transaction_charge?: string;
    forumpay_transaction_charge?: string;
    domain?: string;
    platform_commission?: number;
    sticky_io_transaction_charge?: string;
    ccbill_fees?: number;
    target_date?: Date;
    created_at?: Date;
    website?: {
        website_id: number;
    };
    sticky_io_fixed_fees?: string;
    sticky_io_new_transaction_fix_charge?: string;
    sticky_io_void_refund_transaction_fix_charge?: string;
    sticky_io_decline_transaction_fix_charge?: string;
}

export interface WebsitePreviousData {
    domain: string;
    subscription_sub_account: string;
    shop_sub_account: string;
    tip_sub_account: string;
    sticky_io_campaign_id: string;
}

export interface StreamData {
    _id: string;
    domain: string;
    domain_id: string;
    stream_start_time: string;
    stream_end_time: string;
    stream_id: string;
    duration: string;
    username: string;
    user_id: string;
    tips: number;
    pre_tip: number;
    max_users: number;
    stream_type: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface Website {
    domain: string;
    registered: number;
    subscribed_ever: number;
    active_cancelled_subscription: number;
    active_subscription: number;
    recently_visited_all: number;
    recently_visited_subscribers_7: number;
    recently_visited_subscribers_45: number;
    recently_visited_active_cancelled_7: number;
    recently_visited_active_cancelled_45: number;
    average_monthly_revenue: number;
    current_date: Date;
    updated_date: Date;
    block_users: number;
    website_index?: number;
}

export interface TotalUserStatistics {
    _id: null;
    totalDomain: number;
    totalRegistered: number;
    totalSubscription: number;
    totalActiveCanceled: number;
    totalActiveSubscription: number;
    totalRecentlyVisitedAll: number;
    totalRecentlyVisitedSubscribers7: number;
    totalRecentlyVisitedSubscribers45: number;
    totalRecentlyVisitedActiveCanceled7: number;
    totalRecentlyVisitedActiveCanceled45: number;
    totalAverageMonthlyRevenue: number;
    totalBlockUsers: number;
}

export interface WrongUserSubscriptionStatusLog {
    is_fixed: boolean;
    _id: string;
    website_url: string;
    transaction_type: string;
    pcp_transaction_type: string;
    user_id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}
