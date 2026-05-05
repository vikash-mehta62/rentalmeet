import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeInitializer from '@/components/ThemeInitializer'
import ChatbotWidget from '@/components/ChatbotWidget'

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
  title: 'RentalMeet - Book Your Premium Meeting Venues',
  description: 'Find and book the perfect venue for your meetings, events, and conferences',
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
    title: 'RentalMeet - Book Your Premium Meeting Venues',
    description: 'Find and book the perfect venue for your meetings, events, and conferences',
    url: 'https://rentalmeet.com',
    siteName: 'RentalMeet',
    type: 'website',
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'RentalMeet' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentalMeet - Book Your Premium Meeting Venues',
    description: 'Find and book the perfect venue for your meetings, events, and conferences',
    images: ['/android-chrome-512x512.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeInitializer />
        {children}
        <ChatbotWidget />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
