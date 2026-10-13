"use client";

import React from "react";
import { Moon, Sun, ShoppingBag } from "lucide-react";
import { useTelegram } from "@/context/TelegramContext";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  storeName?: string;
}

export const Header: React.FC<HeaderProps> = ({ storeName = "SHIELD" }) => {
  const { theme, toggleTheme, haptic } = useTelegram();
  const { totalCount, setIsCartOpen } = useCart();

  const handleCartClick = () => {
    haptic.selection();
    setIsCartOpen(true);
  };

  const handleThemeClick = () => {
    haptic.impact("light");
    toggleTheme();
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-background/80 border-b border-white/[0.06] dark:border-white/[0.06] px-4 py-3 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Minimalist Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold tracking-wider uppercase text-foreground">
            {storeName}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-normal">
            vless
          </span>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleThemeClick}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl text-zinc-400 hover:text-foreground active:scale-90 transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCartClick}
            aria-label="Open Cart"
            className="relative p-2 rounded-xl text-zinc-400 hover:text-foreground active:scale-90 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[15px] h-[15px] px-1 text-[9px] font-bold text-black bg-white rounded-full">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
