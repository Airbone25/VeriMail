import express from 'express'
import { verifyOwner, verifyAuth, orgScope } from '../middlewares/auth'
import { prisma } from '../lib/prisma'

const router = express.Router()

router.get('/', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    const orgDetails = await prisma.organization.findFirst({
        where: { id: req.orgId },
        include: { plan: true }
    })
    res.json(orgDetails)
})

router.patch('/', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: "Organization name is required" })
    try {
        const updatedOrg = await prisma.organization.update({
            where: { id: req.orgId },
            data: { name: name.trim() }
        })
        res.json(updatedOrg)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/stats', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const [total, valid, invalid, today, daily] = await Promise.all([
            prisma.verificationLog.count({ where: { org_id: req.orgId } }),
            prisma.verificationLog.count({ where: { org_id: req.orgId, is_valid: true } }),
            prisma.verificationLog.count({ where: { org_id: req.orgId, is_valid: false } }),
            prisma.verificationLog.count({
                where: {
                    org_id: req.orgId,
                    created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                }
            }),
            prisma.$queryRaw`
                SELECT 
                    TO_CHAR(created_at, 'Dy') as day,
                    COUNT(*) FILTER (WHERE is_valid = true)::int as verified,
                    COUNT(*) FILTER (WHERE is_valid = false)::int as failed
                FROM "VerificationLog"
                WHERE org_id = ${req.orgId} AND created_at >= ${sevenDaysAgo}
                GROUP BY TO_CHAR(created_at, 'Dy'), DATE_TRUNC('day', created_at)
                ORDER BY DATE_TRUNC('day', created_at) ASC
            `
        ])

        res.json({
            total: Number(total),
            valid: Number(valid),
            invalid: Number(invalid),
            today: Number(today),
            daily
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/logs/recent', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    try {
        const logs = await prisma.verificationLog.findMany({
            where: { org_id: req.orgId },
            orderBy: { created_at: 'desc' },
            take: 5
        })
        res.json(logs)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/users', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { org_id: req.orgId },
            select: { id: true, email: true, role: true, status: true, created_at: true }
        })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.patch('/users/:userId/approve', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    const { userId } = req.params
    try {
        const user = await prisma.user.findFirst({
            where: { id: userId, org_id: req.orgId }
        })

        if (!user) return res.status(404).json({ message: "User not found in your organization" })

        await prisma.user.update({
            where: { id: userId },
            data: { status: "ACTIVE" }
        })

        res.json({ message: "User approved successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.patch('/users/:userId/decline', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    const { userId } = req.params
    try {
        const user = await prisma.user.findFirst({
            where: { id: userId, org_id: req.orgId }
        })

        if (!user) return res.status(404).json({ message: "User not found in your organization" })

        if (user.role === "OWNER") return res.status(403).json({ message: "Cannot decline an owner" })

        await prisma.user.update({
            where: { id: userId },
            data: { status: "DECLINED" }
        })

        res.json({ message: "User declined successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})

export default router