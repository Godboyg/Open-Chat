import { Elysia } from "elysia";
import { allNotification } from "../controllers/notification.controller.js";

export const notificationRoute = new Elysia({ prefix: 
    "/notification" })
    .get("/" , allNotification)