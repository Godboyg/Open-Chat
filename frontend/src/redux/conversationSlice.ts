import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type lastM = {
  text: string,
  senderId: string,
  createdId: Date | string
}

export type convo = {
  _id: string;
  participents?: string[];
  conversationId?: string;
  // createdAt: string;
  // conversationId?: string,
  lastMessage?: lastM;
}

export interface Conversation {
  convo: convo;
  otherUser?: {
    image: string,
    fullName: string | undefined,
    uniqueUserId: string,
    lastActive: string
  };
  message?: number | undefined;
}

interface ConversationState {
  byId: Record<string, Conversation>;
  allIds: string[];
  activeId: string | null;
}

const initialState: ConversationState = {
  byId: {},
  allIds: [],
  activeId: null,
};

const conversationSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    upsertConversation(
      state,
      action: PayloadAction<Conversation>
    ) {
      const id = action.payload.convo._id;
      state.byId[id] = action.payload;

      if (!state.allIds.includes(id)) {
        state.allIds.unshift(id);
      }
    },

    setActiveConversation(
      state,
      action: PayloadAction<string | null>
    ) {
      state.activeId = action.payload;
    },

    setConversations(
      state,
      action: PayloadAction<Conversation[]>
    ) {
      state.byId = {};
      state.allIds = [];

      action.payload.forEach(conversation => {
        const id = conversation.convo._id;
        state.byId[id] = conversation;
        state.allIds.push(id);
      });
    },

    updateLastMessage(
      state,
      action: PayloadAction<{ conversationId: string; lastMessage: any }>
    ) {
      const { conversationId, lastMessage } = action.payload;
      if (!state.byId[conversationId]) return;

      state.byId[conversationId].convo.lastMessage = lastMessage;
      state.allIds = [
        conversationId,
        ...state.allIds.filter(id => id !== conversationId),
      ];
    },

    resetConversations() {
      return initialState;
    },
  },
});

export const {
  upsertConversation,
  setActiveConversation,
  updateLastMessage,
  setConversations,
  resetConversations,
} = conversationSlice.actions;

export default conversationSlice.reducer;