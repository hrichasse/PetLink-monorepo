'use client'

import dynamic from 'next/dynamic'

// Load the full React Router SPA client-side only to avoid SSR conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const App = dynamic(() => import('@/App'), { ssr: false }) as any

export default function Page() {
  return <App />
}
