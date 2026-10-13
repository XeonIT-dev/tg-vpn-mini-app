"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
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

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.countries || []).forEach((c) => set.add(c));
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCountry = (p.countries || []).some((c) => c.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCountry) return false;
      }

      if (durationFilter === "unlimited") {
        if (p.traffic_gb !== null && p.traffic_gb !== 0) return false;
      } else if (durationFilter !== "all") {
        if (p.duration_days !== durationFilter) return false;
      }

      if (selectedCountry !== "all") {
        if (!p.countries || !p.countries.includes(selectedCountry)) return false;
      }

      return true;
    });
  }, [products, searchQuery, durationFilter, selectedCountry]);

  const handleQuickBuy = (product: Product) => {
    addToCart(product);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setActiveTab("orders");
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-white selection:text-black">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-24">
        {/* TAB 1: CATALOG STORE */}
        {activeTab === "store" && (
          <div className="space-y-4">
            {/* Minimalist Headline */}
            <div className="pt-1 pb-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Тарифы VPN
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Протокол VLESS Reality. Мгновенная выдача ключа.
              </p>
            </div>

            {/* Minimalist Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или локации..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
              <button
                onClick={() => setDurationFilter("all")}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  durationFilter === "all"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-white/[0.06]"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setDurationFilter(30)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  durationFilter === 30
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-white/[0.06]"
                }`}
              >
                1 мес
              </button>
              <button
                onClick={() => setDurationFilter(90)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  durationFilter === 90
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-white/[0.06]"
                }`}
              >
                3 мес
              </button>
              <button
                onClick={() => setDurationFilter(365)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  durationFilter === 365
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-white/[0.06]"
                }`}
              >
                1 год
              </button>
              <button
                onClick={() => setDurationFilter("unlimited")}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  durationFilter === "unlimited"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white bg-zinc-950 border border-white/[0.06]"
                }`}
              >
                Безлимит
              </button>
            </div>

            {/* Country Selector */}
            {allCountries.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-zinc-500">
                <button
                  onClick={() => setSelectedCountry("all")}
                  className={`shrink-0 px-2 py-1 rounded-md text-[11px] transition-all ${
                    selectedCountry === "all"
                      ? "text-white font-medium bg-zinc-900 border border-white/[0.08]"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  Все страны
                </button>
                {allCountries.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className={`shrink-0 px-2 py-1 rounded-md text-[11px] transition-all ${
                      selectedCountry === c
                        ? "text-white font-medium bg-zinc-900 border border-white/[0.08]"
                        : "text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Products List */}
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-2xl bg-zinc-950 border border-white/[0.04] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-white/[0.06]">
                <h3 className="text-xs font-semibold text-zinc-300">Тарифы не найдены</h3>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Попробуйте изменить параметры фильтра
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDurationFilter("all");
                    setSelectedCountry("all");
                  }}
                  className="mt-3 px-3 py-1 rounded-lg bg-zinc-900 text-xs text-zinc-300 border border-white/[0.08]"
                >
                  Сбросить
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
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

        {/* TAB 2: MY ORDERS & KEYS */}
        {activeTab === "orders" && (
          <OrdersView onGoToStore={() => setActiveTab("store")} />
        )}

        {/* TAB 3: ADMIN PANEL (PROTECTED) */}
        {activeTab === "admin" && isAdmin && <AdminPanel />}
      </main>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyNow={handleQuickBuy}
      />

      <CartDrawer />

      {isCheckoutOpen && (
        <CheckoutModal
          onSuccess={handleCheckoutSuccess}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      <Navigation
        currentTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
      />
    </div>
  );
}
