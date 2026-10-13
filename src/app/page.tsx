"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Sparkles, Shield, Wifi, Zap, X } from "lucide-react";
import { Product } from "@/types";
import { useTelegram } from "@/context/TelegramContext";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Navigation, NavTab } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { OrdersView } from "@/components/OrdersView";
import { AdminPanel } from "@/components/AdminPanel";

export default function Home() {
  const { initData, isAdmin, isReady } = useTelegram();
  const { addToCart, setIsCheckoutOpen, isCheckoutOpen } = useCart();

  const [activeTab, setActiveTab] = useState<NavTab>("store");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState<number | "all" | "unlimited">("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  // Selected product for detailed modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch active products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract all unique countries from products
  const allCountries = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.countries || []).forEach((c) => set.add(c));
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCountry = (p.countries || []).some((c) => c.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCountry) return false;
      }

      // 2. Duration / Unlimited Filter
      if (durationFilter === "unlimited") {
        if (p.traffic_gb !== null && p.traffic_gb !== 0) return false;
      } else if (durationFilter !== "all") {
        if (p.duration_days !== durationFilter) return false;
      }

      // 3. Country Filter
      if (selectedCountry !== "all") {
        if (!p.countries || !p.countries.includes(selectedCountry)) return false;
      }

      return true;
    });
  }, [products, searchQuery, durationFilter, selectedCountry]);

  // Quick buy action
  const handleQuickBuy = (product: Product) => {
    addToCart(product);
    setIsCheckoutOpen(true);
  };

  // Checkout completed callback
  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setActiveTab("orders");
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 animate-pulse flex items-center justify-center text-white font-bold">
            🛡️
          </div>
          <span className="text-xs font-semibold text-zinc-400">Загрузка SHIELD VPN...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24">
        {/* ======================================================== */}
        {/* TAB 1: CATALOG STORE */}
        {/* ======================================================== */}
        {activeTab === "store" && (
          <div className="space-y-4">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-500/30 p-5 shadow-2xl shadow-indigo-950/50">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="w-3 h-3" />
                    Next-Gen VPN 2026
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Telegram Stars ⭐
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                  Свободный интернет без блокировок и замедлений
                </h2>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                  Протокол VLESS Reality маскирует трафик под HTTPS. Мгновенная выдача ключа сразу после оплаты.
                </p>

                {/* Micro feature pills */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10 text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    No-Logs
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    До 10 Гбит/с
                  </span>
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    YouTube 4K
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или стране..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setDurationFilter("all")}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  durationFilter === "all"
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setDurationFilter(30)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  durationFilter === 30
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                1 месяц
              </button>
              <button
                onClick={() => setDurationFilter(90)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  durationFilter === 90
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                3 месяца
              </button>
              <button
                onClick={() => setDurationFilter(365)}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  durationFilter === 365
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                1 год
              </button>
              <button
                onClick={() => setDurationFilter("unlimited")}
                className={`shrink-0 px-3 py-1.5 rounded-xl font-medium transition-all ${
                  durationFilter === "unlimited"
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                Безлимит ⚡
              </button>
            </div>

            {/* Country Selector Dropdown if available */}
            {allCountries.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-zinc-400">
                <span className="shrink-0 text-[11px] text-zinc-500 font-semibold">Страны:</span>
                <button
                  onClick={() => setSelectedCountry("all")}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                    selectedCountry === "all"
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Все локации
                </button>
                {allCountries.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className={`shrink-0 px-2 py-1 rounded-lg text-[11px] transition-all ${
                      selectedCountry === c
                        ? "bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30"
                        : "bg-zinc-900/60 text-zinc-400 border border-white/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Product Cards List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="text-sm font-bold text-white">Тарифы не найдены</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Попробуйте сбросить фильтры поиска
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDurationFilter("all");
                    setSelectedCountry("all");
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={(p) => setSelectedProduct(p)}
                    onQuickBuy={handleQuickBuy}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MY ORDERS & KEYS */}
        {/* ======================================================== */}
        {activeTab === "orders" && (
          <OrdersView onGoToStore={() => setActiveTab("store")} />
        )}

        {/* ======================================================== */}
        {/* TAB 3: ADMIN PANEL (PROTECTED) */}
        {/* ======================================================== */}
        {activeTab === "admin" && isAdmin && <AdminPanel />}
      </main>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleQuickBuy}
      />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onSuccess={handleCheckoutSuccess}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      {/* Bottom Floating Navigation */}
      <Navigation
        currentTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}
