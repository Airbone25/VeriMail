import redis from '../lib/redis.js'

export async function rateLimiter(req, res, next) {
  try {
    const apiKeyId = req.apiKeyId
    const rateLimit = req.plan.rateLimit

    const currentSecond = Math.floor(Date.now() / 1000)
    const redisKey = `rate:${apiKeyId}:${currentSecond}`

    const counter = await redis.incr(redisKey)

    if (counter === 1) {
      await redis.expire(redisKey, 1)
    }

    if (counter > rateLimit) {
      return res.status(429).json({ message: 'Rate Limit Exceeded!' })
    }

    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
