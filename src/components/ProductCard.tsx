"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Wifi, Smartphone, Globe, Plus, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { formatRub, formatStars, formatDuration, formatTraffic } from "@/lib/utils";
import { useTelegram } from "@/context/TelegramContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickBuy,
}) => {
  const { haptic } = useTelegram();
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact("medium");
    addToCart(product);
  };

  const handleCardClick = () => {
    haptic.impact("light");
    onSelect(product);
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact("heavy");
    onQuickBuy(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 p-4 transition-all duration-300 shadow-xl shadow-black/20"
    >
      {/* Decorative gradient glow */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

      {/* Header: Icon, Name & Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-950 to-zinc-800 border border-indigo-500/20 text-2xl shadow-inner">
            {product.image_url.startsWith("http") ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-8 h-8 object-cover rounded-lg"
              />
            ) : (
              <span>{product.image_url || "🛡️"}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100 group-hover:text-indigo-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-1">
              {product.description}
            </p>
          </div>
        </div>

        {product.badge && (
          <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            {product.badge}
          </span>
        )}
      </div>

      {/* Specifications grid */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-zinc-300">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Срок: <strong className="text-white">{formatDuration(product.duration_days)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Трафик: <strong className="text-white">{formatTraffic(product.traffic_gb)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Устройств: <strong className="text-white">{product.devices_limit}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Скорость: <strong className="text-white">{product.speed_mbps} Мб/с</strong></span>
        </div>
      </div>

      {/* Countries list preview */}
      {product.countries && product.countries.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3.5 overflow-hidden text-xs text-zinc-400">
          <span className="shrink-0 text-[11px] text-zinc-500 font-medium">Локации:</span>
          <div className="flex items-center gap-1 overflow-hidden truncate">
            {product.countries.slice(0, 4).map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 shrink-0">
                {c.split(" ")[0]}
              </span>
            ))}
            {product.countries.length > 4 && (
              <span className="text-[10px] text-zinc-400 font-medium">
                +{product.countries.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Price and CTA buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div>
          <div className="text-lg font-black text-white tracking-tight">
            {formatRub(product.price_rub)}
          </div>
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            {formatStars(product.price_stars)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleBuyClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Купить
          </button>
        </div>
      </div>
    </motion.div>
  );
};
