import express from 'express'
import { verifyOwner,verifyAuth, orgScope } from '../middlewares/auth'
import { prisma } from '../lib/prisma'

const router = express.Router()

router.get('/',verifyAuth,orgScope,verifyOwner,async(req,res)=>{
    const orgDetails = await prisma.organization.findFirst({
        where: {id: req.orgId}
    })
    res.json(orgDetails)
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