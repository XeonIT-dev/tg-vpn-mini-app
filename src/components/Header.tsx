"use client";

import React from "react";
import { Shield, Moon, Sun, ShoppingBag } from "lucide-react";
import { useTelegram } from "@/context/TelegramContext";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  storeName?: string;
}

export const Header: React.FC<HeaderProps> = ({ storeName = "SHIELD VPN" }) => {
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
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 px-4 py-3.5 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo and Name */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse pointer-events-none" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
              {storeName}
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground text-zinc-400">
              VLESS • Reality • Безлимит
            </p>
          </div>
        </div>

        {/* Action Buttons: Theme Toggle & Cart */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleThemeClick}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/60 text-zinc-300 border border-white/5 transition-all active:scale-95"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={handleCartClick}
            aria-label="Open Cart"
            className="relative p-2 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/60 text-zinc-300 border border-white/5 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full shadow-md animate-bounce">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
