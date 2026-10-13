"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, CheckCircle, Package, ShoppingCart, Settings as SettingsIcon, Send, AlertTriangle } from "lucide-react";
import { Product, Order, StoreSettings } from "@/types";
import { formatRub, formatStars, formatDuration } from "@/lib/utils";
import { useTelegram } from "@/context/TelegramContext";

const AVAILABLE_COUNTRIES = [
  "🇳🇱 Нидерланды",
  "🇩🇪 Германия",
  "🇫🇮 Финляндия",
  "🇸🇪 Швеция",
  "🇬🇧 Великобритания",
  "🇺🇸 США",
  "🇯🇵 Япония",
  "🇸🇬 Сингапур",
  "🇹🇷 Турция",
  "🇵🇱 Польша",
  "🇫🇷 Франция",
  "🇨🇭 Швейцария",
];

const PRESET_ICONS = ["🚀", "⚡", "👑", "🎮", "🛡️", "🔥", "💎", "🌐", "🔒"];

export const AdminPanel: React.FC = () => {
  const { initData, haptic } = useTelegram();
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "settings">("products");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [issueKeyInput, setIssueKeyInput] = useState("");
  const [issueInstructionsInput, setIssueInstructionsInput] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "SHIELD VPN",
    support_username: "@vpn_support_bot",
    auto_issue_enabled: false,
    default_client_instruction: "",
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Status message
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showAlert = (text: string, type: "success" | "error" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // 1. Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products?all=true", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      showAlert("Не удалось загрузить товары", "error");
    } finally {
      setLoadingProducts(false);
    }
  }, [initData]);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?status=${orderFilter}`, {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch {
      showAlert("Не удалось загрузить заказы", "error");
    } finally {
      setLoadingOrders(false);
    }
  }, [initData, orderFilter]);

  // 3. Fetch Settings
  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      showAlert("Не удалось загрузить настройки", "error");
    } finally {
      setLoadingSettings(false);
    }
  }, [initData]);

  useEffect(() => {
    if (activeTab === "products") fetchProducts();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "settings") fetchSettings();
  }, [activeTab, fetchProducts, fetchOrders, fetchSettings]);

  // Toggle Product active status
  const toggleProductActive = async (product: Product) => {
    haptic.impact("medium");
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          ...product,
          is_active: !product.is_active,
        }),
      });
      if (res.ok) {
        showAlert(product.is_active ? "Товар скрыт" : "Товар опубликован");
        fetchProducts();
      }
    } catch {
      showAlert("Ошибка при изменении статуса", "error");
    }
  };

  // Delete Product
  const deleteProduct = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот тариф?")) return;
    haptic.impact("heavy");
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        showAlert("Товар успешно удален");
        fetchProducts();
      }
    } catch {
      showAlert("Ошибка при удалении товара", "error");
    }
  };

  // Save Product (Create or Edit)
  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    haptic.impact("medium");
    const formData = new FormData(e.currentTarget);

    const isEdit = Boolean(editingProduct?.id);
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...(isEdit ? { id: editingProduct!.id } : {}),
      name: formData.get("name"),
      description: formData.get("description"),
      price_rub: Number(formData.get("price_rub")),
      price_stars: Number(formData.get("price_stars")),
      duration_days: Number(formData.get("duration_days")),
      traffic_gb: formData.get("traffic_gb") === "" ? null : Number(formData.get("traffic_gb")),
      devices_limit: Number(formData.get("devices_limit")),
      speed_mbps: Number(formData.get("speed_mbps")),
      countries: editingProduct?.countries || [],
      image_url: editingProduct?.image_url || "🚀",
      badge: formData.get("badge") || null,
      is_active: formData.get("is_active") === "on",
      sort_order: Number(formData.get("sort_order")),
    };

    try {
      const res = await fetch("/api/products", {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showAlert(isEdit ? "Тариф успешно обновлен" : "Тариф успешно создан");
        setIsProductModalOpen(false);
        setEditingProduct(null);
        fetchProducts();
      } else {
        const data = await res.json();
        showAlert(data.error || "Ошибка сохранения", "error");
      }
    } catch {
      showAlert("Ошибка соединения с сервером", "error");
    }
  };

  // Issue VPN Key and complete order
  const handleIssueKey = async (order: Order) => {
    if (!issueKeyInput.trim()) {
      showAlert("Введите VPN-ключ перед выдачей", "error");
      return;
    }

    setUpdatingOrderId(order.id);
    haptic.impact("heavy");

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          id: order.id,
          status: "completed",
          vpn_key: issueKeyInput.trim(),
          client_instructions: issueInstructionsInput.trim() || settings.default_client_instruction,
        }),
      });

      if (res.ok) {
        showAlert("Ключ выдан! Клиенту отправлено сообщение в Telegram.");
        setSelectedOrder(null);
        setIssueKeyInput("");
        setIssueInstructionsInput("");
        fetchOrders();
      } else {
        const err = await res.json();
        showAlert(err.error || "Ошибка при выдаче ключа", "error");
      }
    } catch {
      showAlert("Ошибка при отправке запроса", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Save Settings
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact("medium");
    setLoadingSettings(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
        showAlert("Настройки сохранены");
      }
    } catch {
      showAlert("Ошибка сохранения настроек", "error");
    } finally {
      setLoadingSettings(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Toast Alert */}
      {alertMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            alertMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {alertMsg.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Admin Sub-Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/10">
        <button
          onClick={() => {
            haptic.selection();
            setActiveTab("products");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "products"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Товары</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setActiveTab("orders");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Заказы</span>
        </button>

        <button
          onClick={() => {
            haptic.selection();
            setActiveTab("settings");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "settings"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Настройки</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === "products" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Каталог тарифов</h3>
              <p className="text-xs text-zinc-400">
                Всего тарифов в базе: {products.length}
              </p>
            </div>
            <button
              onClick={() => {
                haptic.impact("medium");
                setEditingProduct({
                  id: "",
                  name: "",
                  description: "",
                  price_rub: 199,
                  price_stars: 99,
                  duration_days: 30,
                  traffic_gb: null,
                  devices_limit: 3,
                  speed_mbps: 1000,
                  countries: ["🇳🇱 Нидерланды", "🇩🇪 Германия"],
                  image_url: "🚀",
                  badge: "",
                  is_active: true,
                  sort_order: products.length + 1,
                });
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Создать тариф</span>
            </button>
          </div>

          {loadingProducts ? (
            <div className="p-8 text-center text-xs text-zinc-500">Загрузка тарифов...</div>
          ) : (
            <div className="space-y-2.5">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border transition-all ${
                    product.is_active ? "border-white/10" : "border-red-500/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.image_url || "🛡️"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{product.name}</h4>
                        {!product.is_active && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                            Скрыт
                          </span>
                        )}
                        {product.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {formatRub(product.price_rub)} / {formatStars(product.price_stars)} • {formatDuration(product.duration_days)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleProductActive(product)}
                      title={product.is_active ? "Скрыть" : "Показать"}
                      className={`p-2 rounded-xl border transition-all ${
                        product.is_active
                          ? "bg-zinc-800 text-zinc-300 border-white/5 hover:text-white"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                    >
                      {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        haptic.selection();
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-300 border border-white/5 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 border border-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ORDERS MANAGEMENT & KEY ISSUANCE */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Управление заказами</h3>
            <div className="flex items-center gap-1 text-[11px] bg-zinc-900 p-1 rounded-xl border border-white/10">
              {["all", "paid", "pending", "completed"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    haptic.selection();
                    setOrderFilter(st);
                  }}
                  className={`px-2.5 py-1 rounded-lg capitalize ${
                    orderFilter === st
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {st === "all" ? "Все" : st === "paid" ? "Оплачены" : st === "pending" ? "Ждут" : "Готовы"}
                </button>
              ))}
            </div>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-zinc-500">Загрузка заказов...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-2xl">
              Заказов с таким фильтром не найдено
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        #{order.id.slice(0, 8)} • @{order.telegram_username || "anonymous"}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        ID: <code>{order.user_id}</code> {order.email && `• ${order.email}`}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : order.status === "paid"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 text-xs space-y-1">
                    {order.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-zinc-300">
                        <span>{it.name} x{it.quantity}</span>
                        <span className="font-bold text-white">
                          {order.payment_method === "telegram_stars" ? `${it.price_stars * it.quantity} ⭐` : `${it.price_rub * it.quantity} ₽`}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-white/5 flex justify-between font-bold text-white">
                      <span>Итого:</span>
                      <span>{order.total_price} ₽ / {order.total_stars} ⭐</span>
                    </div>
                  </div>

                  {/* Actions & Key Delivery */}
                  {selectedOrder?.id === order.id ? (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-indigo-500/30 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-indigo-400 mb-1">
                          VPN Ключ (vless://... или ss://...):
                        </label>
                        <input
                          type="text"
                          placeholder="vless://uuid@domain:443?security=reality..."
                          value={issueKeyInput}
                          onChange={(e) => setIssueKeyInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Инструкция для клиента:
                        </label>
                        <textarea
                          rows={2}
                          value={issueInstructionsInput}
                          placeholder={settings.default_client_instruction}
                          onChange={(e) => setIssueInstructionsInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleIssueKey(order)}
                          disabled={updatingOrderId === order.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Выдать ключ и завершить</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="py-2 px-3 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-white"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      {order.vpn_key ? (
                        <div className="text-xs font-mono text-zinc-400 truncate max-w-[200px]">
                          Ключ: {order.vpn_key}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">Ключ еще не выдан</span>
                      )}

                      <button
                        onClick={() => {
                          haptic.selection();
                          setSelectedOrder(order);
                          setIssueKeyInput(order.vpn_key || "");
                          setIssueInstructionsInput(order.client_instructions || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-bold border border-indigo-500/30 active:scale-95 transition-all"
                      >
                        {order.vpn_key ? "Изменить ключ" : "Выдать ключ"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STORE SETTINGS */}
      {/* ======================================================== */}
      {activeTab === "settings" && (
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">Общие настройки</h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Название магазина
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Юзернейм поддержки (Telegram)
              </label>
              <input
                type="text"
                value={settings.support_username}
                onChange={(e) => setSettings({ ...settings, support_username: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Инструкция по умолчанию при выдаче ключа
              </label>
              <textarea
                rows={4}
                value={settings.default_client_instruction}
                onChange={(e) =>
                  setSettings({ ...settings, default_client_instruction: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5">
              <div>
                <div className="text-xs font-bold text-white">Автоматическая выдача</div>
                <div className="text-[11px] text-zinc-400">
                  Выдавать ключи сразу после оплаты через бота
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_issue_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, auto_issue_enabled: e.target.checked })
                }
                className="w-5 h-5 rounded accent-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loadingSettings}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{settingsSaved ? "Сохранено!" : "Сохранить настройки"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL */}
      {/* ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 p-5 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold mb-4">
              {editingProduct.id ? "Редактировать тариф" : "Создать новый тариф"}
            </h3>

            <form onSubmit={saveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Название
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingProduct.name}
                  placeholder="Оптимальный 3 мес"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  required
                  rows={2}
                  defaultValue={editingProduct.description}
                  placeholder="Идеально для 4K стриминга и игр..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Цена в рублях (₽)
                  </label>
                  <input
                    name="price_rub"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editingProduct.price_rub}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Цена в Stars (⭐)
                  </label>
                  <input
                    name="price_stars"
                    type="number"
                    required
                    defaultValue={editingProduct.price_stars}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Срок (дней)
                  </label>
                  <input
                    name="duration_days"
                    type="number"
                    required
                    defaultValue={editingProduct.duration_days}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Трафик ГБ (пусто = безлимит)
                  </label>
                  <input
                    name="traffic_gb"
                    type="number"
                    defaultValue={editingProduct.traffic_gb ?? ""}
                    placeholder="Безлимит"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Устройств
                  </label>
                  <input
                    name="devices_limit"
                    type="number"
                    required
                    defaultValue={editingProduct.devices_limit}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Скорость (Мбит/с)
                  </label>
                  <input
                    name="speed_mbps"
                    type="number"
                    required
                    defaultValue={editingProduct.speed_mbps}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              {/* Icon presets */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Иконка тарифа
                </label>
                <div className="flex gap-2 mb-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, image_url: icon })}
                      className={`p-2 rounded-xl text-xl border transition-all ${
                        editingProduct.image_url === icon
                          ? "bg-indigo-600/30 border-indigo-500 scale-110"
                          : "bg-zinc-950 border-white/10"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Countries multi-select */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Доступные страны
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-zinc-950 border border-white/10">
                  {AVAILABLE_COUNTRIES.map((country) => {
                    const isSelected = editingProduct.countries?.includes(country);
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          const cur = editingProduct.countries || [];
                          const updated = isSelected
                            ? cur.filter((c) => c !== country)
                            : [...cur, country];
                          setEditingProduct({ ...editingProduct, countries: updated });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                            : "bg-zinc-900 text-zinc-400 border-white/5"
                        }`}
                      >
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Бейдж (Хит, Выгодно)
                  </label>
                  <input
                    name="badge"
                    defaultValue={editingProduct.badge || ""}
                    placeholder="Хит продаж"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Порядок сортировки
                  </label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={editingProduct.sort_order}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  defaultChecked={editingProduct.is_active}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-zinc-300">
                  Показывать тариф в витрине каталога
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:text-white"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
