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
      <div className="max-w-md mx-auto px-4 pb-4">
        <div className="pointer-events-auto flex items-center justify-around p-1.5 rounded-2xl bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50">
          {/* Store Tab */}
          <button
            onClick={() => handleSelect("store")}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
              currentTab === "store"
                ? "bg-indigo-600/20 text-indigo-400 font-semibold shadow-inner"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Store className="w-5 h-5 mb-1" />
            <span className="text-[11px] tracking-wide">Каталог</span>
          </button>

          {/* Orders Tab */}
          <button
            onClick={() => handleSelect("orders")}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
              currentTab === "orders"
                ? "bg-indigo-600/20 text-indigo-400 font-semibold shadow-inner"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Key className="w-5 h-5 mb-1" />
            <span className="text-[11px] tracking-wide">Мои ключи</span>
          </button>

          {/* Admin Tab (Protected) */}
          {isAdmin && (
            <button
              onClick={() => handleSelect("admin")}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${
                currentTab === "admin"
                  ? "bg-purple-600/20 text-purple-400 font-semibold shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-1" />
              <span className="text-[11px] tracking-wide">Админка</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
