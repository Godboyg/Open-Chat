import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  onlineCount: number;
  users: (string | WebSocket)[];
}

const initialState: ThemeState = {
  mode: 'light', // safe default
  onlineCount: 0,
  users: []
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';

      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.mode);
      }
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.mode);
      }
    },
    setOnlineCount: (state, action: PayloadAction<number>) => {
      state.onlineCount = action.payload;
    },
    setUserOnline: (state, action: PayloadAction<WebSocket[]>) => {
      state.users = action.payload;
    }
  },
});

export const { toggleTheme, setTheme, setOnlineCount, setUserOnline } = themeSlice.actions;
export default themeSlice.reducer;