import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MessageDeliveryState = "sent" | "delivered" | "read";

export interface DeliveryStatus {
  [userId: string]: MessageDeliveryState;
}

export interface reply {
  clientId?: string;
  name?: string | undefined | null;
  senderId: string;
  text: string;
  // date: Date | number | string;
}

export interface Message {
  _id?: string;
  clientMessageId?: string;
  conversationId: string;
  senderId: string | undefined;
  text: string;
  reply?: reply;
  edited?: boolean;
  // name: string;
  createdAt?: Date | number | string;
  status?: "sent" | "read";
  deliveryStatus?: DeliveryStatus;
  receiversId? : string[];
}

interface MessageState {
  byConversationId: Record<string, Message[]>;
}

const initialState: MessageState = {
  byConversationId: {},
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      const { conversationId , _id } = action.payload;

      if (!state.byConversationId[conversationId]) {
        state.byConversationId[conversationId] = [];
      }

      const exists = state.byConversationId[conversationId].some(
         (msg) => msg._id === _id
      );

      if (exists) return;

      state.byConversationId[conversationId].push(action.payload);
    },

    removeMessage(state , action: PayloadAction<{ conversation: string , id: string }>) {
      const messages = state.byConversationId[action.payload.conversation];
      if (!messages) return

      state.byConversationId[action.payload.conversation] = messages.filter(
        (msg) => msg._id !== action.payload.id
      )
    },

    updateMessage(state , action: PayloadAction<{ conversation: string , msgId: string , msg: string }>) {
      const messages = state.byConversationId[action.payload.conversation];
      if (!messages) return;

      const message = messages.find(
        (m) => (m.clientMessageId ? m.clientMessageId === action.payload.msgId : m._id === action.payload.msgId)
      );
      if (!message) return;

      message.text = action.payload.msg;
      message.edited = true
    },

    setMessages(
      state,
      action: PayloadAction<{ conversationId: string; messages: Message[] }>
    ) {
      state.byConversationId[action.payload.conversationId] =
        action.payload.messages;
    },

    markMessagesRead: (state, action) => {
     const { conversationId, userId } = action.payload;

     const messages = state.byConversationId[conversationId];
     if (!messages) return;

     messages.forEach((msg) => {
      if(msg.senderId === userId) {
        msg.status = "read"
      }
     })
   },

    resetMessages() {
      return initialState;
    },
  },
});

export const { 
  addMessage, setMessages, resetMessages , markMessagesRead ,
  removeMessage , updateMessage
} =
  messageSlice.actions;

export default messageSlice.reducer;