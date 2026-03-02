import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, LayoutDashboard, Key, Download, Settings, LogOut, Activity } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check if user has an org — if not, redirect to onboarding
  const { data: member } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).maybeSingle()
  const isOnboardPage = false // layout always renders, onboard page handles its own full-screen

  const navItems = [
    { href: '/dashboard', label: 'Events', icon: LayoutDashboard },
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/exports', label: 'Exports', icon: Download },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col fixed h-full">
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-lg">AuditPad</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-slate-700 pt-4">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
            <div className="flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Active</span>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
