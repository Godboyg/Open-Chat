import { status } from "elysia";
import User from "../models/user.js";
import crypto from "crypto";
import friend from "../models/friend.js";
import conversation from "../models/conversation.js";
import { saveProfileImage } from "../utils/upload.util.js";
import { mkdirSync } from "fs";
import cloudinary from "../config/cloudinary.js";

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

export const SearchUsers = async({ query }: any) => {
    try{
        const name = query.name;

        if (!name) {
          return {
            success: false,
            message: "Search name is required"
          };
        }

        const users = await User.find({
            fullName: { $regex: name, $options: "i" }
        }).limit(10);

        console.log("users ", users);

        return {
            success: true,
            count: users.length,
            data: users
        }

    } catch(error) {
        console.log("error",error);
    }
}

export const uploadProfile = async ({ body }: any) => {
  const file = body.profileImage as File;
  const userId = body.userId as string;

  console.log(body);

  if (!file) {
    return { error: "No file uploaded" };
  }

  console.log("calculating");
  const result = await saveProfileImage(file);
  console.log("url and id before",result);
  const { url, publicId } = result;

  const user = await User.findOne(
      {uniqueUserId: userId}
  );

  if (!user) {
    return { message: "User not found" };
  }
  const oldPublicId = user.imagePublicId;

  try {
    user.image = url;
    user.imagePublicId = publicId;
    await user.save();

  if (oldPublicId) {
      await cloudinary.uploader.destroy(oldPublicId);
    }

    return { success: true, image: url };
} catch (err) {
  console.error("Error saving user:", err);
}

  return {
    success: true,
    profileImage: url,
  };
};

export const updateName = async({ body }: any) => {
    try{
        const userId = body.userId;
        const name = body.name;
        const updateUser = await User.findOneAndUpdate(
            { uniqueUserId: userId },
            {
                $set: {
                    fullName: name
                }
            },
            {
                new: true
            }
        )

        if (!updateUser) {
          return { success: false, message: "User not found" };
        }

        return {
          success: true,
          message: "Name updated successfully",
          data: updateUser
        };
    } catch(Error) {
        console.log("Error",Error)
    }
}