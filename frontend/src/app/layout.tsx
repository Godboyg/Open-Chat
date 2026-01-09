"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import "./globals.css";
import { store } from "@/redux/store";
import ThemeProvider from "./Components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className=""
      >
        <ThemeProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
