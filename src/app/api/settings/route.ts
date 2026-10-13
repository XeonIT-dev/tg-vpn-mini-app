import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { StoreSettings } from "@/types";

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "VERITUS Shield VPN",
  support_username: "@vpn_support_bot",
  auto_issue_enabled: false,
  default_client_instruction:
    "1. Установите клиент V2Ray / Happ / Streisand / Hiddify на ваше устройство.\n" +
    "2. Скопируйте ваш персональный VPN-ключ (vless://).\n" +
    "3. В приложении нажмите кнопку «+» или «Добавить из буфера обмена».\n" +
    "4. Выберите нужную локацию и нажмите «Подключиться». Приятного пользования!",
};

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from("settings").select("*").eq("key", "general").single();

    if (error || !data) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json({ ...DEFAULT_SETTINGS, ...data.value });
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
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
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("settings")
      .upsert({
        key: "general",
        value: {
          store_name: body.store_name || DEFAULT_SETTINGS.store_name,
          support_username: body.support_username || DEFAULT_SETTINGS.support_username,
          auto_issue_enabled: Boolean(body.auto_issue_enabled),
          default_client_instruction:
            body.default_client_instruction || DEFAULT_SETTINGS.default_client_instruction,
        },
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data.value);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
