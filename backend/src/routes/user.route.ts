import { Elysia, t } from 'elysia'
import { friendShip , createUser, currentUser, deleteUser, getUsers, updateUser, SearchUsers, uploadProfile , updateName } from '../controllers/user.controller.js'

export const userRoute = new Elysia({ prefix: "/user" }) 
     .get("/all", getUsers)
     .get("/friendship", friendShip)
     .get("/search", SearchUsers)
     .get("/current", currentUser)
     .post("/create", createUser)
     .delete("/delete", deleteUser)
     .patch("/update", updateUser)
     .post("/upload-profile", uploadProfile)
     .put("/update-name", updateName)