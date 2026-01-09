import { Elysia, t } from 'elysia'
import { friendShip , createUser, currentUser, deleteUser, getUsers, updateUser } from '../controllers/user.controller.js'

export const userRoute = new Elysia({ prefix: "/user" }) 
     .get("/all", getUsers)
     .get("/friendship", friendShip)
     .get("/current", currentUser)
     .post("/create", createUser)
     .delete("/delete", deleteUser)
     .patch("/update", updateUser)