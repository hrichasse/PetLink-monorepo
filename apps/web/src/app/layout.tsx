import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'PetLink',
  description: 'Conecta con los mejores servicios para tu mascota',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
