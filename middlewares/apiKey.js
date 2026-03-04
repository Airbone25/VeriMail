import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import redis from '../lib/redis.js'

export async function verifyApiKey(req, res, next) {
  try {
    const rawKey = req.headers['x-api-key']
    if (!rawKey) {
      return res.status(401).json({ message: 'Api Key Missing!' })
    }

    const hashKey = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex')

    const cacheKey = `apikey:${hashKey}`

    const cached = await redis.get(cacheKey)

    if (cached) {
      const data = JSON.parse(cached)

      req.orgId = data.orgId
      req.apiKeyId = data.apiKeyId
      req.plan = data.plan

      return next()
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashKey },
      include: {
        organization: {
          include: { plan: true }
        }
      }
    })

    if (!apiKey) {
      return res.status(403).json({ message: 'Invalid Api Key' })
    }

    const payload = {
      orgId: apiKey.org_id,
      apiKeyId: apiKey.id,
      plan: apiKey.organization.plan
    }

    await redis.set(cacheKey, JSON.stringify(payload), 'EX', 300)

    req.orgId = payload.orgId
    req.apiKeyId = payload.apiKeyId
    req.plan = payload.plan

    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
