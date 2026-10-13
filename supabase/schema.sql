-- ==============================================================================
-- TELEGRAM VPN MINI APP - COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY, -- Telegram User ID
    username TEXT,
    first_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_rub NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_stars INTEGER NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    traffic_gb INTEGER DEFAULT NULL, -- NULL or 0 means Unlimited
    devices_limit INTEGER NOT NULL DEFAULT 3,
    speed_mbps INTEGER NOT NULL DEFAULT 1000,
    countries JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT NOT NULL DEFAULT '',
    badge TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_username TEXT,
    email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_stars INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('telegram_stars', 'external_gateway')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
    vpn_key TEXT,
    client_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_is_active_sort ON public.products(is_active, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read active products, service_role has full control
CREATE POLICY "Public can view active products" 
    ON public.products 
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Service role full access on products" 
    ON public.products 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Users: service_role full control, users can view their own record
CREATE POLICY "Users can view their own user profile" 
    ON public.users 
    FOR SELECT 
    USING (true);

CREATE POLICY "Service role full access on users" 
    ON public.users 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Orders: Service role full access
CREATE POLICY "Service role full access on orders" 
    ON public.orders 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Settings: Service role full access, public can read client configs
CREATE POLICY "Public can view settings" 
    ON public.settings 
    FOR SELECT 
    USING (true);

CREATE POLICY "Service role full access on settings" 
    ON public.settings 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read on product-images bucket" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'product-images');

CREATE POLICY "Service role upload on product-images bucket" 
    ON storage.objects 
    FOR ALL 
    TO service_role 
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

-- ==============================================================================
-- SEED INITIAL SETTINGS
-- ==============================================================================
INSERT INTO public.settings (key, value)
VALUES 
(
    'general', 
    jsonb_build_object(
        'store_name', 'VERITUS Shield VPN',
        'support_username', '@vpn_support_bot',
        'auto_issue_enabled', false,
        'default_client_instruction', E'1. Установите клиент V2Ray / Happ / Streisand / Hiddify на ваше устройство.\n2. Скопируйте ваш персональный VPN-ключ (vless://).\n3. В приложении нажмите кнопку "+" или "Добавить из буфера обмена".\n4. Выберите нужную локацию и нажмите "Подключиться". Приятного пользования!'
    )
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- ==============================================================================
-- SEED 4 REALISTIC DEMO PRODUCTS
-- ==============================================================================
DELETE FROM public.products WHERE name IN ('Стартовый 1 мес', 'Оптимальный 3 мес', 'Ультра Про 1 год', 'Гейминг Безлимит');

INSERT INTO public.products (
    name, 
    description, 
    price_rub, 
    price_stars, 
    duration_days, 
    traffic_gb, 
    devices_limit, 
    speed_mbps, 
    countries, 
    image_url, 
    badge, 
    is_active, 
    sort_order
)
VALUES 
(
    'Стартовый 1 мес',
    'Идеально для быстрого знакомства с сервисом, серфинга и социальных сетей. Протокол VLESS Reality с маскировкой под трафик браузера.',
    199.00,
    99,
    30,
    100,
    2,
    500,
    '["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇫🇮 Финляндия"]'::jsonb,
    '🚀',
    'Быстрый старт',
    true,
    1
),
(
    'Оптимальный 3 мес',
    'Самый популярный тариф для повседневного использования, стриминга в 4K и работы без ограничений. Высокая стабильность и низкий пинг.',
    499.00,
    249,
    90,
    NULL, -- Безлимит
    4,
    1000,
    '["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇸🇪 Швеция", "🇺🇸 США", "🇹🇷 Турция"]'::jsonb,
    '⚡',
    'Хит продаж',
    true,
    2
),
(
    'Ультра Про 1 год',
    'Максимальная выгода и свобода на 365 дней! Защита всех семейных устройств, доступ к эксклюзивным выделенным серверам 10 Гбит/с.',
    1490.00,
    749,
    365,
    NULL, -- Безлимит
    8,
    2500,
    '["🇳🇱 Нидерланды", "🇩🇪 Германия", "🇸🇪 Швеция", "🇬🇧 Великобритания", "🇺🇸 США", "🇯🇵 Япония", "🇸🇬 Сингапур", "🇹🇷 Турция"]'::jsonb,
    '👑',
    'Выгода 60%',
    true,
    3
),
(
    'Гейминг Безлимит',
    'Специально оптимизированная маршрутизация с ультра-низким jitter и пингом для онлайн-игр (CS2, Dota 2, Warzone, PS/Xbox) и торрентов.',
    349.00,
    179,
    30,
    NULL, -- Безлимит
    5,
    1000,
    '["🇩🇪 Германия (Франкфурт)", "🇫🇮 Финляндия (Хельсинки)", "🇳🇱 Нидерланды (Амстердам)"]'::jsonb,
    '🎮',
    'Ultra Low Ping',
    true,
    4
);
