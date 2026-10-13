"use client";

import React from "react";
import { Store, Key, ShieldCheck } from "lucide-react";
import { useTelegram } from "@/context/TelegramContext";

export type NavTab = "store" | "orders" | "admin";

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdmin: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  isAdmin,
}) => {
  const { haptic } = useTelegram();

  const handleSelect = (tab: NavTab) => {
    haptic.selection();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-safe">
      <div className="max-w-xs mx-auto px-4 pb-3">
        <div className="pointer-events-auto flex items-center justify-around p-1 rounded-full bg-zinc-950/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/80">
          <button
            onClick={() => handleSelect("store")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs transition-all ${
              currentTab === "store"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Каталог</span>
          </button>

          <button
            onClick={() => handleSelect("orders")}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs transition-all ${
              currentTab === "orders"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Ключи</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleSelect("admin")}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full text-xs transition-all ${
                currentTab === "admin"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Админ</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
