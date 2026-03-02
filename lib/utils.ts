import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy HH:mm:ss')
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const prefix = 'ap_'
  let key = prefix
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return key
  return key.slice(0, 8) + '••••••••••••' + key.slice(-4)
}

export const ACTION_COLORS: Record<string, string> = {
  'user.created': 'bg-green-100 text-green-800',
  'user.deleted': 'bg-red-100 text-red-800',
  'user.updated': 'bg-blue-100 text-blue-800',
  'user.login': 'bg-sky-100 text-sky-800',
  'user.logout': 'bg-slate-100 text-slate-800',
  'billing.updated': 'bg-purple-100 text-purple-800',
  'billing.cancelled': 'bg-orange-100 text-orange-800',
  'data.exported': 'bg-yellow-100 text-yellow-800',
  'data.deleted': 'bg-red-100 text-red-800',
  'admin.action': 'bg-rose-100 text-rose-800',
  'settings.changed': 'bg-indigo-100 text-indigo-800',
}

export function getActionColor(action: string): string {
  if (ACTION_COLORS[action]) return ACTION_COLORS[action]
  if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800'
  if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-800'
  if (action.includes('update') || action.includes('change')) return 'bg-blue-100 text-blue-800'
  return 'bg-slate-100 text-slate-700'
}
