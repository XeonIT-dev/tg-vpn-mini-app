import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatStars(amount: number): string {
  return `${amount} ⭐`;
}

export function formatDuration(days: number): string {
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`;
  }
  return `${days} дн.`;
}

export function formatTraffic(gb: number | null): string {
  if (gb === null || gb === 0) {
    return "Безлимит";
  }
  return `${gb} ГБ`;
}
