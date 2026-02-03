import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TTS Showcase',
  description: 'Showcase of BytePlus TTS Voices',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
