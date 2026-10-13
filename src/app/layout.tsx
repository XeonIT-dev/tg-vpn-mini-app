import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/context/TelegramContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "SHIELD VPN | Telegram Mini App",
  description: "Высокоскоростной VPN с защитой от блокировок на базе VLESS Reality и Telegram Stars",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-indigo-500 selection:text-white">
        <TelegramProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
