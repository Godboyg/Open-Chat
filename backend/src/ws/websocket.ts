import WebSocket, { WebSocketServer, type RawData } from 'ws'
import redis from '../lib/redis.js';
import friend from '../models/friend.js';
import notification from '../models/notification.js';
import conversation from '../models/conversation.js';
import User from '../models/user.js';
import Message from '../models/messages.js';
import type { IncomingMessage } from "http";
import { sendPushNotification } from '../lib/push.js';
import { error } from 'console';

interface ExtWebSocket extends WebSocket {
  userId?: string;
}

interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type DeliveryState = "sent" | "delivered" | "read";

export const wss = new WebSocketServer({ noServer: true })

interface Room {
  SocketId: WebSocket[]
}

export const config = {
  api: { bodyParser: false }
}

let nextId = 1;

const clients = new Set<ExtWebSocket>();

const subscriptions = new Map<string, PushSubscription>();
const wsToUser = new Map();

const CHAT_KEY = "global_chat";
const CHAT_TTL = 300;

wss.on('connection', (ws: ExtWebSocket , request: IncomingMessage) => {
  console.log('🟢 New WebSocket connection');
  clients.add(ws);

  clients.forEach(async(cl) => {
    console.log("sended");
    cl.send(JSON.stringify({ type:"onlineUsers", text: "socket connected" , size: `${clients.size}`}));
  })

  ws.on('message', (msg: RawData) => {
    try{
       const data = JSON.parse(msg.toString());
       clients.forEach(async (cl) => {
        if(data.type === "thought"){
          const message = {
            type: data.type,
            msg: data.msg,
            time: data.time,
            User: data.User,
            User_id: data.User_id,
            avtr: data.avtr,
            timestamp: data.timestamp,
            reply: data.reply ? data.reply : null
          };
          await redis.zadd(
            CHAT_KEY,
            data.timestamp,
            JSON.stringify(message)
          );

          const ttl = await redis.ttl(CHAT_KEY);
          if (ttl === -1) {
            await redis.expire(CHAT_KEY, CHAT_TTL);
          }
          // if(cl === data.User_id){
          //   console.log("continue");
          // }
          // else {
            cl.send(JSON.stringify(message))
          // }
        }
        else if(data.isActive){
          cl.send(JSON.stringify({ isActive: data.isActive , current: data.session?.user?.internalId}))
        } else if(data.type === "toEdit"){
          cl.send(JSON.stringify({ type: data.type , msg: data.msg , newMsg: data.newMsg }))
        } else if(data.type === "user-online"){
          const subs = data.subscription as PushSubscription;
          if(subs) {
            subscriptions.set(data.session?.user.internalId , subs);
          } else if(subs === undefined) {
            ws.send(JSON.stringify({ type: "push-error" , error: subs }))
          }
          console.log(subscriptions);
          console.log("user online data",data);
          if(data.session === null) {
            ws.send(JSON.stringify({ type:"session-missing" }))
          }
          
          const messages = await redis.zrange(CHAT_KEY, 0, -1);
          console.log("mess",messages);

          const parsedMessages = messages.map(m => JSON.parse(m));
          console.log(parsedMessages);

          const socket = wsToUser.get(data.session?.user.internalId);
          if(socket) {
            console.log("sended");
            socket.send(JSON.stringify({ type:"chat_history", parsedMessages}));
          }

          wsToUser.set(data.session?.user?.internalId, ws);
          ws.userId = data.session?.user?.internalId ?? "";

          const pending = await notification.find({ 
            userId: data.session?.user?.internalId,
            isRead: false
          })

          const pendingMsg = await Message.find({
             receiversId: data.session?.user?.internalId,
             [`deliveryStatus.${data.session?.user?.internalId}`] : "sent"
          });

          console.log("pending ",pending);

          ws.send(JSON.stringify({
            type: "PENDING_NOTIFICATIONS",
            data: pending,
          }));

          ws.send(JSON.stringify({ 
            type: "PENDING_MSG",
            message: pendingMsg
          }))

          const userId = data.session?.user?.internalId;
          if (userId) {
            await redis.sadd("online_users", userId);
          }

          const onlineUsers = await redis.smembers("online_users");

          const staleUsers: string[] = [];

          for(const user of onlineUsers) {
            if(!wsToUser.has(user)) {
              staleUsers.push(user)
            }
          }

          if(staleUsers.length > 0) {
            await redis.srem("online_users", ...staleUsers);
          }

          const cleanedOnlineUsers = staleUsers.length > 0
             ? await redis.smembers("online_users")
             : onlineUsers;

          cl.send(JSON.stringify({
            type: "ONLINE_USERS",
            users: cleanedOnlineUsers
          }));
        } else if(data.type === "push-error") {
          ws.send(JSON.stringify({ type: "push-error" , error: data.error }))
        } else if(data.type === "friend-request") {
          console.log(data.to , data.from);
          const receiver = wsToUser.get(data.to);
          const senderId = wsToUser.get(data.from);

          const [userA, userB] = [data.from, data.to].sort();
          
          const result = await friend.updateOne(
             { requester: userA, recipient: userB },
             { $setOnInsert: { requester: userA, recipient: userB } },
             { upsert: true }
           );

           if (result.upsertedCount > 0) {
             console.log("Friend request created");
           } else {
             console.log("Friend request already exists");
             return;
           }
           let senderNotification = await notification.findOneAndUpdate(
               {
                 userId: data.from,
                 to: data.to,
                 type: "FRIEND_REQUEST"
               },
               {
                $setOnInsert: {
                  userId: data.from,
                  to: data.to,
                  type: "FRIEND_REQUEST",
                  message: "REQUEST_SENT",
                  isRead: false
               }
               },
               { upsert: true }
               );

          let notificationReceived = await notification.findOneAndUpdate(
              {
                userId: data.to,
                from: data.from,
                type: "FRIEND_REQUEST"
              },
              {
                $setOnInsert: {
                  userId: data.to,
                  from: data.from,
                  type: "FRIEND_REQUEST",
                  message: "REQUEST_RECEIVED",
                 isRead: false
                }
                 },
                { upsert: true }
             );

          if (receiver) {
            const found = await User.findOne({ uniqueUserId: data.from })
            console.log("found",found);

            receiver.send(JSON.stringify({
              type: "friend_request_received",
              payload: { from: data.from , notificationReceived , found , to: data.to }
            }));

            await notification.findByIdAndUpdate(
              notificationReceived && notificationReceived._id ,
              { isRead: true },
              { new: true }
            )
          } 
          if(senderId) {
            senderId.send(JSON.stringify(
              { type: "request-sent" , senderNotification , 
                to: data.to, from: data.from 
               }))
          }
        } else if(data.type === "friend-request-accepted"){
          const from = wsToUser.get(data.from);
          const to = wsToUser.get(data.to);

          console.log("to: from:", data.to , data.from);

          const participents = [data.from.toString(), data.to.toString()].sort();
          const friendKey = participents.join("_");
          console.log("participents",participents);
          console.log("participents2",friendKey);
          let newConversation;
          if(friendKey) {
            newConversation = await conversation.findOne({ friendKey });
          }
          else {
            ws.send(JSON.stringify({ type:"try again!" }))
            return;
          }
          if(!newConversation && friendKey) {
            newConversation = await conversation.create({
              type: "direct",
              participents,
              friendKey
            })
          }
          console.log("newConversation",newConversation)

          const newFriend = await friend.findOneAndUpdate(
            {
              $or: [
                {
                  requester: data.from,
             recipient: data.to
                }, {
                  requester: data.to,
             recipient: data.from
                }
              ]
            },
            {
              $set: {
                status: "accepted",
                conversationId: newConversation?._id
              }
            }, 
            {
              new: true
            }
          )

          // const toUser = await User.findOne({
          //   uniqueUserId: data.to
          // })

          // const fromUser = await User.findOne({
          //   uniqueUserId: data.from
          // })
          const getNotify = await notification.findOneAndUpdate({
            $or: [
              {
                userId: data.from,
                from: data.to
              } , {
                userId: data.to,
                from: data.from
              }
            ]
          },{
             $set: {
              conversationId: newConversation?._id,
             }
          }, 
            {
              new: true
          })
          const getNotifySnder = await notification.findOneAndUpdate({
            $or: [
              {
                userId: data.from,
                to: data.to
              } , {
                userId: data.to,
                to: data.from
              }
            ]
          },{
             $set: {
              conversationId: newConversation?._id,
             }
          })

          if(from) {
            from.send(JSON.stringify({ 
              type: "request-accepted" , newFriend , newConversation,
              conversationId: newConversation?._id,
              _id: data.to,
              from: data.from,
              status: "accepted"
            }))
          } else {
            await notification.findOneAndUpdate({
              userId: data.from,
              to: data.to,
              message: "friend by the user",
              conversationId: newConversation?._id,
            }, {
              $setOnInsert: {
              userId: data.from,
              to: data.to,
              type: "STATE_CHANGE",
              message: "friend by the user",
              conversationId: newConversation?._id,
              isRead: false
            }
            },{
              new: true,
              upsert: true
            })
          }
          if(to) {
            to.send(JSON.stringify({ 
              type: "request-accepted" , newFriend , newConversation ,
              conversationId: newConversation?._id,
              _id: data.from,
              from: data.to,
              status: "accepted"
            }))
          }
        } else if(data.type === "unFrnd"){
          console.log(data);
          const newFriend = await friend.findOneAndUpdate({
            $or: [
              {
               requester: data.fnd._id,
               recipient: data.session.user.internalId
              } , {
                requester: data.session.user.internalId,
                recipient: data.fnd._id
              }
            ]
          },
            {
              status: "unfrnd"
            }, 
            {
              new: true
            }
          )

          const from = wsToUser.get(data.fnd._id);
          const to = wsToUser.get(data?.session?.user?.internalId);

          if(from) {
            from.send(JSON.stringify({
               type: "user-unfrnd" , newFriend , sender: data.fnd._id ,
               to: data.session.user.internalId
            }))
          } else {
            await notification.findOneAndUpdate({
              userId: data.fnd._id,
              to: data.session.user.internalId,
              type: "unfriend by the user",
            }, {
              $setOnInsert: {
              userId: data.fnd._id,
              to: data.session.user.internalId,
              type: "STATE_CHANGE",
              message: "unfriend by the user",
              isRead: false
            }
            }, {
              new: true,
              upsert: true
            })
          }
          if(to) {
            to.send(JSON.stringify({ 
              type: "unfrnd" , newFriend , sender: data.session.user.internalId ,
              to: data.fnd._id
            }))
          } else {
            await notification.findOneAndUpdate(
              {
               userId: data.session.user.internalId,
               to: data.fnd._id,
               message: "unfriended",
              },{
                $setOnInsert: {
                 userId: data.session.user.internalId,
                 to: data.fnd._id,
                 type: "STATE_CHANGE",
                 message: "unfriended",
                 isRead: false
                }
              },{
                new: true,
                upsert: true
              })
          }
        } else if(data.type === "done") {
          await notification.findOneAndDelete({
            userId: data.session?.user?.internalId,
            message: "unfriend by the user"
          })
        } else if(data.type === "message sent"){
           try{
            const id = data.activeId;
            console.log("data", data);
            const members = await conversation.findById(id);

            console.log(members.participents);

            let receiversId = members.participents.find(
              (id: any) => id.toString() !== data.senderId.toString()
            )

            const deliveryStatus: Record<string, DeliveryState> = {};
            console.log("type", typeof receiversId);

            const ids =
                  Array.isArray(receiversId)
                    ? receiversId
                    : typeof receiversId === "string"
                      ? receiversId.split(",")
                      : [];

            ids.forEach((id: any) => {
              deliveryStatus[id.toString()] = "sent";
            });
            console.log("delivery status",deliveryStatus);

            const msg = await Message.findOneAndUpdate(
               { clientMessageId: data.clientMessageId },
               {
                 $setOnInsert: {
                   clientMessageId: data.clientMessageId,
                   conversationId: id,
                   senderId: data.senderId,
                   text: data.text,
                   receiversId,
                   deliveryStatus
                 }
               },
               {
                 new: true,
                 upsert: true
               }
             );

             await conversation.findByIdAndUpdate(
                id,
                {
                  lastMessage: {
                    text: data.text,
                    senderId: data.senderId,
                    date: Date.now()
                  }
                }
              )
            
            for(const userId of members.participents){
              if(userId === data.senderId) continue;

              const socket = wsToUser.get(userId);
              if(socket){
                console.log("sended msg");
                socket.send(JSON.stringify({ type: "message received" , msg }))
              } else {
                const webPushSubscription = subscriptions.get(userId) as PushSubscription;
                if(webPushSubscription) {
                  await sendPushNotification(webPushSubscription, {
                    title: "New Message",
                    body: `${data.session?.user.name} sent you a message`,
                    from: `${data.session?.user.name}`,
                    url: "/chat/userA",
                  })
                }
              }

              // if(socket){
              //   await Message.findOneAndUpdate({
              //    receiversId: data.userId,
              //    [`deliveryStatus.${userId}`] : "sent"
              //   },{
              //    [`deliveryStatus.${userId}`]: "delivered"
              //   })
              // }
            }
           } catch(error) {
            console.log("error",error);
           }
        } else if(data.type === "msg read"){
          try{
            console.log("in");
            console.log("hello");

            await Message.updateMany(
              { conversationId: data.activeId,
                receiversId: data.session?.user?.internalId,
                $or: [
                  {
                     [`deliveryStatus.${data.session?.user?.internalId}`]: "delivered"
                  },{
                    [`deliveryStatus.${data.session?.user?.internalId}`] : "sent"
                  }
                ]
              },
              {
                [`deliveryStatus.${data.session?.user?.internalId}`]: "read"
              }
            )

          } catch(error) {
            console.log("error",error);
          }
        } else if(data.type === "msg read online"){
          try{
            console.log("in side");
            const areFriends = await friend.findOne({
              conversationId: data.activeId
            })
            if(areFriends.status === "accepted") {
              const convo = await conversation.findById(data.activeId);
              var parts;
              if(convo) {
                parts = convo.participents;
              }
            const unReadMsg = await Message.find({
              conversationId: data.activeId,
              // [`deliveryStatus.${data.session.user.internalId}`]: "read"
            })

            console.log(unReadMsg.length);
            const last = unReadMsg[unReadMsg.length - 1];

            for(const p of parts) {
              if(p === data?.session?.user?.internalId && p !== convo.lastMessage.senderId){
                const socket = wsToUser.get(p);
                if(socket) {
                  socket.send(JSON.stringify({ type: "unread-msg" , unReadMsg , senderId: last.senderId }));
                }
              };
            }
            } else {
              const socket = wsToUser.get(areFriends.recipient);
              const soc = wsToUser.get(areFriends.requester);
              if(socket) {
                socket.send(JSON.stringify({ type:"cannot-msg-add" }))
              }
              if(soc) {
                soc.send({ type:"cannot-msg" })
              }
            }
          } catch(error) {
            console.log("error",error);
          }
        } else if(data.type === "now seen") {
          try{
            const socket = wsToUser.get(data.senderId);
            if(socket) {
              console.log("socket is there", data.senderId);
              socket.send(JSON.stringify({ type: "seen-now" , activeId: data.activeId , senderId: data.senderId }));
            }
          } catch(error) {
            console.log("error",error);
          }
        } else if(data.type === "mark-d"){
          try{
             await Message.updateMany(
            {
              receiversId: data.session?.user?.internalId,
              [`deliveryStatus.${data.session?.user?.internalId}`] : "sent"
            },{
              $set: {
                 [`deliveryStatus.${data.session?.user?.internalId}`] : "delivered"
              }
            })
          } catch(error) {
            console.log("error",error);
          }
        } else if(data.type === "mark-n") {
          try{
            console.log("marlkedd");
            await notification.updateMany(
              {
                userId: data.session?.user?.internalId,
                isRead: false
              },
              {
                $set: { isRead: true }
              }
            );
          } catch(Error) {
            console.log(Error);
          }
        } else if(data.type === "Typing") {
          try{
            const convo = await conversation.findById(data.activeId);
              for(const part of convo.participents) {
               if(part === data.session.user.internalId) continue;

               const socket = wsToUser.get(part);

               if(socket) {
                socket.send(JSON.stringify({ type: "Typing" , convo: data.activeId }))
               }
              }
          } catch(error) {
            console.log("error",error);
          }
        } else if(data.type === "Typing-stop") {
          try{
            const convo = await conversation.findById(data.activeId);
              for(const part of convo.participents) {
                if(part === data.session.user.internalId) continue;

                const socket = wsToUser.get(part);

                if(socket) {
                  socket.send(JSON.stringify({ type: "Typing-stop" , session: data.session }))
                }
              }
          } catch(error) {
            console.log("Error",error);
          }
        } else if(data.type === "Typing-g") {
           const socket = wsToUser.get(data.session?.user?.internalId);
           if(socket && cl !== socket) {
             cl.send(JSON.stringify({ type: "Typing-g" , session: data?.session}));
           };
        } else if(data.type === "Typing-stop-g") {
          cl.send(JSON.stringify({ type: "Typing-stop-g" , session: data?.session}));
        } else if(data.type === "seen") {
          try{
            console.log("data",data.msg);
            const socket = wsToUser.get(data.msg.senderId);
            if(socket) {
              socket.send(JSON.stringify({ type: "msg-seen" , msg: data.msg }))
            }
          } catch(error) {
            console.log("error",error)
          }
        } else if (
      data.type === "call-offer" ||
      data.type === "call-answer" ||
      data.type === "call-ice" ||
      data.type === "call-end"
    ) {
      const target = wsToUser.get(data.to);
      if (!target) return;

      ws.send(JSON.stringify({ type: "user-there" }));

      target.send(
        JSON.stringify({
          ...data,
          from: data.session?.user?.internalId
        })
      );
    }
       })
    } catch(err) {
      console.log("error",err);
    }
  })  

  ws.on('close', async() => {
    console.log('🔴 WebSocket disconnected');
    if(ws.userId){
      await User.findOneAndUpdate({
        uniqueUserId: ws.userId
      },{
        lastActive: new Date()
      })
      await redis.srem("online_users", ws.userId);
      wsToUser.delete(ws.userId);
    }
    clients.delete(ws);
    const online = await redis.smembers("online_users");
    console.log("al users",online);
    clients.forEach(async(cl) => {
      cl.send(JSON.stringify({ type:"onlineUsers", text: "socket disconnected" , size: `${clients.size}`}));
      // const onlineUsers = await redis.smembers("online_users");
      console.log("sdjhvsdj",online);
      const payload = JSON.stringify({
         type: "ONLINE_USERS_AFTER",
         users: online
      })
      cl.send(payload)
    })
  })
})