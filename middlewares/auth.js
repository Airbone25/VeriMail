import { verifyToken } from "../utils/jwt"

export function verifyAuth(req,res,next){
    let authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({message: "Token Missing or Invalid"})
    }
    
    const token = authHeader.split(" ")[1]
    
    try{
        const decoded = verifyToken(token)
        req.user = {
            user_id: decoded.user_id,
            org_id: decoded.org_id,
            role: decoded.role,
            status: decoded.status
        }
        next()
    }catch(error){
        console.error("Auth Token Error:", error.message)
        res.status(401).json({message: "Invalid or expired token"})
    }
}

export function orgScope(req,res,next){
    req.orgId = req.user.org_id
    next()
}

export function verifyOwner(req,res,next){
    if(req.user.role != "OWNER") return res.status(403).json({message: "Access Forbidden, OWNER access required"})
    
    next()
}

export function verifyActive(req,res,next){
    if(req.user.status != "ACTIVE") return res.status(403).json({message: "Access Forbidden, User status is not ACTIVE"})
    
    next()
}