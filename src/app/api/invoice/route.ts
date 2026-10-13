import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isValid || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "BOT_TOKEN not configured on server" },
        { status: 500 }
      );
    }

    // Fetch order details from Supabase
    const supabase = getServiceSupabase();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.total_stars <= 0) {
      return NextResponse.json(
        { error: "Invalid total stars for invoice" },
        { status: 400 }
      );
    }

    // Call Telegram Bot API to generate invoice link for Telegram Stars (currency: XTR)
    const title = `Заказ #${order.id.slice(0, 8)}`;
    const description = `Оплата подписки VPN (${order.total_stars} ⭐)`;

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          payload: `order_${order.id}`,
          currency: "XTR",
          prices: [
            {
              label: "VPN Подписка",
              amount: order.total_stars,
            },
          ],
        }),
      }
    );

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      console.error("Telegram createInvoiceLink error:", telegramData);
      return NextResponse.json(
        { error: telegramData.description || "Failed to create invoice link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice_link: telegramData.result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
