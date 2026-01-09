import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface otherUser {
  image: string,
  name: string,
  uniqueId: string
}

interface notify {
  createdAt: Date
}

export interface NotificationN {
  _id: string;
  // type: "friend" | "message";
  type: string;
  message: string;
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
} = notificationSlice.actions;

export default notificationSlice.reducer;