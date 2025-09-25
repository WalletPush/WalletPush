'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function BusinessLoginSlugPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null); setLoading(true)
    const form = new FormData(e.currentTarget)
    const payload = {
      email: String(form.get('email') || '').trim().toLowerCase(),
      password: String(form.get('password') || ''),
      slug,
    }
    const res = await fetch('/business/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data?.error || `Login failed (${res.status})`)
      return
    }
    router.replace(data.next)
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Business Login — {slug}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
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
