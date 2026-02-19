import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { notStrictEqual } from "assert";

interface otherUser {
  image: string,
  name: string,
  uniqueId: string
}

interface notify {
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationN {
  _id: string;
  // type: "friend" | "message";
  to: string,
  type: string;
  message: string;
  createdAt?: string;
  read: boolean;
  otherUser?: otherUser;
  notify?: notify;
}

interface NotificationState {
  items: NotificationN[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<NotificationN[]>) {
      state.items = action.payload as NotificationN[];
      // if (!action.payload.read) state.unreadCount++;
    },

    removeNotification: (state, action: PayloadAction<{ to: string , message: string }>) => {
      const { to, message } = action.payload;

      state.items = state.items.filter(notification => !(
           notification.to === to &&
           notification.message === message
        )
      )
     },

    markAllRead(state , action: PayloadAction<string>) {
      state.items.forEach(n => 
        n._id === action.payload && n.read === true
      );
    },

    resetNotifications() {
      return initialState;
    },
  },
});

export const {
  addNotification,
  markAllRead,
  resetNotifications,
  removeNotification
} = notificationSlice.actions;

export default notificationSlice.reducer;