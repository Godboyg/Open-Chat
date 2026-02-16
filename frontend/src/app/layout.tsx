"use client"
import "./globals.css";
import ThemeProvider from "./Components/ThemeProvider";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-2915175777820694" />
      </head>
      <body
        className=""
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
