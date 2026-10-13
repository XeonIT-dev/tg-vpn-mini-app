import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { Product } from "@/types";

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "f83a005c-b17b-4869-92b0-4660a9254d01",
    name: "Стартовый 1 мес",
    description: "Идеально для быстрого знакомства с сервисом, серфинга и социальных сетей. Протокол VLESS Reality с маскировкой под веб-трафик.",
    price_rub: 199,
    price_stars: 99,
    duration_days: 30,
    traffic_gb: 100,
    devices_limit: 2,
    speed_mbps: 500,
    countries: ["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇫🇮 Финляндия"],
    image_url: "🚀",
    badge: "Быстрый старт",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "f83a005c-b17b-4869-92b0-4660a9254d02",
    name: "Оптимальный 3 мес",
    description: "Самый популярный тариф для повседневного использования, стриминга в 4K и работы без ограничений. Высокая стабильность и низкий пинг.",
    price_rub: 499,
    price_stars: 249,
    duration_days: 90,
    traffic_gb: null,
    devices_limit: 4,
    speed_mbps: 1000,
    countries: ["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇸🇪 Швеция", "🇺🇸 США", "🇹🇷 Турция"],
    image_url: "⚡",
    badge: "Хит продаж",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "f83a005c-b17b-4869-92b0-4660a9254d03",
    name: "Ультра Про 1 год",
    description: "Максимальная выгода и свобода на 365 дней! Защита всех семейных устройств, доступ к эксклюзивным выделенным серверам 10 Гбит/с.",
    price_rub: 1490,
    price_stars: 749,
    duration_days: 365,
    traffic_gb: null,
    devices_limit: 8,
    speed_mbps: 2500,
    countries: ["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇸🇪 Швеция", "🇬🇧 Великобритания", "🇺🇸 США", "🇯🇵 Япония", "🇸🇬 Сингапур", "🇹🇷 Турция"],
    image_url: "👑",
    badge: "Выгода 60%",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "f83a005c-b17b-4869-92b0-4660a9254d04",
    name: "Гейминг Безлимит",
    description: "Специально оптимизированная маршрутизация с ультра-низким jitter и пингом для онлайн-игр (CS2, Dota 2, Warzone, PS/Xbox) и торрентов.",
    price_rub: 349,
    price_stars: 179,
    duration_days: 30,
    traffic_gb: null,
    devices_limit: 5,
    speed_mbps: 1000,
    countries: ["🇩🇪 Германия (Франкфурт)", "🇫🇮 Финляндия (Хельсинки)", "🇳🇱 Нидерланды (Амстердам)"],
    image_url: "🎮",
    badge: "Ultra Low Ping",
    is_active: true,
    sort_order: 4,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";
    const initData = request.headers.get("x-telegram-init-data");

    let isAdmin = false;
    if (initData) {
      const auth = verifyTelegramWebAppData(initData);
      isAdmin = auth.isAdmin;
    }

    const supabase = getServiceSupabase();
    let query = supabase.from("products").select("*").order("sort_order", { ascending: true });

    if (!isAdmin || !includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Return fallback products if database is empty or not yet connected
      return NextResponse.json(includeInactive ? FALLBACK_PRODUCTS : FALLBACK_PRODUCTS.filter((p) => p.is_active));
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(FALLBACK_PRODUCTS);
  }
}

export async function POST(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: body.name,
          description: body.description,
          price_rub: Number(body.price_rub) || 0,
          price_stars: Number(body.price_stars) || 0,
          duration_days: Number(body.duration_days) || 30,
          traffic_gb: body.traffic_gb === null || body.traffic_gb === "" ? null : Number(body.traffic_gb),
          devices_limit: Number(body.devices_limit) || 1,
          speed_mbps: Number(body.speed_mbps) || 1000,
          countries: Array.isArray(body.countries) ? body.countries : [],
          image_url: body.image_url || "🛡️",
          badge: body.badge || null,
          is_active: body.is_active ?? true,
          sort_order: Number(body.sort_order) || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("products")
      .update({
        name: body.name,
        description: body.description,
        price_rub: Number(body.price_rub) || 0,
        price_stars: Number(body.price_stars) || 0,
        duration_days: Number(body.duration_days) || 30,
        traffic_gb: body.traffic_gb === null || body.traffic_gb === "" ? null : Number(body.traffic_gb),
        devices_limit: Number(body.devices_limit) || 1,
        speed_mbps: Number(body.speed_mbps) || 1000,
        countries: Array.isArray(body.countries) ? body.countries : [],
        image_url: body.image_url || "🛡️",
        badge: body.badge || null,
        is_active: body.is_active,
        sort_order: Number(body.sort_order) || 0,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const initData = request.headers.get("x-telegram-init-data");
    const auth = verifyTelegramWebAppData(initData);

    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
