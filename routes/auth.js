import express from 'express'
import { prisma } from "../lib/prisma.js"
import bcrypt from "bcrypt"
import { signToken } from "../utils/jwt.js"
import { verifyAuth } from '../middlewares/auth.js'
import crypto from 'crypto'
import { sendVerificationEmail } from '../utils/mailer.js'

const router = express.Router()

router.post('/signup', async (req, res) => {
    const { email, password, org_name } = req.body
    if (!email || !password || !org_name) return res.status(400).json({ message: "Missing Fields" })
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) return res.status(409).json({ message: "User already exists!" })

        const hashPass = await bcrypt.hash(password, 10)

        const result = await prisma.$transaction(async (tx) => {
            let org = await tx.organization.findFirst({
                where: { name: org_name }
            })
            let role = "MEMBER"
            let status = "PENDING"
            if (!org) {
                const defaultPlan = await tx.plan.findUnique({ where: { name: "Free" } })
                if (!defaultPlan) throw new Error("No Default Plan")

                org = await tx.organization.create({
                    data: {
                        name: org_name.trim(),
                        plan_id: defaultPlan.id
                    }
                })
                role = "OWNER"
                status = "ACTIVE"
            }
            const user = await tx.user.create({
                data: {
                    email: email,
                    password: hashPass,
                    role: role,
                    status: "UNVERIFIED",
                    isEmailVerified: false,
                    org_id: org.id
                }
            })
            
            const verificationToken = crypto.randomInt(100000, 999999).toString()
            await tx.verificationToken.create({
                data: {
                    token: verificationToken,
                    user_id: user.id,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                }
            })

            return { user, org, verificationToken }
        })

        try {
            await sendVerificationEmail(email, result.verificationToken)
        } catch (mailError) {
            console.error("Failed to send verification email:", mailError)
        }

        const token = signToken({
            user_id: result.user.id,
            org_id: result.org.id,
            role: result.user.role,
            status: "UNVERIFIED"
        })

        res.status(201).json({
            message: "Signup Successful. Please verify your email.",
            token: token,
            status: "UNVERIFIED"
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post('/verify-email', async (req, res) => {
    const { token, email } = req.body
    if (!token || !email) return res.status(400).json({ message: "Missing token or email" })

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return res.status(404).json({ message: "User not found" })

        const vToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                user_id: user.id,
                expires_at: { gte: new Date() }
            }
        })

        if (!vToken) return res.status(400).json({ message: "Invalid or expired token" })

        // Update user status based on whether they were owner or member
        // For simplicity, we'll re-check if they own the org or if they should be pending
        const org = await prisma.organization.findUnique({ where: { id: user.org_id }, include: { Users: true } })
        
        let newStatus = "PENDING"
        if (user.role === "OWNER") newStatus = "ACTIVE"

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true, status: newStatus }
            }),
            prisma.verificationToken.delete({ where: { id: vToken.id } })
        ])

        // Generate new JWT with updated status
        const jwtToken = signToken({
            user_id: user.id,
            org_id: user.org_id,
            role: user.role,
            status: newStatus
        })

        res.json({ message: "Email verified successfully", token: jwtToken, status: newStatus })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const currUser = await prisma.user.findUnique({ where: { email: email } })
        if (!currUser) return res.status(401).json({ message: "Invalid email or password" })

        const isMatch = await bcrypt.compare(password, currUser.password)
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" })

        const token = signToken({
            user_id: currUser.id,
            org_id: currUser.org_id,
            role: currUser.role,
            status: currUser.status
        })

        res.json({
            message: "Login Successful",
            token: token,
            status: currUser.status
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.get('/me', verifyAuth, async (req, res) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const data = await tx.user.findUnique({ 
                where: { id: req.user.user_id }, 
                select: { id: true, email: true, role: true ,org_id: true, status: true } 
            })
            if (!data) return null
            
            const org = await tx.organization.findUnique({
                where: {id: data.org_id},
                select: {name: true}
            })

            return {data, org}
        })

        if (!result || !result.data) {
            return res.status(401).json({ message: "User Not Found" })
        }

        res.json({
            id: result.data.id,
            email: result.data.email,
            role: result.data.role,
            status: result.data.status,
            orgName: result.org?.name || "N/A"
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.patch('/update-org', verifyAuth, async (req, res) => {
    const { org_name } = req.body
    if (!org_name) return res.status(400).json({ message: "Organization name is required" })

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.user_id }
        })

        if (!user) return res.status(404).json({ message: "User not found" })
        if (user.status === "ACTIVE") return res.status(403).json({ message: "Cannot change organization once active" })

        const result = await prisma.$transaction(async (tx) => {
            let org = await tx.organization.findFirst({
                where: { name: org_name.trim() }
            })

            let role = "MEMBER"
            let status = "PENDING"

            if (!org) {
                const defaultPlan = await tx.plan.findUnique({ where: { name: "Free" } })
                if (!defaultPlan) throw new Error("No Default Plan")

                org = await tx.organization.create({
                    data: {
                        name: org_name.trim(),
                        plan_id: defaultPlan.id
                    }
                })
                role = "OWNER"
                status = "ACTIVE"
            }

            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    org_id: org.id,
                    role: role,
                    status: status
                }
            })

            return { user: updatedUser, org }
        })

        const token = signToken({
            user_id: result.user.id,
            org_id: result.org.id,
            role: result.user.role,
            status: result.user.status
        })

        res.json({
            message: result.user.status === "PENDING" ? "Membership request updated." : "Organization changed successfully.",
            token: token,
            status: result.user.status
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})



router.patch('/request-access', verifyAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.user_id }
        })

        if (!user) return res.status(404).json({ message: "User not found" })
        if (user.status !== "DECLINED") return res.status(400).json({ message: "Can only request access if previously declined" })

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { status: "PENDING" }
        })

        const token = signToken({
            user_id: updatedUser.id,
            org_id: updatedUser.org_id,
            role: updatedUser.role,
            status: updatedUser.status
        })

        res.json({
            message: "Access request sent successfully",
            token: token,
            status: updatedUser.status
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

export default router