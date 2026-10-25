export function contentSecurityPolicy(nonce:string,development=false) {
  return [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://vercel.live${development?" 'unsafe-eval'":""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:","font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.cartocdn.com https://challenges.cloudflare.com https://*.vercel-insights.com https://vercel.live https://cloudflareinsights.com wss://ws-us3.pusher.com",
    "worker-src 'self' blob:", "media-src 'self' blob: https:","frame-src https://www.google.com https://challenges.cloudflare.com https://vercel.live",
    "form-action 'self'","upgrade-insecure-requests","report-uri /api/csp-report"
  ].join("; ");
}
