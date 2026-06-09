const NEW = 'NEW'
const REBILL = 'REBILL'
const REFUND = 'REFUND'
const CHARGEBACK = 'CHARGEBACK'
const VOID = 'VOID'
const DROPPED = 'dropped'
const BOUNCE = 'bounce'
const OPEN = 'open'
const CLICK = 'click'
const SPAMREPORT = 'spamreport'
const PROCESSED = 'processed'
const DELIVERED = 'delivered'
const SUBSCRIPTION = ['subscription']
const SUBSCRIPTION_WITH_ADD_CARD = ['subscription', 'add_new_card']
const CONTENT_PURCHASE = ['feed_unlock', 'tip', 'chat_unlock', 'pay_per_message']
const SHOP_PURCHASE = ['shop']
const API_STATIC_AUTH_TOKEN = 'ym4XjBNHBcSvxtEiMUiUr6j1QWA8NhQl'
const DECLINED = 'DECLINED'

module.exports = {
    NEW, REBILL, REFUND, CHARGEBACK, VOID, DROPPED, BOUNCE, OPEN, CLICK, SPAMREPORT, PROCESSED, DELIVERED, SUBSCRIPTION, CONTENT_PURCHASE, SHOP_PURCHASE, API_STATIC_AUTH_TOKEN, DECLINED, SUBSCRIPTION_WITH_ADD_CARD
}
