"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Key, Copy, Check, ExternalLink, RefreshCw, Smartphone, ShieldCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Order } from "@/types";
import { formatRub, formatStars } from "@/lib/utils";
import { useTelegram } from "@/context/TelegramContext";

interface OrdersViewProps {
  onGoToStore: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onGoToStore }) => {
  const { initData, haptic } = useTelegram();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const copyToClipboard = (orderId: string, keyText: string) => {
    navigator.clipboard.writeText(keyText);
    haptic.notification("success");
    setCopiedKeyId(orderId);
    setTimeout(() => setCopiedKeyId(null), 3000);
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Выполнен
          </span>
        );
      case "paid":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-3 h-3" />
            Оплачен (ждёт ключ)
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Ожидает оплаты
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" />
            Отменен
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Bar with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Мои заказы и VPN-ключи</h2>
          <p className="text-xs text-zinc-400">
            Здесь хранятся все ваши активные подписки
          </p>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            fetchOrders();
          }}
          disabled={loading}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-zinc-900/40 border border-white/5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-800/80 flex items-center justify-center text-2xl mb-3 text-zinc-400">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-white">У вас пока нет заказов</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Оформите тариф в каталоге, чтобы получить защищённый доступ к быстрому интернету
          </p>
          <button
            onClick={onGoToStore}
            className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl bg-zinc-900/70 border border-white/10 p-4 space-y-3 shadow-xl shadow-black/20"
          >
            {/* Header: Order ID & Status */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-300">
                  Заказ #{order.id.slice(0, 8)}
                </span>
                <div className="text-[10px] text-zinc-500">
                  {new Date(order.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Items in this order */}
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-950/40"
                >
                  <span className="font-semibold text-zinc-200">
                    {item.name} <span className="text-zinc-500">x{item.quantity}</span>
                  </span>
                  <span className="font-bold text-zinc-300">
                    {order.payment_method === "telegram_stars"
                      ? formatStars(item.price_stars * item.quantity)
                      : formatRub(item.price_rub * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* VPN Key Box (For completed orders) */}
            {order.status === "completed" && order.vpn_key && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Ваш персональный VPN-ключ:
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.id, order.vpn_key!)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 py-0.5 px-2 rounded-lg bg-indigo-500/10 active:scale-95 transition-all"
                  >
                    {copiedKeyId === order.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-indigo-500/30 font-mono text-xs text-zinc-200 break-all select-all">
                  {order.vpn_key}
                </div>

                {/* Client Instructions */}
                {order.client_instructions && (
                  <div className="mt-2.5 p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                    {order.client_instructions}
                  </div>
                )}

                {/* Recommended Apps */}
                <div className="mt-3 pt-2.5 border-t border-white/5">
                  <div className="text-[11px] text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3 text-indigo-400" />
                    Рекомендуемые приложения:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <a
                      href="https://apps.apple.com/app/happ-proxy-utility/id6504287215"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between"
                    >
                      <span>🍏 Happ (iOS)</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.v2ray.ang"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between"
                    >
                      <span>🤖 v2rayNG (Android)</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    <a
                      href="https://github.com/hiddify/hiddify-next/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between"
                    >
                      <span>💻 Hiddify (PC/Mac)</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                    <a
                      href="https://apps.apple.com/app/streisand/id6450534064"
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-between"
                    >
                      <span>🍏 Streisand (iOS)</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
