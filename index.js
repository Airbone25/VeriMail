import 'dotenv/config'
import express from 'express';
import cors from 'cors'

const app = express()

app.use(cors({origin: process.env.CLIENT_URL}))
app.use(express.json())

const PORT = process.env.PORT

import authRoutes from './routes/auth.js'
app.use('/auth',authRoutes)

import orgRoutes from './routes/org.js'
app.use('/org',orgRoutes)

import apiKeyRoutes from './routes/api.js'
app.use('/api-key',apiKeyRoutes)

import productRoutes from './routes/product.js'
app.use('/v1/email',productRoutes)

app.listen(PORT ,()=>{
    console.log("Server is running " + PORT)
})