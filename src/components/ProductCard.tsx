"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleCardClick}
      className="group relative cursor-pointer rounded-2xl bg-zinc-950 border border-white/[0.08] hover:border-white/20 p-4 transition-all duration-200"
    >
      {/* Top Row: Name & Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        {product.badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-white/[0.08]">
            {product.badge}
          </span>
        )}
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-zinc-400 line-clamp-1 mb-3">
        {product.description}
      </p>

      {/* Minimalist Specs Line */}
      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3.5 py-2 px-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.04]">
        <span>{formatDuration(product.duration_days)}</span>
        <span className="text-zinc-600">•</span>
        <span>{formatTraffic(product.traffic_gb)}</span>
        <span className="text-zinc-600">•</span>
        <span>До {product.devices_limit} устр.</span>
        <span className="text-zinc-600">•</span>
        <span>{product.speed_mbps} Мб/с</span>
      </div>

      {/* Countries preview */}
      {product.countries && product.countries.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3.5 overflow-hidden text-xs text-zinc-500">
          <div className="flex items-center gap-1 overflow-hidden truncate">
            {product.countries.slice(0, 4).map((c, i) => (
              <span key={i} className="text-xs text-zinc-300">
                {c.split(" ")[0]}
              </span>
            ))}
            {product.countries.length > 4 && (
              <span className="text-[11px] text-zinc-500 font-mono">
                +{product.countries.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Price & Clean Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div>
          <span className="text-base font-bold text-white tracking-tight">
            {formatRub(product.price_rub)}
          </span>
          <span className="text-xs text-zinc-500 ml-2 font-mono">
            {formatStars(product.price_stars)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleBuyClick}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold active:scale-95 transition-all"
          >
            Купить
          </button>
        </div>
      </div>
    </motion.div>
  );
};
