"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTelegram } from "@/context/TelegramContext";
import { formatRub, formatStars } from "@/lib/utils";

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalStars,
    setIsCheckoutOpen,
  } = useCart();
  const { haptic } = useTelegram();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    haptic.impact("medium");
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleClose = () => {
    haptic.selection();
    setIsCartOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-10 w-full max-w-md h-full flex flex-col bg-zinc-950 border-l border-white/[0.08] text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Корзина</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono">
                {items.length}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <span className="text-sm font-medium text-zinc-400">Корзина пуста</span>
                <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
                  Выберите подходящий VPN тариф в каталоге
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold active:scale-95 transition-all"
                >
                  В каталог
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span>{formatRub(product.price_rub)}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatStars(product.price_stars)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded-lg border border-white/[0.06]">
                    <button
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(product.id, quantity - 1);
                      }}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center text-xs font-bold text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(product.id, quantity + 1);
                      }}
                      className="p-1 text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      haptic.impact("light");
                      removeFromCart(product.id);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t border-white/[0.06] bg-zinc-950">
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-zinc-500">Сумма:</span>
                <span className="font-bold text-white">{formatRub(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between mb-4 text-xs">
                <span className="text-zinc-500">В Stars:</span>
                <span className="font-mono text-zinc-400">{formatStars(totalStars)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs active:scale-98 transition-all"
              >
                <span>Оформить заказ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
