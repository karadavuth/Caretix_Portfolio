import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HealClinics - Nederlandse Biologische Producten',
  description: 'Biologische honing, cupping tools en natuurlijke supplementen uit Nederland',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
