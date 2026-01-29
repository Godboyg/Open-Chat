// src/redux/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import friendReducer from "./friendSlice";
import conversationReducer from "./conversationSlice";
import messageReducer from "./messageSlice";
import notificationReducer from "./notificationSlice"
import {
  persistStore,
  persistReducer,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  version: 1,
  whitelist: ["theme", "friends", "conversations"], 
};

const rootReducer = {
  theme: themeReducer,
  friends: friendReducer,
  conversations: conversationReducer,
  messages: messageReducer,
  notifications: notificationReducer
};

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers(rootReducer)
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;