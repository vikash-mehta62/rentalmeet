import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ThemeInitializer from '@/components/ThemeInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'RentalMeet - Book Your Premium Meeting Venues',
  description: 'Find and book the perfect venue for your meetings, events, and conferences',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeInitializer />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

