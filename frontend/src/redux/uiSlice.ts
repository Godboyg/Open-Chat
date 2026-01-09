import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  activeModal: string | null;
  isCalling: boolean;
}

const initialState: UIState = {
  activeModal: null,
  isCalling: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },

    closeModal(state) {
      state.activeModal = null;
    },

    setCalling(state, action: PayloadAction<boolean>) {
      state.isCalling = action.payload;
    },

    resetUI() {
      return initialState;
    },
  },
});

export const { openModal, closeModal, setCalling, resetUI } =
  uiSlice.actions;

export default uiSlice.reducer;