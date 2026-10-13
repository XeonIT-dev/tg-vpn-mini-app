"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Product } from "@/types";
import { formatRub, formatStars, formatDuration, formatTraffic } from "@/lib/utils";
import { useTelegram } from "@/context/TelegramContext";
import { useCart } from "@/context/CartContext";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onBuyNow,
}) => {
  const { haptic } = useTelegram();
  const { addToCart } = useCart();

  if (!product) return null;

  const handleAdd = () => {
    haptic.impact("medium");
    addToCart(product);
    onClose();
  };

  const handleBuy = () => {
    haptic.impact("heavy");
    onBuyNow(product);
  };

  const features = [
    "Протокол VLESS + Reality (полный обход блокировок)",
    "Маскировка под легитимный HTTPS веб-трафик",
    "Поддержка YouTube 4K, Netflix, Discord и игр с низким пингом",
    "No-Logs: абсолютная анонимность без сохранения истории",
    "Клиенты для iOS (Happ, Streisand), Android (v2rayNG), Windows и Mac",
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/[0.08] p-5 shadow-2xl text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">{product.name}</h2>
                {product.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-white/[0.08]">
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Срок: {formatDuration(product.duration_days)} • {formatTraffic(product.traffic_gb)}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06] active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            {product.description}
          </p>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-500 block mb-0.5">Лимит устройств</span>
              <span className="text-xs font-semibold text-white">До {product.devices_limit} одновременно</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-500 block mb-0.5">Скорость канала</span>
              <span className="text-xs font-semibold text-white">До {product.speed_mbps} Мбит/с</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-500 block mb-0.5">Протокол</span>
              <span className="text-xs font-semibold text-white">VLESS Reality</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
              <span className="text-[11px] text-zinc-500 block mb-0.5">Трафик</span>
              <span className="text-xs font-semibold text-white">{formatTraffic(product.traffic_gb)}</span>
            </div>
          </div>

          {/* Countries */}
          {product.countries && product.countries.length > 0 && (
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Доступные страны ({product.countries.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.countries.map((country, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-xs text-zinc-300"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="mb-5 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Особенности
            </span>
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-white">
                {formatRub(product.price_rub)}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                {formatStars(product.price_stars)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-white/[0.08] active:scale-95 transition-all"
              >
                В корзину
              </button>
              <button
                onClick={handleBuy}
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold active:scale-95 transition-all"
              >
                Купить сейчас
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
