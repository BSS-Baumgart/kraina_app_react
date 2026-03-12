
interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  limit: number
  windowSeconds: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 5, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + options.windowSeconds * 1000
    store.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: options.limit - 1, resetTime }
  }

  entry.count++
  store.set(identifier, entry)

  if (entry.count > options.limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  return { allowed: true, remaining: options.limit - entry.count, resetTime: entry.resetTime }
}
