import express from 'express'
import { prisma } from '../lib/prisma.js'
import { orgScope, verifyAuth, verifyOwner } from '../middlewares/auth.js'
import crypto from 'crypto'

const router = express.Router()

router.get('/', verifyAuth, orgScope, async (req, res) => {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { org_id: req.orgId },
            select: { id: true, created_at: true }
        })
        res.json(keys)
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
        console.error(error)
    }
})

router.post('/',verifyAuth,orgScope,verifyOwner,async (req,res)=>{
    try{
        const org = await prisma.organization.findUnique({
            where: {id: req.orgId},
            include: {plan: true}
        })
        
        if(!org || !org.plan) return res.status(400).json({message: "No org or plan found"})

        const apiKeyCount = await prisma.apiKey.count({
            where: {org_id: req.orgId}
        })

        if(org.plan.maxApiKeys !== null && apiKeyCount >= org.plan.maxApiKeys){
            return res.status(403).json({message: "Api key limit reached. Upgrade your plan!"})
        }

        const rawKey = `vm_sk_${crypto.randomBytes(24).toString('hex')}`
        const hashKey = crypto.createHash('sha256').update(rawKey).digest('hex')

        await prisma.apiKey.create({data: {
            key: hashKey,
            org_id: req.orgId
        }})

        res.status(201).json({apiKey: rawKey, message: "The key will be shown one time only"})

    }catch(error){
        res.status(500).json({message: "Internal Server Error"})
        console.error(error)
    }
})

router.delete('/:id', verifyAuth, orgScope, verifyOwner, async (req, res) => {
    const { id } = req.params
    try {
        const key = await prisma.apiKey.findFirst({
            where: { id: id, org_id: req.orgId }
        })

        if (!key) return res.status(404).json({ message: "API Key not found" })

        await prisma.apiKey.delete({
            where: { id: id }
        })

        res.json({ message: "API Key revoked successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
        console.error(error)
    }
})

export default router