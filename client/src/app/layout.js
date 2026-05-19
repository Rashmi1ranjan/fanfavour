import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ReduxProvider from '../../store/provider'

import Script from 'next/script'
import Navbar from "../components/common/Navbar";
import SweetAlertWrapper from "../components/modals/SweetAlertWrapper";
import CopyToClipboard from "../components/layout/CopyToClipboardToast";
import ClientRoot from "./ClientRoot";
import GlobalWrapper from './GlobalPageWrapper';
import { Suspense } from 'react';
import AuthInitializer from './AuthInitializer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: "Fan Favour",
  description: "FanFavour - Content from some of the world's most exclusive models"
};


export default function RootLayout({ children }) {
  const GA_TRACKING_ID = process.env.GA_TRACKING_ID

  return (
    <html lang='en'>
      <head>
        <link rel='icon' type='image/x-icon' href='public/header.ico' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <meta name='theme-color' content='#1a0033' />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy='afterInteractive'
        />
        <Script id='google-analytics' strategy='afterInteractive'>
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased select-none`}
      >
        <ReduxProvider>
          <ClientRoot>
            <GlobalWrapper>
              <Suspense fallback={null}>
                <AuthInitializer />
              </Suspense>

              <Navbar />

              <main className='relative'>
                {children}
              </main>

              <SweetAlertWrapper />
              <CopyToClipboard toastContent='Copied to clipboard.' />
            </GlobalWrapper>
          </ClientRoot>
        </ReduxProvider>
      </body>
    </html>
  );
}
