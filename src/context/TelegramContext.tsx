"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { TelegramUser } from "@/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: "light" | "dark";
        initData: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: number;
          hash?: string;
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        openInvoice?: (url: string, callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
      };
    };
  }
}

interface TelegramContextValue {
  user: TelegramUser | null;
  initData: string;
  isAdmin: boolean;
  theme: "dark" | "light";
  toggleTheme: () => void;
  haptic: {
    impact: (style?: "light" | "medium" | "heavy") => void;
    notification: (type: "error" | "success" | "warning") => void;
    selection: () => void;
  };
  openInvoice: (invoiceUrl: string, callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // 1. Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const tgInitData = tg.initData || "";
      const tgUser = tg.initDataUnsafe?.user || null;

      startTransition(() => {
        setInitData(tgInitData);
        setUser(tgUser);

        // Sync theme with Telegram color scheme
        if (tg.colorScheme === "light") {
          setTheme("light");
          document.documentElement.classList.remove("dark");
        } else {
          setTheme("dark");
          document.documentElement.classList.add("dark");
        }
      });

      // Check admin status against API
      if (tgInitData) {
        fetch("/api/products?all=true", {
          headers: { "x-telegram-init-data": tgInitData },
        })
          .then((res) => {
            // If admin, this returns both active & inactive products
            if (res.ok) {
              // Now verify through settings check
              fetch("/api/settings", {
                headers: { "x-telegram-init-data": tgInitData },
              }).then((sRes) => {
                // If can modify or user ID matches env admin
                const adminIds = (process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_IDS || "").split(",");
                if (tgUser && adminIds.includes(String(tgUser.id))) {
                  setIsAdmin(true);
                }
              });
            }
          })
          .catch(() => {});
      }
    } else {
      // Standalone browser development mode
      const mockUser: TelegramUser = {
        id: 777000,
        first_name: "Developer",
        username: "admin_dev",
      };
      setUser(mockUser);
      setIsAdmin(true);
      document.documentElement.classList.add("dark");
    }

    setIsReady(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const haptic = {
    impact: (style: "light" | "medium" | "heavy" = "light") => {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
      } catch {}
    },
    notification: (type: "error" | "success" | "warning") => {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
      } catch {}
    },
    selection: () => {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      } catch {}
    },
  };

  const openInvoice = (
    invoiceUrl: string,
    callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void
  ) => {
    if (window.Telegram?.WebApp?.openInvoice) {
      window.Telegram.WebApp.openInvoice(invoiceUrl, (status) => {
        if (callback) callback(status);
      });
    } else {
      window.open(invoiceUrl, "_blank");
      if (callback) callback("pending");
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        initData,
        isAdmin,
        theme,
        toggleTheme,
        haptic,
        openInvoice,
        isReady,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}
