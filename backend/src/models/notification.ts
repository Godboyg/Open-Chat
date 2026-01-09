import mongoose, { InferSchemaType, Model } from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: String },
    from: { type: String },
    to: { type: String },
    type: { type: String },
    message: { type: String},
    conversationId: { type: String },
    isRead: { type: Boolean },
    createdAt: { type: Date , default: Date.now}
})

export type notificationType = InferSchemaType<typeof notificationSchema>

const notification:Model<notificationType> = mongoose.models.notification || mongoose.model("notification", notificationSchema)

export default notification;