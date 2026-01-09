import mongoose, { InferSchemaType , Model } from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String },
    // deviceId: { type: String },
    uniqueUserId: { type: String},
    image: { type: String },
    fullName: { type: String },
    phoneNumber: { 
        type: String,
        // required: true,
        unique: true,
        trim: true,
        match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
    },
    lastActive: { type: Date , default: Date.now }},
    { timestamps: true }
)

export type UserType = InferSchemaType<typeof userSchema>;

const User: Model<UserType> = mongoose.models.User || mongoose.model<UserType>("User", userSchema);

export default User;