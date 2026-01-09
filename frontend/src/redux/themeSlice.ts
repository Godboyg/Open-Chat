import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  onlineCount: number;
  users: (String | WebSocket)[]
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialState: ThemeState = {
  mode: (localStorage.getItem('theme') as ThemeMode) || (prefersDark ? 'dark' : 'light'),
  // mode: (localStorage.getItem('theme') as ThemeMode) || (prefersDark ? 'dark' : 'light'),
  onlineCount: 0,
  users: []
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
    },
    setOnlineCount: (state, action: PayloadAction<number>) => {
      state.onlineCount = action.payload;
    },
    setUserOnline: (state , action: PayloadAction<WebSocket[]>) => {
      state.users = action.payload;
    }
  },
});

export const { toggleTheme, setTheme , setOnlineCount , setUserOnline } = themeSlice.actions;
export default themeSlice.reducer;