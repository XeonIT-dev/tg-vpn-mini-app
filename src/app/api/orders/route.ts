import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { Order, OrderItem } from "@/types";

// Send message to user or admin via Telegram Bot API
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

export async function GET(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isValid || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = getServiceSupabase();
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (auth.isAdmin) {
      if (status && status !== "all") {
        query = query.eq("status", status);
      }
    } else {
      // Regular customer only sees their own orders
      query = query.eq("user_id", auth.user.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as Order[]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isValid || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const items: OrderItem[] = body.items || [];
    const paymentMethod = body.payment_method || "telegram_stars";
    const email = body.email || null;
    const telegramUsername = body.telegram_username || auth.user.username || null;

    if (items.length === 0) {
      return NextResponse.json({ error: "Order items cannot be empty" }, { status: 400 });
    }

    const totalPrice = items.reduce((acc, item) => acc + item.price_rub * item.quantity, 0);
    const totalStars = items.reduce((acc, item) => acc + item.price_stars * item.quantity, 0);

    const supabase = getServiceSupabase();

    // 1. Ensure user exists in users table
    await supabase.from("users").upsert({
      id: auth.user.id,
      username: telegramUsername,
      first_name: auth.user.first_name,
      email: email,
      role: auth.isAdmin ? "admin" : "user",
    });

    // 2. Insert order
    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: auth.user.id,
          telegram_username: telegramUsername,
          email: email,
          items: items,
          total_price: totalPrice,
          total_stars: totalStars,
          payment_method: paymentMethod,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Notify Admins in Telegram
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const itemsSummary = items.map((i) => `• ${i.name} (x${i.quantity})`).join("\n");
    const adminMsg = `🛒 <b>Новый заказ #${order.id.slice(0, 8)}</b>\n\n` +
      `👤 Клиент: @${telegramUsername || "hidden"} (ID: <code>${auth.user.id}</code>)\n` +
      `📦 Состав:\n${itemsSummary}\n` +
      `💰 Сумма: <b>${totalPrice} ₽</b> / <b>${totalStars} ⭐</b>\n` +
      `💳 Способ: <code>${paymentMethod}</code>\n` +
      `⏳ Статус: <b>В ожидании оплаты</b>`;

    for (const adminId of adminIds) {
      await sendTelegramMessage(adminId, adminMsg);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, vpn_key, client_instructions } = body;

    if (!id) {
      return NextResponse.json({ error: "Order id is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch existing order
    const { data: existingOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updates: Partial<Order> = {};
    if (status) updates.status = status;
    if (vpn_key !== undefined) updates.vpn_key = vpn_key;
    if (client_instructions !== undefined) updates.client_instructions = client_instructions;

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If order was completed and VPN key is provided, send notification to the client
    if (status === "completed" && vpn_key) {
      const userMessage =
        `🎉 <b>Ваш заказ #${id.slice(0, 8)} успешно выполнен!</b>\n\n` +
        `🔑 <b>Ваш персональный VPN-ключ:</b>\n` +
        `<code>${vpn_key}</code>\n\n` +
        `📖 <b>Инструкция по подключению:</b>\n` +
        `${client_instructions || "Скопируйте ключ и вставьте в клиентское приложение V2Ray/Happ/Streisand."}\n\n` +
        `Вы также всегда можете просмотреть и скопировать ключ в разделе «Мои заказы» нашего приложения.`;

      await sendTelegramMessage(existingOrder.user_id, userMessage);
    }

    return NextResponse.json(updatedOrder);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
