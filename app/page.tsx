import Link from 'next/link'
import { Shield, Search, Download, Zap, Lock, Clock, ChevronRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-400" />
            <span className="text-xl font-bold">AuditPad</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-slate-400 hover:text-white text-sm">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white text-sm">Pricing</a>
            <a href="#docs" className="text-slate-400 hover:text-white text-sm">Docs</a>
            <Link href="/auth/login" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            SOC 2 &amp; HIPAA audit trail infrastructure
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Compliance audit logs<br />
            <span className="text-sky-400">your auditors will love</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            One API call to log any event. Search, filter, and export your entire audit trail. Built for B2B SaaS companies that need to prove what happened, when, and who did it.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/login" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-lg">
              Start free trial
            </Link>
            <a href="#docs" className="flex items-center gap-2 text-slate-400 hover:text-white font-medium transition-colors">
              View API docs <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Code preview */}
          <div className="mt-16 bg-slate-900 border border-slate-700 rounded-2xl p-6 text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-500 text-sm ml-2">POST /api/v1/events</span>
            </div>
            <pre className="text-sm text-slate-300 overflow-x-auto"><code>{`curl -X POST https://auditpad.app/api/v1/events \\
  -H "Authorization: Bearer ap_yourApiKey" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "user.data_exported",
    "actor": "admin@company.com",
    "resource_type": "customer_records",
    "resource_id": "cust_8827",
    "metadata": {
      "record_count": 1842,
      "format": "csv"
    }
  }'`}</code></pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything compliance requires</h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Purpose-built for SaaS companies navigating SOC 2 Type II, HIPAA, ISO 27001, and enterprise security reviews.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Simple REST API',
                desc: 'Log any event with a single HTTP call. No SDKs required. Works with any language or framework.',
              },
              {
                icon: Search,
                title: 'Full-text search',
                desc: 'Search across actors, actions, resources, and metadata. Filter by date range, IP, or custom fields.',
              },
              {
                icon: Download,
                title: 'One-click exports',
                desc: 'Export filtered results to CSV or JSON for auditors. Maintain chain of custody documentation.',
              },
              {
                icon: Lock,
                title: 'Tamper-evident logs',
                desc: 'Events are immutable once written. Every entry is timestamped and signed. Perfect for compliance.',
              },
              {
                icon: Clock,
                title: 'Configurable retention',
                desc: 'Keep logs for 90 days or up to 3 years depending on your compliance requirements.',
              },
              {
                icon: Shield,
                title: 'API key management',
                desc: 'Issue scoped API keys per service. Rotate, revoke, and audit key usage independently.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <f.icon className="w-8 h-8 text-sky-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Docs preview */}
      <section id="docs" className="px-6 py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Integrate in minutes</h2>
          <p className="text-slate-400 text-center mb-12">Two endpoints. That&apos;s it.</p>
          <div className="space-y-4">
            {[
              { method: 'POST', path: '/api/v1/events', desc: 'Log a new audit event' },
              { method: 'GET', path: '/api/v1/events', desc: 'Query events with filters' },
            ].map((ep) => (
              <div key={ep.path} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${ep.method === 'POST' ? 'bg-sky-500/20 text-sky-400' : 'bg-green-500/20 text-green-400'}`}>
                  {ep.method}
                </span>
                <code className="text-slate-300 font-mono text-sm">{ep.path}</code>
                <span className="text-slate-500 text-sm ml-auto">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-slate-400 text-center mb-16">No per-seat nonsense. Pay for what you log.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: 0,
                events: '10K events/mo',
                retention: '30 days',
                features: ['1 API key', 'Basic search', 'CSV export'],
              },
              {
                name: 'Starter',
                price: 49,
                events: '100K events/mo',
                retention: '90 days',
                features: ['10 API keys', 'Advanced search', 'CSV + JSON export', 'Email alerts'],
                popular: true,
              },
              {
                name: 'Pro',
                price: 149,
                events: '1M events/mo',
                retention: '1 year',
                features: ['Unlimited API keys', 'Full-text search', 'Bulk export', 'Webhooks', 'SOC 2 report'],
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-7 border ${plan.popular ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500' : 'border-slate-700 bg-slate-800'}`}>
                {plan.popular && (
                  <div className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-3">Most Popular</div>
                )}
                <div className="text-xl font-bold mb-1">{plan.name}</div>
                <div className="text-4xl font-bold mb-1">
                  ${plan.price}<span className="text-lg font-normal text-slate-400">/mo</span>
                </div>
                <div className="text-slate-400 text-sm mb-6">{plan.events} · {plan.retention} retention</div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/login" className={`block text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${plan.popular ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                  {plan.price === 0 ? 'Get started free' : `Start ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>AuditPad</span>
          </div>
          <span>© 2026 AuditPad. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
