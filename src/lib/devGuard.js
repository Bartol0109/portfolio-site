/** Dev-server only. Production builds leave network behavior unchanged. */

export const CONTACT_ENDPOINT = 'https://formspree.io/f/xbdzkwjj'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function isDevPreview() {
  return Boolean(import.meta.env && import.meta.env.DEV)
}

export function contactFormAction(dev = isDevPreview()) {
  return dev ? undefined : CONTACT_ENDPOINT
}

export function shouldBlockRequest({ dev, method = 'GET', url, pageOrigin }) {
  if (!dev) return false
  const verb = String(method || 'GET').toUpperCase()
  if (MUTATING.has(verb)) return true
  try {
    const target = new URL(url, pageOrigin)
    const page = new URL(pageOrigin)
    const localHost = target.hostname === 'localhost' || target.hostname === '127.0.0.1'
    if (target.origin !== page.origin && !localHost) return true
  } catch {
    return true
  }
  return false
}

export function installDevFetchGuard() {
  if (!isDevPreview() || typeof window === 'undefined' || window.__visoraDevGuard) return
  window.__visoraDevGuard = true
  const orig = window.fetch.bind(window)
  window.fetch = (input, init = {}) => {
    const method = init.method || (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
    const url = typeof input === 'string' ? input : input?.url
    if (shouldBlockRequest({ dev: true, method, url, pageOrigin: window.location.origin })) {
      return Promise.resolve(new Response(JSON.stringify({
        ok: false,
        blocked: true,
        error: 'Blocked in local preview. Nothing was sent.',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
    return orig(input, init)
  }
}
