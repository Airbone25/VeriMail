import express from 'express'
import { verifyApiKey } from '../middlewares/apiKey'
import { rateLimiter } from '../middlewares/rateLimiter'
import { verifyAuth, orgScope } from '../middlewares/auth'
import { prisma } from '../lib/prisma'
import {isDisposable,isFreeProvider,isRoleBased,isValidSyntax,hasMxRecords} from '../utils/email'

const router = express.Router()

// Middleware to resolve plan if using session auth
async function resolvePlan(req, res, next) {
    if (req.orgId && !req.plan) {
        const org = await prisma.organization.findUnique({
            where: { id: req.orgId },
            include: { plan: true }
        })
        req.plan = org?.plan
    }
    next()
}

// Support both API Key (External) and Bearer Token (Dashboard Playground)
const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-key']) {
        return verifyApiKey(req, res, next)
    }
    return verifyAuth(req, res, (err) => {
        if (err) return next(err)
        orgScope(req, res, () => resolvePlan(req, res, next))
    })
}

router.get('/verify', authMiddleware, rateLimiter, async (req, res) => {
    const email = req.query.email

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' })
    }

    const syntax = isValidSyntax(email)
    if (!syntax) {
        return res.json({
            email,
            valid: false,
            syntax: false,
            reason: 'invalid_syntax'
        })
    }

    const domain = email.split('@')[1]

    const disposable = isDisposable(domain)
    const roleBased = isRoleBased(email)
    const freeProvider = isFreeProvider(domain)
    const mx = await hasMxRecords(domain)

    const valid =
        syntax &&
        mx &&
        !disposable

    return res.json({
        email,
        deliverable: valid,
        syntax,
        domain: true,
        mx,
        disposable,
        roleBased,
        freeProvider,
        reason: !mx
            ? 'no_mx'
            : disposable
                ? 'disposable'
                : valid
                    ? 'Email is deliverable'
                    : 'unknown'
    })
})

export default router