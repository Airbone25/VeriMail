import express from 'express'
import { verifyApiKey } from '../middlewares/apiKey.js'
import { rateLimiter } from '../middlewares/rateLimiter.js'
import { verifyAuth, orgScope } from '../middlewares/auth.js'
import { prisma } from '../lib/prisma.js'
import {isDisposable,isFreeProvider,isRoleBased,isValidSyntax,hasMxRecords} from '../utils/email.js'

const router = express.Router()

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

async function checkPlanLimit(req, res, next) {
    if (!req.plan || !req.orgId) return next()

    // If requestLimit is null, it's unlimited
    if (req.plan.requestLimit === null) return next()

    try {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const count = await prisma.verificationLog.count({
            where: {
                org_id: req.orgId,
                created_at: { gte: startOfMonth }
            }
        })

        if (count >= req.plan.requestLimit) {
            return res.status(403).json({
                message: "Monthly request limit reached. Please upgrade your plan.",
                limit: req.plan.requestLimit,
                usage: count
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}

const authMiddleware = (req, res, next) => {
    if (req.headers['x-api-key']) {
        return verifyApiKey(req, res, (err) => {
            if (err) return next(err)
            resolvePlan(req, res, () => checkPlanLimit(req, res, next))
        })
    }
    return verifyAuth(req, res, (err) => {
        if (err) return next(err)
        orgScope(req, res, () => resolvePlan(req, res, () => checkPlanLimit(req, res, next)))
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

    const reason = !mx
    ? 'no_mx'
    : disposable
        ? 'disposable'
        : valid
            ? 'deliverable'
            : 'unknown'

    try {
        await prisma.verificationLog.create({
            data: {
                email,
                status: reason,
                is_valid: valid,
                org_id: req.orgId
            }
        })
    } catch (error) {
        console.error("Log error:", error)
    }

    return res.json({
        email,
        deliverable: valid,
        syntax,
        domain: true,
        mx,
        disposable,
        roleBased,
        freeProvider,
        reason: reason === 'deliverable' ? 'Email is deliverable' : reason
    })
})

export default router