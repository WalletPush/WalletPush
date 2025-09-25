'use client'
import { useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

export default function CustomerLoginSlugPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const q = useSearchParams()
  const presetEmail = q.get('email') || ''
  const nextPath = q.get('next') || ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setLoading(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      email: String(fd.get('email')||'').trim().toLowerCase(),
      password: String(fd.get('password')||''),
      slug,
      next: nextPath,
    }
    const res = await fetch('/customer/login', { method:'POST', body: JSON.stringify(payload) })
    const data = await res.json(); setLoading(false)
    if (!res.ok) { setError(data?.error || `Login failed (${res.status})`); return }
    router.replace(data.next)
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Customer Login — {slug}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input defaultValue={presetEmail} name="email" type="email" required className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input name="password" type="password" required className="w-full rounded border p-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
