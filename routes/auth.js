import express from 'express'
import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"
import { signToken } from "../utils/jwt"
import { verifyAuth } from '../middlewares/auth'

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
                    status: status,
                    org_id: org.id
                }
            })
            return { user, org }
        })

        const token = signToken({
            user_id: result.user.id,
            org_id: result.org.id,
            role: result.user.role,
            status: result.user.status
        })

        res.status(201).json({
            message: result.user.status === "PENDING" ? "Membership request sent. Waiting for approval." : "Signup Successful",
            token: token,
            status: result.user.status
        })

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
            if (!data) return res.json({ message: "User Not Found" })
            
            const orgName = await tx.organization.findUnique({
                where: {id: data.org_id},
                select: {name: true}
            })

            return {data,orgName}
        })

        res.json({
            id: result.data.id,
            email: result.data.email,
            role: result.data.role,
            status: result.data.status,
            orgName: result.orgName.name
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
})



export default router