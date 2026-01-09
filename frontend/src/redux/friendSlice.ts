import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type FriendStatus = "pending" | "accepted";

export interface Friend {
  _id: string; 
  to?: string;             
  name?: string;
  status?: FriendStatus;
  image?: string;
  conversationId?: string | null;
}

interface FriendState {
  requests: Friend[];
  friends: Friend[];
}

const initialState: FriendState = {
  requests: [],
  friends: [],
};

const friendSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    addFriendRequest(state, action: PayloadAction<Friend>) {
      if (!state.requests.find(r => 
        (r._id === action.payload._id && r.to === action.payload.to) ||
        (r.to === action.payload._id && r._id === action.payload.to)
      )) {
        state.requests.push(action.payload);
      }
    },

    removeFriendRequest(state, action: PayloadAction<{ to: string , from: string }>) {
      state.requests = state.requests.filter(req => 
        !(
             (req._id === action.payload.from && req.to === action.payload.to) ||
             (req._id === action.payload.to && req.to === action.payload.from)
          ) 
      )
    },

    removeFriend(state , action: PayloadAction<{_id : string}>) {
      state.friends = state.friends.filter(fnd => fnd._id !== action.payload._id)
      // addFriendRequest()
    } ,

    addFriend(state, action: PayloadAction<Friend>) {
      state.requests = state.requests.filter(
        r => r._id !== action.payload._id
      );

      const index = state.friends.findIndex(
        f => f._id === action.payload._id
      );

      if (index !== -1) {
        state.friends[index] = action.payload;
      } else {
        state.friends.unshift(action.payload);
      }
    },

    resetFriends() {
      return initialState;
    },
  },
});

export const {
  addFriendRequest,
  removeFriendRequest,
  addFriend,
  resetFriends,
  removeFriend
} = friendSlice.actions;

export default friendSlice.reducer;