import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AuditPad – Compliance Audit Logging for B2B SaaS',
  description: 'Log, search, and export audit trails for compliance. Track every user action, data change, and admin event. SOC 2 and HIPAA ready.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  )
}
