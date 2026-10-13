"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
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
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Активен
          </span>
        );
      case "paid":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08]">
            Оплачен (ждёт ключ)
          </span>
        );
      case "pending":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Ожидает оплаты
          </span>
        );
      case "cancelled":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            Отменён
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">Мои ключи</h2>
          <p className="text-xs text-zinc-400">
            Список ваших подписок и VPN-ключей
          </p>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            fetchOrders();
          }}
          disabled={loading}
          className="p-2 rounded-xl text-zinc-400 hover:text-white active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-zinc-950 border border-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-white/[0.06]">
          <h3 className="text-xs font-semibold text-zinc-300">Заказов пока нет</h3>
          <p className="text-[11px] text-zinc-500 mt-1">
            Оформите тариф в каталоге, чтобы получить ключ
          </p>
          <button
            onClick={onGoToStore}
            className="mt-3 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs active:scale-95 transition-all"
          >
            В каталог
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl bg-zinc-950 border border-white/[0.08] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-zinc-400">
                  #{order.id.slice(0, 8)}
                </span>
                <span className="text-[10px] text-zinc-600 ml-2 font-mono">
                  {new Date(order.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-zinc-300">
                  <span>{item.name} <span className="text-zinc-500">x{item.quantity}</span></span>
                  <span className="font-mono text-zinc-400">
                    {order.payment_method === "telegram_stars"
                      ? formatStars(item.price_stars * item.quantity)
                      : formatRub(item.price_rub * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* VPN Key Box */}
            {order.status === "completed" && order.vpn_key && (
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">VPN Ключ:</span>
                  <button
                    onClick={() => copyToClipboard(order.id, order.vpn_key!)}
                    className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white px-2 py-0.5 rounded-md bg-zinc-900 border border-white/[0.08] active:scale-95 transition-all"
                  >
                    {copiedKeyId === order.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] font-mono text-[11px] text-zinc-300 break-all select-all">
                  {order.vpn_key}
                </div>

                {order.client_instructions && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">
                    {order.client_instructions}
                  </p>
                )}

                {/* Quick App Links */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  <a
                    href="https://apps.apple.com/app/happ-proxy-utility/id6504287215"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-md bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06] flex items-center gap-1"
                  >
                    <span>Happ (iOS)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.v2ray.ang"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-md bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06] flex items-center gap-1"
                  >
                    <span>v2rayNG (Android)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href="https://github.com/hiddify/hiddify-next/releases"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded-md bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06] flex items-center gap-1"
                  >
                    <span>Hiddify (PC/Mac)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
