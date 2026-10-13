"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Shield, Zap, Globe, Smartphone, Lock, Wifi } from "lucide-react";
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
    "Выделенные порты и маскировка под безопасный HTTPS веб-трафик",
    "Поддержка стриминга 4K (YouTube, Netflix) и игр с низким пингом",
    "Строгая No-Logs политика — мы не храним историю активности",
    "Работает на iOS, Android, Windows, macOS, Linux и роутерах",
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
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
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 p-6 shadow-2xl text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-950 to-zinc-800 border border-indigo-500/30 text-3xl shadow-inner">
                {product.image_url.startsWith("http") ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-xl"
                  />
                ) : (
                  <span>{product.image_url || "🛡️"}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">{product.name}</h2>
                  {product.badge && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {product.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Срок действия: {formatDuration(product.duration_days)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 active:scale-90 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 text-sm text-zinc-300 leading-relaxed mb-4">
            {product.description}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>Трафик</span>
              </div>
              <div className="text-sm font-bold text-white">
                {formatTraffic(product.traffic_gb)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Устройства</span>
              </div>
              <div className="text-sm font-bold text-white">
                До {product.devices_limit} одновременно
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Скорость</span>
              </div>
              <div className="text-sm font-bold text-white">
                До {product.speed_mbps} Мбит/с
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Протокол</span>
              </div>
              <div className="text-sm font-bold text-white">
                VLESS Reality
              </div>
            </div>
          </div>

          {/* Countries */}
          {product.countries && product.countries.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Доступные локации ({product.countries.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.countries.map((country, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-white/5 text-xs text-zinc-200"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Features list */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" />
              Преимущества тарифа
            </h4>
            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-xl font-black text-white">
                {formatRub(product.price_rub)}
              </div>
              <div className="text-xs font-bold text-amber-400">
                {formatStars(product.price_stars)}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleAdd}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 active:scale-95 transition-all"
              >
                В корзину
              </button>
              <button
                onClick={handleBuy}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
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
