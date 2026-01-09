import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type MessageDeliveryState = "sent" | "delivered" | "read";

export interface DeliveryStatus {
  [userId: string]: MessageDeliveryState;
}

export interface Message {
  _id?: string;
  conversationId: string;
  senderId: string | undefined;
  text: string;
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

export const { addMessage, setMessages, resetMessages , markMessagesRead } =
  messageSlice.actions;

export default messageSlice.reducer;