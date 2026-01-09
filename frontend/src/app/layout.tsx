"use client"
import { SessionProvider } from "next-auth/react";
import "./globals.css";
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
