import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'
import 'bootstrap/dist/css/bootstrap.css'
import * as Sentry from '@sentry/react'
import package_data from './../package.json'
import { configure } from 'mobx'
import 'react18-json-view/src/style.css'

const packageVersion = package_data.version

if (window.location.hostname !== 'localhost') {
    Sentry.init({
        dsn: 'https://a110065ca02f4efc8c0309f8a65a0a65@o392495.ingest.sentry.io/6067624',
        integrations: [Sentry.browserTracingIntegration()],
        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 0.001,
        release: 'pcp-services-react@' + packageVersion
    })
}
configure({ enforceActions: 'never' })
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
