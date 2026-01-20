import { status } from "elysia";
import User from "../models/user.js";
import crypto from "crypto";
import friend from "../models/friend.js";
import conversation from "../models/conversation.js";

export const getUsers = async() => {
    const allUsers = await User.find();
    return {
        Message: "hello",
        allUsers
    }
}

export const currentUser = async({ query }: any) => {
    try{
        const uniqueUserId = query.uniqueUserId;
        // console.log("deviceid",uniqueUserId);
        if(!uniqueUserId) {
            return { Message: "Missing userId" , status: 400}
        }
        
        const current = await User.findOne({ uniqueUserId });

        if(!current) {
            return { Message: "User not found!" , status: 404 }
        }

        return { Message: "User found!" , current , status: 200 }
    } catch(error) {
        return { Message: "Something went wrong!" , status: 500 }
    }
}

export const createUser = async({ body }: any) => {
    try{
        console.log("user data", body);
    const create = await User.create({
        email: body.email,
        image: body.image,
        uniqueUserId: crypto.randomUUID(),
    });
    console.log("user created!",create);
    return { 
        Message: "user created",
        sucess: true,
        create,
        status: 201
    }
    } catch(error) {
        console.log("Error",error);
    }
}

export const deleteUser = async({ body }:any) => {
    console.log("data in delete",body);
    try{
        const deletedUser = await User.deleteOne({ uniqueUserId: body.internalId})
        return { Message: "User deleted" , deleteUser}
    } catch (error) {
        console.log("error",error);
    }
}

export const updateUser = async({ body }: any) => {
    try{
        console.log("data in patch", body);
        console.log("err");
        const res = await User.updateOne(
            { uniqueUserId: body.uniqueUserId },
            {
                $set:{
                    fullName: body.fullName,
                    phoneNumber: body.phoneNumber,
                    lastActive: new Date()
                }
            }
        )
        console.log("res data",res);
        return { Message:"Done!" , res }
    } catch(error) {
        console.log("Error",error)
    }
}

export const friendShip = async({ query }: any) => {
    try{
        const userId = query.userId;
        console.log("userid",userId);

        const friendShip = await friend.find({
            $or: [
                {
                    requester: userId
                }, {
                    recipient: userId
                }
            ],
            status: "accepted"
        })

        if (friendShip.length === 0) {
      return {
        message: "No friendships found",
        friendShip: [],
        convoId: []
      };
    }

      
        const friendIds = friendShip.map((f: any) =>
      f.requester.toString() === userId
        ? f.recipient
        : f.requester
    );

    // 3. Find conversations between user and friends
    const convoId = await conversation.find({
      participents: {
        $all: [userId],
        $in: friendIds
      }
    });

        return { message: "status" , friendShip , convoId }
    } catch(Error) {
        console.log("error",Error);
    }
} 