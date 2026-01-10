import { Elysia } from 'elysia'
import { cors } from "@elysiajs/cors"
import { node } from '@elysiajs/node'
import { userRoute } from './routes/user.route.js'
import { notificationRoute } from './routes/notification.route.js'
import { messageRouter } from './routes/messages.route.js'
import { conversationRouter } from './routes/conversation.route.js'

export const app = new Elysia({ adapter: node() })
    .use(cors({ origin: "https://open-chat-roan.vercel.app" }))
    .use(userRoute)
    .use(notificationRoute)
    .use(conversationRouter)
    .use(messageRouter)
	.get('/', 
		() => "hello world!!"
    )
    .get("/api" , () => {
        return { message: "all good"}
    })
