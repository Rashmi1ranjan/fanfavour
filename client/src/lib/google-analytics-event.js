import gtag from 'ga-gtag'
import store from '../../store/index'
import { getAppSetting } from '../action/app-setting.action'

/**
 * Add e-commerce event in google analytics
 * @param {string} eventAction - event action for e.g - purchase/add_to_cart/view_item
 * @param {string} transactionId - transactionId for set transaction id in event
 * @param {string} eventValue - Price
 * @param {string} productSKU - Product type one of the following image/video/gallery/menu/chat/live-video/initial/rebill
 * @param {string} productName - Purchase type one of the following tip/subscription/unlock mass/unlock feed/unlock chat/registration
 * @param {string} productCategory - Message/Blog Caption else empty
 */
export const googleAnalyticsTrackEvent = (eventAction, transactionId, eventValue, productSKU, productName, productCategory) => {
    const state = store.getState()
    const google_analytics_4_measurement_id = state.auth.appSettings.google_analytics_4_measurement_id

    if (google_analytics_4_measurement_id === '') {
        return
    }

    if (eventAction === 'purchase') {
        gtag('event', eventAction, {
            'transaction_id': transactionId,
            'value': eventValue,
            'currency': 'USD',
            'items': [
                {
                    'item_id': productSKU,
                    'item_name': productName,
                    'item_category': productCategory,
                    'quantity': 1,
                    'price': eventValue
                }
            ]
        })
    } else {
        gtag('event', eventAction, {
            'items': [
                {
                    'item_id': productSKU,
                    'item_name': productName,
                    'item_category': productCategory,
                    'quantity': 1,
                    'price': eventValue
                }
            ]
        })
    }
}

export const setPromotionGoogleAnalyticsEvent = (promotionId, promotionText) => {
    const state = store.getState()
    const google_analytics_4_measurement_id = state.auth.appSettings.google_analytics_4_measurement_id

    if (google_analytics_4_measurement_id === '') {
        return
    }

    gtag('event', 'promotions', {
        'id': promotionId,
        'name': promotionText
    }
    )
}

export const setGoogleAnalyticsEvent = (event_action, event_category, event_label) => {
    const state = store.getState()
    const google_analytics_4_measurement_id = state.auth.appSettings.google_analytics_4_measurement_id

    if (google_analytics_4_measurement_id === '') {
        return
    }

    gtag('event', event_action, { event_category, event_label })
}


