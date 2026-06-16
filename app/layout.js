import { Poppins, Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerInit from '@/components/ServiceWorkerInit'
import OfflineBanner from '@/components/OfflineBanner'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata = {
  title: 'SABI · AI care. Human understanding.',
  description: 'Anonymous mental health screening for Nigerian university students. Check in, get matched support, no name needed.',
  icons: {
    icon: '/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SABI',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ServiceWorkerInit />
        <OfflineBanner />
        {children}
      </body>
    </html>
  )
}
