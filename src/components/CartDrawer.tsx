"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
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
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
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
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          className="relative z-10 w-full max-w-md h-full flex flex-col bg-zinc-950 border-l border-white/10 text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold">Корзина</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold">
                {items.length}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-3xl mb-3 text-zinc-500">
                  🛒
                </div>
                <h3 className="text-base font-bold text-zinc-300">Корзина пуста</h3>
                <p className="text-xs text-zinc-500 max-w-[200px] mt-1">
                  Выберите подходящий VPN тариф в каталоге
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  Перейти в каталог
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-white/5"
                >
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-800 text-xl shrink-0">
                    {product.image_url.startsWith("http") ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-7 h-7 object-cover rounded-md"
                      />
                    ) : (
                      <span>{product.image_url || "🛡️"}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-zinc-300">
                        {formatRub(product.price_rub)}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-400">
                        {formatStars(product.price_stars)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-zinc-800 p-1 rounded-xl border border-white/5 shrink-0">
                    <button
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(product.id, quantity - 1);
                      }}
                      className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        haptic.selection();
                        updateQuantity(product.id, quantity + 1);
                      }}
                      className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      haptic.impact("light");
                      removeFromCart(product.id);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 shrink-0 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-400">Итого в рублях:</span>
                <span className="text-lg font-black text-white">{formatRub(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400">Итого в Stars:</span>
                <span className="text-sm font-bold text-amber-400">{formatStars(totalStars)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-98 transition-all"
              >
                <span>Оформить заказ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
