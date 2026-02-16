import "./globals.css";
import ThemeProvider from "./Components/ThemeProvider";
import Script from "next/script";

export const metadata = {
  other: {
    "google-adsense-account": "ca-pub-2915175777820694",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2915175777820694"
          crossOrigin="anonymous"
        />

        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
