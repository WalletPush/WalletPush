'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AgencySignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      email: String(fd.get('email')||'').trim().toLowerCase(),
      password: String(fd.get('password')||''),
      company_name: String(fd.get('company_name')||'').trim(),
      name: String(fd.get('name')||'').trim(),
      website: String(fd.get('website')||'').trim() || null,
    }
    const res = await fetch('/api/agency/sign-up', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data?.error || `Sign up failed (${res.status})`); return }
    router.replace(data.next)
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your agency</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div><label className="block text-sm mb-1">Company name</label><input name="company_name" required className="w-full rounded border p-2"/></div>
        <div><label className="block text-sm mb-1">Display name (optional)</label><input name="name" className="w-full rounded border p-2"/></div>
        <div><label className="block text-sm mb-1">Website (optional)</label><input name="website" className="w-full rounded border p-2" placeholder="https://"/></div>
        <div><label className="block text-sm mb-1">Owner email</label><input name="email" type="email" required className="w-full rounded border p-2"/></div>
        <div><label className="block text-sm mb-1">Password</label><input name="password" type="password" required className="w-full rounded border p-2"/></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
          {loading ? 'Creating…' : 'Create Agency'}
        </button>
      </form>
    </div>
  )
}
