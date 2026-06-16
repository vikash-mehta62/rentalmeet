import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeInitializer from '@/components/ThemeInitializer'
import ChatbotWidget from '@/components/ChatbotWidget'
import Script from 'next/script'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata = {
  title: 'RentalMeet | Book Conference Halls, Meeting Rooms & Event Venues Across India',
  description: 'Find and book conference halls, meeting rooms, training rooms, hotels, and event venues across India with RentalMeet. Compare venues, check availability, and book instantly.',
  keywords: 'Venue Booking Platform India, Conference Hall Booking, Meeting Room Booking, Event Venue Booking, Corporate Event Venues, Training Room Rental, Business Meeting Venues, Hotel Conference Halls, Venue Booking App',
  verification: {
    google: 'uTqA47_wan_8NNEFA6uAII7f8cPyO4ry1L8FezkrbuE',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico',       sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  openGraph: {
    title: 'RentalMeet | Book Conference Halls, Meeting Rooms & Event Venues Across India',
    description: 'Find and book conference halls, meeting rooms, training rooms, hotels, and event venues across India with RentalMeet. Compare venues, check availability, and book instantly.',
    url: 'https://rentalmeet.com',
    siteName: 'RentalMeet',
    type: 'website',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'RentalMeet' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentalMeet | Book Conference Halls, Meeting Rooms & Event Venues Across India',
    description: 'Find and book conference halls, meeting rooms, training rooms, hotels, and event venues across India with RentalMeet. Compare venues, check availability, and book instantly.',
    images: ['/android-chrome-512x512.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MHPT6JPQ');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className="font-sans antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MHPT6JPQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <ThemeInitializer />
        {children}
        <ChatbotWidget />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
