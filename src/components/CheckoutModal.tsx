"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CreditCard, CheckCircle2, Loader2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useTelegram } from "@/context/TelegramContext";
import { formatRub, formatStars } from "@/lib/utils";
import { OrderItem } from "@/types";

interface CheckoutModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const { items, totalPrice, totalStars, clearCart } = useCart();
  const { user, initData, haptic, openInvoice } = useTelegram();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"telegram_stars" | "external_gateway">("external_gateway");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // External payment pending state
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    haptic.impact("medium");

    try {
      const orderItems: OrderItem[] = items.map(({ product, quantity }) => ({
        product_id: product.id,
        name: product.name,
        price_rub: product.price_rub,
        price_stars: product.price_stars,
        quantity,
        duration_days: product.duration_days,
        devices_limit: product.devices_limit,
      }));

      // 1. Create order in backend
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          items: orderItems,
          payment_method: paymentMethod,
          email: email.trim() || null,
          telegram_username: username.trim().replace("@", "") || null,
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || "Ошибка при создании заказа");
      }

      // 2. Handle Payment Method
      if (paymentMethod === "telegram_stars") {
        const invRes = await fetch("/api/invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-init-data": initData,
          },
          body: JSON.stringify({ order_id: orderData.id }),
        });

        const invData = await invRes.json();
        if (!invRes.ok) {
          throw new Error(invData.error || "Не удалось создать счёт Telegram Stars");
        }

        openInvoice(invData.invoice_link, (status) => {
          if (status === "paid") {
            haptic.notification("success");
            clearCart();
            onSuccess();
          } else if (status === "cancelled") {
            setError("Оплата была отменена");
          } else if (status === "failed") {
            setError("Ошибка при оплате через Telegram Stars");
          }
        });
      } else {
        // External Gateway: YooKassa (Карта / СБП)
        const payRes = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-init-data": initData,
          },
          body: JSON.stringify({ order_id: orderData.id }),
        });

        const payData = await payRes.json();
        if (!payRes.ok) {
          throw new Error(payData.error || "Не удалось создать платёжную ссылку");
        }

        const link = payData.confirmation_url;
        setPaymentUrl(link);
        setPendingOrderId(orderData.id);

        // Open YooKassa payment window
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(link);
        } else {
          window.open(link, "_blank");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Произошла непредвиденная ошибка";
      setError(msg);
      haptic.notification("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!pendingOrderId) return;
    setCheckingPayment(true);
    haptic.selection();

    try {
      const res = await fetch(`/api/payment/check?order_id=${pendingOrderId}`, {
        headers: { "x-telegram-init-data": initData },
      });
      const data = await res.json();

      if (data.is_paid) {
        haptic.notification("success");
        clearCart();
        onSuccess();
      } else {
        setError("Оплата пока не поступила. Если вы уже оплатили, подождите 10-20 секунд и проверьте снова.");
      }
    } catch {
      setError("Не удалось проверить статус платежа.");
    } finally {
      setCheckingPayment(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
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
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-white/10 p-6 shadow-2xl text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold">Оформление заказа</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Всего товаров: {items.length} на сумму {formatRub(totalPrice)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="my-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {pendingOrderId ? (
            /* Pending Payment State */
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-indigo-500/30 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white">Ожидаем оплату заказа</h4>
                <p className="text-xs text-zinc-400">
                  Счёт открыт в ЮKassa (Банковская карта, СБП, T-Pay, SberPay).
                </p>
              </div>

              {paymentUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.Telegram?.WebApp?.openLink) {
                      window.Telegram.WebApp.openLink(paymentUrl);
                    } else {
                      window.open(paymentUrl, "_blank");
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Открыть страницу оплаты повторно</span>
                </button>
              )}

              <button
                type="button"
                disabled={checkingPayment}
                onClick={handleCheckStatus}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${checkingPayment ? "animate-spin" : ""}`} />
                <span>Я оплатил — Проверить статус</span>
              </button>
            </div>
          ) : (
            /* Main Form */
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Telegram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Для автоматической привязки VPN ключа к вашему аккаунту
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email (для чека самозанятого)
                </label>
                <input
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Чек об оплате будет отправлен на эту почту
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Способ оплаты
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Card / SBP (YooKassa) */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setPaymentMethod("external_gateway");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === "external_gateway"
                        ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                        : "bg-zinc-950/60 border-white/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <CreditCard className="w-5 h-5 text-indigo-400" />
                      {paymentMethod === "external_gateway" && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white">Карта / СБП (Рубли)</div>
                    <div className="text-[11px] font-semibold text-zinc-300 mt-0.5">
                      {formatRub(totalPrice)}
                    </div>
                  </button>

                  {/* Telegram Stars */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setPaymentMethod("telegram_stars");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === "telegram_stars"
                        ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                        : "bg-zinc-950/60 border-white/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      {paymentMethod === "telegram_stars" && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white">Telegram Stars</div>
                    <div className="text-[11px] font-semibold text-amber-400 mt-0.5">
                      {formatStars(totalStars)}
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Создание счёта...</span>
                  </>
                ) : (
                  <span>
                    Оплатить{" "}
                    {paymentMethod === "telegram_stars"
                      ? formatStars(totalStars)
                      : formatRub(totalPrice)}
                  </span>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
