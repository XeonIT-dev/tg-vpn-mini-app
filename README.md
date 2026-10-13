# 🛡️ SHIELD VPN — Telegram Mini App & Telegram Bot

Готовое к продакшену решение для продажи VPN-тарифов с поддержкой оплаты в **Telegram Stars (⭐)**, встроенной панелью администратора прямо в Mini App и Telegram-ботом на **Long Polling**.

---

## 🚀 Стек технологий
- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Telegram WebApp SDK:** `@telegram-web-app.js`, нативный вызов `HapticFeedback`, `openInvoice` (Telegram Stars), синхронизация темной/светлой темы.
- **Database & Storage:** Supabase (PostgreSQL, Storage для картинок тарифов, Row Level Security).
- **Backend API:** Next.js Serverless Route Handlers с криптографической HMAC-SHA256 валидацией `initData` и разграничением прав администратора.
- **Telegram Bot:** Node.js + `grammY`, работающий в режиме **Long Polling** (не требует белого IP и вебхуков).

---

## 📁 Структура проекта

```
tg-vpn-mini-app/
├── bot/                           # Telegram-бот (Long Polling)
│   ├── bot.ts                     # Код бота на grammY
│   ├── package.json               # Зависимости бота
│   ├── tsconfig.json              # TypeScript конфигурация бота
│   └── .env.example               # Переменные окружения бота
├── supabase/
│   └── schema.sql                 # Полный SQL-скрипт (таблицы, RLS, Storage, демо-товары)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/route.ts  # CRUD API тарифов (GET, POST, PUT, DELETE)
│   │   │   ├── orders/route.ts    # Заказы (GET, POST, PATCH + уведомления в бот)
│   │   │   ├── settings/route.ts  # Настройки магазина (GET, PUT)
│   │   │   └── invoice/route.ts   # Создание инвойса для Telegram Stars
│   │   ├── globals.css            # Стили Tailwind CSS и CSS-переменные
│   │   ├── layout.tsx             # RootLayout с Telegram SDK скриптом
│   │   └── page.tsx               # Главная витрина каталога, фильтры, навигация
│   ├── components/
│   │   ├── Header.tsx             # Шапка, логотип, темы, счетчик корзины
│   │   ├── Navigation.tsx         # Нижний плавающий бар с безопасными зонами
│   │   ├── ProductCard.tsx        # Карточка тарифа со спецификациями и эффектами
│   │   ├── ProductModal.tsx       # Модальное окно тарифа с протоколами и флагами
│   │   ├── CartDrawer.tsx         # Выдвижная корзина
│   │   ├── CheckoutModal.tsx      # Оформление заказа и выбор оплаты Stars / Карты
│   │   ├── OrdersView.tsx         # История заказов, копирование ключа, инструкции
│   │   └── AdminPanel.tsx         # Админ-панель (CRUD товаров, заказы, настройки)
│   ├── context/
│   │   ├── TelegramContext.tsx    # Telegram WebApp провайдер и HapticFeedback
│   │   └── CartContext.tsx        # Контекст корзины
│   ├── lib/
│   │   ├── supabase.ts            # Клиентский и сервисный клиенты Supabase
│   │   ├── telegram-auth.ts       # HMAC-SHA256 проверка подписи initData и админа
│   │   └── utils.ts               # Утилиты форматирования валют и сроков
│   └── types/
│       └── index.ts               # Типы TypeScript (Product, Order, User и др.)
├── .env.example                   # Переменные окружения Next.js Mini App
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛠️ Пошаговая инструкция по настройке и запуску

### ШАГ 1: Создание бота в @BotFather
1. Откройте в Telegram диалог с [@BotFather](https://t.me/BotFather).
2. Отправьте команду `/newbot`, укажите имя и юзернейм (например, `shield_vpn_bot`).
3. Скопируйте выданный `BOT_TOKEN`.
4. Настройте кнопку меню Mini App:
   - Отправьте команду `/setmenubutton`.
   - Выберите вашего бота.
   - Введите ссылку на задеплоенное веб-приложение (например, `https://your-domain.vercel.app`).
   - Укажите текст кнопки: `🚀 Магазин VPN`.

### ШАГ 2: Как узнать свой Telegram ID
1. Напишите боту [@userinfobot](https://t.me/userinfobot) в Telegram.
2. Он вернет ваш числовой ID (например, `123456789`).
3. Добавьте его в переменную `ADMIN_TELEGRAM_IDS`.

### ШАГ 3: Настройка Supabase
1. Зарегистрируйтесь на [supabase.com](https://supabase.com) и создайте новый проект.
2. Перейдите в раздел **SQL Editor**.
3. Скопируйте и вставьте всё содержимое файла `supabase/schema.sql`, затем нажмите **Run**.
   - Скрипт создаст таблицы `users`, `products`, `orders`, `settings`.
   - Настроит Storage bucket `product-images` с публичным доступом.
   - Включит политики Row Level Security (RLS).
   - Загрузит 4 готовых демо-тарифа и базовые настройки.
4. Перейдите в **Project Settings -> API** и скопируйте:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY` (секретный ключ!)

### ШАГ 4: Настройка и запуск Mini App (Next.js)
1. Создайте файл `.env.local` на основе `.env.example`:
```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
ADMIN_TELEGRAM_IDS=123456789
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```
2. Установите зависимости и запустите сервер:
```bash
npm install
npm run dev
```
3. Сборка для продакшена:
```bash
npm run build
npm start
```
4. Деплой на [Vercel](https://vercel.com):
   - Импортируйте Git-репозиторий в Vercel.
   - Заполните те же переменные окружения в настройках проекта.
   - Нажмите **Deploy**.

### ШАГ 5: Запуск Telegram-бота (Long Polling)
1. Перейдите в папку бота:
```bash
cd bot
```
2. Создайте файл `bot/.env`:
```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
APP_URL=https://your-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
ADMIN_TELEGRAM_IDS=123456789
```
3. Установите зависимости и запустите бота:
```bash
npm install
npm run start
```
*Бот начнет опрашивать сервера Telegram через Long Polling. Вы можете запустить его на любом VPS или локально с помощью `pm2 start "npm run start" --name "vpn-bot"`.*
