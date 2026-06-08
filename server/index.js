import 'dotenv/config'
import express from 'express'
// import userRoute from './routes/index.route'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import connectDB from './db.js'
import bearerToken from 'express-bearer-token'
import fileupload from 'express-fileupload'
import apiRoutes from './routes/index.js'
import redis from './redis/config/redis.js'
import UniversalRedis from './redis/config/universalRedis.js'
import { socket } from './sockets/SocketManager.js'
import ssoRoute from './routes/sso.route.js'
import requestIp from 'request-ip'
const app = express()
const PORT = process.env.PORT || 4000


app.use(express.json())
app.use(fileupload({}))
app.use(express.urlencoded({ extended: false }))
app.use(requestIp.mw())
const allowedOriginsString = process.env.ALLOWED_ORIGINS
let allowedOriginsArray = []
if (allowedOriginsString) allowedOriginsArray = JSON.parse(allowedOriginsString)

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOriginsArray.includes(origin)) {
                callback(null, true) // Allow the request
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, token'
    })
)

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
})

io.on('connection', (s) => {
    console.log('✅ Socket connected:', s.id)
    socket(s, io, redis)

    s.on('disconnect', () => {
        console.log('❌ Socket disconnected:', s.id)
    })
})

await redis.logger()
redis.connect(async () => {
    redis.connectToSubscriber(() => {
        UniversalRedis(redis)
    })
})

app.use(bearerToken())

connectDB()
app.use('/v1', apiRoutes)
app.use('/v1/sso', ssoRoute)

app.get('/', (req, res) => {
    res.send('API is running')
})

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
