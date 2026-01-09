import { Elysia } from "elysia";
import { allMessages } from "../controllers/message.controller.js";

export const messageRouter = new Elysia(
    { prefix: "/message" })
    .get("/", allMessages)
     