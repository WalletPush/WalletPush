import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Inject CSS into HTML for iframe preview
 * Ensures the preview has proper styling in production
 */
export function withPreviewCSS(raw: string): string {
  const hasHead = /<head[\s>]/i.test(raw)
  const hasTailwindCDN = /cdn\.tailwindcss\.com/.test(raw) || /tailwind\.css/.test(raw)
  const hasAnyStyles = /<link[^>]+stylesheet|<style[\s>]/i.test(raw)

  const inject = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- Tailwind CDN for preview only -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Optional: fonts -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>html,body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}</style>
  `.trim()

  // Ensure absolute protocol (avoid mixed-content on prod)
  const safe = raw.replace(/href="http:\/\//g, 'href="https://')

  if (hasHead) {
    if (hasAnyStyles || hasTailwindCDN) return safe
    return safe.replace(/<head([\s>])/i, `<head$1\n${inject}\n`)
  }

  // Wrap a head if none exists
  return `<!doctype html><html><head>${inject}</head><body>${safe}</body></html>`
}