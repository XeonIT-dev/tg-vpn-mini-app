import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getYooKassaPayment } from "@/lib/yookassa";
import crypto from "crypto";

async function sendTelegramMessage(chatId: number | string, text: string) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error("Failed to send telegram message:", e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.event !== "payment.succeeded") {
      return NextResponse.json({ status: "ignored" });
    }

    const paymentObject = body.object;
    const paymentId = paymentObject.id;
    const orderId = paymentObject.metadata?.order_id;

    if (!orderId) {
      console.error("Webhook received without order_id in metadata:", paymentId);
      return NextResponse.json({ status: "no_order_id" }, { status: 400 });
    }

    // Verify payment authenticity directly with YooKassa if credentials exist
    const verifiedPayment = await getYooKassaPayment(paymentId);
    if (verifiedPayment && verifiedPayment.status !== "succeeded") {
      console.error("Payment status verification failed:", verifiedPayment.status);
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("Order not found in webhook:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If already completed or paid, avoid duplicate processing
    if (order.status === "completed" || order.status === "paid") {
      return NextResponse.json({ status: "already_processed" });
    }

    // Check store settings for auto-issue
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "general")
      .single();

    const autoIssue = settingsData?.value?.auto_issue_enabled ?? false;
    const defaultInstruction =
      settingsData?.value?.default_client_instruction ||
      "Скопируйте ключ и вставьте в клиентское приложение V2Ray / Happ / Hiddify.";

    let newStatus = "paid";
    let generatedKey: string | null = null;

    if (autoIssue) {
      newStatus = "completed";
      const uuid = crypto.randomUUID();
      generatedKey = `vless://${uuid}@nl1.shield-vpn.net:443?security=reality&sni=gateway.icloud.com&fp=chrome&pbk=x9K3PqLm8_DemoKeyPub443&type=tcp#SHIELD_VPN_NL`;
    }

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      payment_method: "external_gateway",
    };

    if (generatedKey) {
      updatePayload.vpn_key = generatedKey;
      updatePayload.client_instructions = defaultInstruction;
    }

    await supabase.from("orders").update(updatePayload).eq("id", orderId);

    // 1. Notify buyer in Telegram
    if (newStatus === "completed" && generatedKey) {
      const userSuccessMsg =
        `🎉 <b>Оплата через ЮKassa (${paymentObject.amount?.value || order.total_price} ₽) успешно получена!</b>\n\n` +
        `🔑 <b>Ваш VPN-ключ готов к использованию:</b>\n` +
        `<code>${generatedKey}</code>\n\n` +
        `📖 <b>Инструкция по настройке:</b>\n` +
        `${defaultInstruction}\n\n` +
        `Вы также можете скопировать ключ в любое время во вкладке «Мои ключи» Mini App.`;

      await sendTelegramMessage(order.user_id, userSuccessMsg);
    } else {
      const userPendingMsg =
        `✅ <b>Оплата через ЮKassa (${paymentObject.amount?.value || order.total_price} ₽) успешно получена!</b>\n\n` +
        `Номер вашего заказа: <code>#${orderId.slice(0, 8)}</code>\n` +
        `Администратор генерирует ваш персональный ключ. Как только ключ будет готов, вы получите сообщение здесь, а также в разделе «Мои ключи» Mini App.`;

      await sendTelegramMessage(order.user_id, userPendingMsg);
    }

    // 2. Notify admins in Telegram
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const adminNotification =
      `💳 <b>Успешная оплата картой/СБП заказа #${orderId.slice(0, 8)}</b>\n\n` +
      `👤 Клиент: @${order.telegram_username || "hidden"} (ID: <code>${order.user_id}</code>)\n` +
      `💰 Сумма: <b>${paymentObject.amount?.value || order.total_price} ₽</b> (ЮKassa)\n` +
      `📦 Статус: <b>${newStatus.toUpperCase()}</b>\n` +
      (!autoIssue ? `⚠️ <i>Требуется ручная выдача ключа в Админ-панели!</i>` : `⚡ <i>Ключ выдан автоматически!</i>`);

    for (const adminId of adminIds) {
      await sendTelegramMessage(adminId, adminNotification);
    }

    return NextResponse.json({ status: "success" });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
