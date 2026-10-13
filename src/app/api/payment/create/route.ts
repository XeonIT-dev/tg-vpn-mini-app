import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { getServiceSupabase } from "@/lib/supabase";
import { createYooKassaPayment } from "@/lib/yookassa";

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

    const supabase = getServiceSupabase();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tg-vpn-mini-app.vercel.app";
    const returnUrl = `${appUrl}/?order_paid=${order.id}`;

    const { paymentId, confirmationUrl } = await createYooKassaPayment({
      orderId: order.id,
      amountRub: Number(order.total_price),
      description: `SHIELD VPN: Заказ #${order.id.slice(0, 8)}`,
      returnUrl,
    });

    // Save payment reference in order
    await supabase
      .from("orders")
      .update({
        payment_method: "external_gateway",
      })
      .eq("id", order.id);

    return NextResponse.json({
      payment_id: paymentId,
      confirmation_url: confirmationUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
