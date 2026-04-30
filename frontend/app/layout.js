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
  openGraph: {
    title: 'RentalMeet - Book Your Premium Meeting Venues',
    description: 'Find and book the perfect venue for your meetings, events, and conferences',
    url: 'https://rentalmeet.com',
    siteName: 'RentalMeet',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentalMeet - Book Your Premium Meeting Venues',
    description: 'Find and book the perfect venue for your meetings, events, and conferences',
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
