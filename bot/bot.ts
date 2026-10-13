import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || "https://example.com";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!BOT_TOKEN) {
  console.error("CRITICAL ERROR: BOT_TOKEN is not defined in environment variables!");
  process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Initialize grammY Bot
const bot = new Bot(BOT_TOKEN);

// Helper function to notify all admins
async function notifyAdmins(text: string) {
  for (const adminId of ADMIN_TELEGRAM_IDS) {
    try {
      await bot.api.sendMessage(adminId, text, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      });
    } catch (err) {
      console.error(`Failed to notify admin ${adminId}:`, err);
    }
  }
}

// 1. /start command
bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "друг";
  const userId = ctx.from?.id;

  // Upsert user into database
  if (userId) {
    await supabase.from("users").upsert({
      id: userId,
      username: ctx.from?.username || null,
      first_name: ctx.from?.first_name || null,
      role: ADMIN_TELEGRAM_IDS.includes(String(userId)) ? "admin" : "user",
    });
  }

  const welcomeText =
    `🛡️ <b>Добро пожаловать в SHIELD VPN, ${name}!</b>\n\n` +
    `Мы предоставляем ультра-быстрый доступ к свободному интернету без ограничений и замедлений:\n\n` +
    `⚡ <b>Протокол VLESS Reality</b> — полная маскировка под обычный трафик браузера\n` +
    `🚀 Скорость до <b>10 Гбит/с</b> с пингом от 15 мс\n` +
    `🎬 Идеально для <b>YouTube 4K, Netflix, Instagram и Discord</b>\n` +
    `⭐ Оплата прямо внутри Telegram через <b>Telegram Stars</b> или картой\n` +
    `🔒 <b>Строгая No-Logs политика</b> — полная анонимность\n\n` +
    `Нажмите кнопку ниже, чтобы открыть каталог тарифов и выбрать подходящий план:`;

  const keyboard = new InlineKeyboard()
    .webApp("🚀 Открыть магазин VPN", APP_URL)
    .row()
    .url("💬 Поддержка", "https://t.me/vpn_support_bot");

  await ctx.reply(welcomeText, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// 2. /help command
bot.command("help", async (ctx) => {
  const helpText =
    `📖 <b>Справочный центр SHIELD VPN</b>\n\n` +
    `<b>Как подключиться после покупки?</b>\n` +
    `1. Откройте приложение по кнопке «Открыть магазин VPN».\n` +
    `2. Перейдите во вкладку «Мои ключи» и нажмите «Копировать» возле вашего тарифа.\n` +
    `3. Вставьте ключ в одно из рекомендованных приложений:\n\n` +
    `• <b>iOS:</b> Happ, Streisand, FoXray\n` +
    `• <b>Android:</b> v2rayNG, Hiddify, Happ\n` +
    `• <b>Windows / macOS:</b> Hiddify Next, Nekoray\n\n` +
    `Если у вас возникли вопросы, наша поддержка всегда на связи: @vpn_support_bot`;

  const keyboard = new InlineKeyboard().webApp("🚀 Открыть магазин", APP_URL);

  await ctx.reply(helpText, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// 3. /admin command
bot.command("admin", async (ctx) => {
  const userId = String(ctx.from?.id);

  if (!ADMIN_TELEGRAM_IDS.includes(userId)) {
    return ctx.reply("⛔ У вас нет доступа к панели администратора.");
  }

  const keyboard = new InlineKeyboard().webApp("🛠️ Открыть Админ-панель", APP_URL);

  await ctx.reply(
    `👨‍💻 <b>Панель администратора</b>\n\n` +
    `Вы можете управлять тарифами, ценами, просматривать заказы и выдавать ключи прямо в Mini App:`,
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    }
  );
});

// 4. Handle pre_checkout_query for Telegram Stars
bot.on("pre_checkout_query", async (ctx) => {
  try {
    const payload = ctx.preCheckoutQuery.invoice_payload;
    console.log(`Received pre_checkout_query for payload: ${payload}`);

    // Verify invoice payload format (e.g. order_<uuid>)
    if (!payload.startsWith("order_")) {
      return ctx.answerPreCheckoutQuery(false, {
        error_message: "Некорректный идентификатор заказа.",
      });
    }

    const orderId = payload.replace("order_", "");

    // Check order existence in Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return ctx.answerPreCheckoutQuery(false, {
        error_message: "Заказ не найден в базе данных.",
      });
    }

    if (order.status === "completed") {
      return ctx.answerPreCheckoutQuery(false, {
        error_message: "Этот заказ уже был оплачен и выполнен.",
      });
    }

    // Approve the payment
    await ctx.answerPreCheckoutQuery(true);
  } catch (err) {
    console.error("Error in pre_checkout_query handler:", err);
    await ctx.answerPreCheckoutQuery(false, {
      error_message: "Внутренняя ошибка проверки платежа.",
    });
  }
});

// 5. Handle successful_payment for Telegram Stars
bot.on(":successful_payment", async (ctx) => {
  try {
    const payment = ctx.message?.successful_payment;
    if (!payment) return;

    const payload = payment.invoice_payload;
    const orderId = payload.replace("order_", "");
    const starsAmount = payment.total_amount;
    const userId = ctx.from?.id;

    console.log(`Payment confirmed for order: ${orderId}, amount: ${starsAmount} XTR`);

    // Fetch store settings to check auto-issue
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
      // Generate unique VLESS client configuration string
      const uuid = crypto.randomUUID();
      generatedKey = `vless://${uuid}@nl1.shield-vpn.net:443?security=reality&sni=gateway.icloud.com&fp=chrome&pbk=x9K3PqLm8_DemoKeyPub443&type=tcp#SHIELD_VPN_NL`;
    }

    // Update order in Supabase
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      payment_method: "telegram_stars",
    };

    if (generatedKey) {
      updatePayload.vpn_key = generatedKey;
      updatePayload.client_instructions = defaultInstruction;
    }

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update order status in DB:", error);
    }

    // Send confirmation to the buyer
    if (newStatus === "completed" && generatedKey) {
      const userSuccessMsg =
        `🎉 <b>Оплата ${starsAmount} ⭐ успешно получена!</b>\n\n` +
        `🔑 <b>Ваш VPN-ключ готов к использованию:</b>\n` +
        `<code>${generatedKey}</code>\n\n` +
        `📖 <b>Инструкция по настройке:</b>\n` +
        `${defaultInstruction}\n\n` +
        `Вы также можете открыть Mini App в любое время во вкладке «Мои ключи».`;

      const kb = new InlineKeyboard().webApp("🔑 Открыть в приложении", APP_URL);
      await ctx.reply(userSuccessMsg, { parse_mode: "HTML", reply_markup: kb });
    } else {
      const userPendingMsg =
        `✅ <b>Оплата ${starsAmount} ⭐ успешно принята!</b>\n\n` +
        `Номер вашего заказа: <code>#${orderId.slice(0, 8)}</code>\n` +
        `Администратор генерирует ваш персональный ключ. Как только ключ будет готов, вы получите сообщение здесь, а также в разделе «Мои ключи» Mini App.`;

      const kb = new InlineKeyboard().webApp("📦 Проверить статус заказа", APP_URL);
      await ctx.reply(userPendingMsg, { parse_mode: "HTML", reply_markup: kb });
    }

    // Notify Admins
    const adminNotification =
      `💰 <b>Успешная оплата заказа #${orderId.slice(0, 8)}</b>\n\n` +
      `👤 Клиент: @${ctx.from?.username || "hidden"} (ID: <code>${userId}</code>)\n` +
      `⭐ Сумма: <b>${starsAmount} Telegram Stars</b>\n` +
      `📦 Статус: <b>${newStatus.toUpperCase()}</b>\n` +
      (!autoIssue ? `⚠️ <i>Требуется ручная выдача ключа в Админ-панели!</i>` : `⚡ <i>Ключ выдан автоматически!</i>`);

    await notifyAdmins(adminNotification);
  } catch (err) {
    console.error("Error processing successful payment:", err);
  }
});

// Error handling
bot.catch((err) => {
  console.error("Error in bot update loop:", err);
});

// Launch bot via Long Polling
console.log("-----------------------------------------");
console.log("🛡️ SHIELD VPN Telegram Bot starting...");
console.log("Mode: LONG POLLING");
console.log(`Connected to App: ${APP_URL}`);
console.log("-----------------------------------------");

bot.start({
  onStart: (info) => {
    console.log(`✅ Bot @${info.username} successfully running on Long Polling!`);
  },
});
