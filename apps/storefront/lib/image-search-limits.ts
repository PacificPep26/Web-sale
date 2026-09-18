type Bucket = { count: number; reset: number }
type Client = { minute: Bucket; day: Bucket }

function limit(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function createImageSearchLimiter(env: Record<string, string | undefined> = process.env) {
  const perMinute = limit(env.IMAGE_SEARCH_PER_IP_MINUTE, 3)
  const perDay = limit(env.IMAGE_SEARCH_PER_IP_DAY, 10)
  const dailyTotal = limit(env.IMAGE_SEARCH_DAILY_LIMIT, 100)
  const clients = new Map<string, Client>()
  let day: Bucket = { count: 0, reset: 0 }
  let active = 0

  return {
    acquire(ip: string, now = Date.now()) {
      const nextDay = (Math.floor(now / 86_400_000) + 1) * 86_400_000
      if (day.reset <= now) day = { count: 0, reset: nextDay }
      for (const [key, client] of clients) if (client.day.reset <= now) clients.delete(key)
      const client = clients.get(ip) ?? {
        minute: { count: 0, reset: now + 60_000 },
        day: { count: 0, reset: nextDay },
      }
      if (client.minute.reset <= now) client.minute = { count: 0, reset: now + 60_000 }
      const dailyBlocked = day.count >= dailyTotal || client.day.count >= perDay
      const minuteBlocked = client.minute.count >= perMinute
      if (dailyBlocked || minuteBlocked || active >= 2 || (!clients.has(ip) && clients.size >= 5000)) {
        return {
          allowed: false as const,
          retryAfter: dailyBlocked ? Math.max(1, Math.ceil((nextDay - now) / 1000))
            : minuteBlocked ? Math.max(1, Math.ceil((client.minute.reset - now) / 1000)) : 30,
          error: dailyBlocked
            ? "Today's photo search limit has been reached. Please send us your photo on WhatsApp, or try again tomorrow."
            : "Too many photo searches right now. Please wait a moment or send us your photo on WhatsApp.",
        }
      }
      // Reserve all counters synchronously, before any asynchronous upload/AI work.
      client.minute.count += 1
      client.day.count += 1
      day.count += 1
      active += 1
      clients.set(ip, client)
      let released = false
      return {
        allowed: true as const,
        release() {
          if (released) return
          released = true
          active -= 1
        },
      }
    },
  }
}
