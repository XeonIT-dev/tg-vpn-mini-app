import crypto from "crypto";
import { TelegramUser } from "@/types";

export interface TelegramAuthResult {
  isValid: boolean;
  user: TelegramUser | null;
  isAdmin: boolean;
  error?: string;
}

/**
 * Validates Telegram WebApp initData string using HMAC-SHA256 according to Telegram specifications.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramWebAppData(initData: string | null | undefined): TelegramAuthResult {
  const botToken = process.env.BOT_TOKEN;
  const adminIdsStr = process.env.ADMIN_TELEGRAM_IDS || "";
  const adminIds = adminIdsStr
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  // Fallback for local development or demo preview when botToken is not set
  if (!initData || initData === "demo" || !botToken) {
    if (process.env.NODE_ENV === "development" || !botToken) {
      const demoUser: TelegramUser = {
        id: adminIds.length > 0 ? Number(adminIds[0]) : 777000,
        first_name: "Demo",
        username: "demouser",
      };
      return {
        isValid: true,
        user: demoUser,
        isAdmin: true,
      };
    }
    return {
      isValid: false,
      user: null,
      isAdmin: false,
      error: "Missing initData or bot token",
    };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");

    if (!hash) {
      return {
        isValid: false,
        user: null,
        isAdmin: false,
        error: "Missing hash in initData",
      };
    }

    // Sort parameters lexicographically excluding hash
    const dataCheckArr: string[] = [];
    Array.from(urlParams.keys())
      .filter((key) => key !== "hash")
      .sort()
      .forEach((key) => {
        dataCheckArr.push(`${key}=${urlParams.get(key)}`);
      });

    const dataCheckString = dataCheckArr.join("\n");

    // 1. secret_key = HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // 2. calculated_hash = HMAC_SHA256(secret_key, dataCheckString)
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return {
        isValid: false,
        user: null,
        isAdmin: false,
        error: "Invalid HMAC hash signature",
      };
    }

    // Extract user payload
    const userJson = urlParams.get("user");
    let user: TelegramUser | null = null;
    if (userJson) {
      try {
        user = JSON.parse(userJson) as TelegramUser;
      } catch {
        user = null;
      }
    }

    const userIdStr = user ? String(user.id) : "";
    const isAdmin = adminIds.includes(userIdStr);

    return {
      isValid: true,
      user,
      isAdmin,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown auth error";
    return {
      isValid: false,
      user: null,
      isAdmin: false,
      error: message,
    };
  }
}
