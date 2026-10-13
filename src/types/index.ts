export interface Product {
  id: string;
  name: string;
  description: string;
  price_rub: number;
  price_stars: number;
  duration_days: number;
  traffic_gb: number | null; // null means Unlimited
  devices_limit: number;
  speed_mbps: number;
  countries: string[];
  image_url: string;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface User {
  id: number;
  username: string | null;
  first_name: string | null;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price_rub: number;
  price_stars: number;
  quantity: number;
  duration_days: number;
  devices_limit: number;
}

export type OrderStatus = "pending" | "paid" | "completed" | "cancelled";
export type PaymentMethod = "telegram_stars" | "external_gateway";

export interface Order {
  id: string;
  user_id: number;
  telegram_username: string | null;
  email: string | null;
  items: OrderItem[];
  total_price: number;
  total_stars: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  vpn_key: string | null;
  client_instructions: string | null;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  support_username: string;
  auto_issue_enabled: boolean;
  default_client_instruction: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
