'use client';
import { Provider } from 'react-redux';
import { persistor, store } from '@/redux/store';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider } from "next-auth/react";

const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);
  return <>{children}</>;
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
       <ThemeWrapper>{children}</ThemeWrapper>
      </PersistGate>
    </Provider>
    </SessionProvider>
  );
}