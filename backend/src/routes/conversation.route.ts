   
import { Elysia } from "elysia"
import { allConversation } from "../controllers/conversation.controller.js"

export const conversationRouter = new Elysia({ prefix: 
    "/conversation" })
    .get("/", allConversation)