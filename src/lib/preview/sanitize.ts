// Lightweight sanitizer for preview HTML to avoid CSP/script/network issues
export default function sanitizePreviewHtml(input: string): string {
  if (!input) return '<!doctype html><html><body>No preview</body></html>'
  let html = input
    // Remove any inline/external scripts
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove script-related preloads
    .replace(/<link[^>]+rel=["']?modulepreload["']?[^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']?preload["']?[^>]+as=["']?script["']?[^>]*>/gi, '')
    // Remove prefetch/prerender/dns-prefetch/preconnect which can pull external deps
    .replace(/<link[^>]+rel=["']?(prefetch|prerender|dns-prefetch|preconnect)["']?[^>]*>/gi, '')
    // Remove any link tags that point to Next.js chunks just in case
    .replace(/<link[^>]+href=["'][^"']*_next\/static\/[^"']+["'][^>]*>/gi, '')
    // Remove embeds that could load externals
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(object|embed|video|audio|source|track)[\s\S]*?<\/(object|video|audio)>/gi, '')
    // Strip event handler attributes like onload, onclick, etc.
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+='[^']*'/gi, '')

  // Ensure a <base> tag so relative assets resolve correctly
  const hasHead = /<head[\s>]/i.test(html)
  if (hasHead && !/<base[\s>]/i.test(html)) {
    html = html.replace(/<head([\s>])/i, `<head$1\n<base href="https://walletpush.io/">`)
  }

  if (!/^<!doctype html>/i.test(html)) {
    html = '<!doctype html>' + html
  }
  return html
}


