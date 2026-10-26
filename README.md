# LuxeCart — интернет-магазин

Витрина, корзина, оформление заказа, личный кабинет и админ-панель (товары, заказы, статистика).

**Сайт:** https://ecommerce-luxecart.web.app
**API:** https://luxecart-api-wxmk.onrender.com/api/health

## Как устроено (всё на бесплатных тарифах)

| Часть | Где работает | Что делает |
|-------|--------------|-----------|
| Витрина (`frontend/`) | Firebase Hosting | React 19, TypeScript, Redux Toolkit (RTK Query), SCSS, Framer Motion |
| Сервер (`functions/`) | Render (Free) | Express 5, JWT, Zod, bcrypt, helmet, rate limit |
| База данных (`database/schema.sql`) | Supabase (Free) | PostgreSQL, RLS включён на всех таблицах |

Бесплатный Render засыпает без посетителей — первый запрос после перерыва идёт ~50 секунд.
Бесплатный проект Supabase ставится на паузу после ~7 дней без активности — разбудить кнопкой **Restore** в панели Supabase.

## Структура

```
frontend/              React-приложение (Vite)
  src/store/api/       запросы к API (RTK Query), в т.ч. adminApi.ts
  src/components/auth/ проверка входа и прав администратора
functions/             Express API
  src/routes/          auth, products, cart, orders, admin
  scripts/             db-setup, make-admin, smoke-test
database/schema.sql    таблицы, индексы, стартовые товары
render.yaml            настройки сервиса на Render
firebase.json          настройки хостинга витрины
```

## Локальный запуск

```bash
# сервер
cd functions
cp .env.example .env        # вписать DATABASE_URL и JWT_SECRET
npm install
npm run db:setup            # один раз: таблицы и товары в пустой базе
npm run build && npm start  # http://localhost:5000/api

# витрина (в другом терминале)
cd frontend
npm install
npm run dev                 # http://localhost:5173, /api проксируется на :5000
```

## Полезные команды (`functions/`)

| Команда | Что делает |
|---------|-----------|
| `npm run db:setup` | создаёт таблицы и товары в пустой базе |
| `npm run make-admin -- email@example.com` | делает зарегистрированного пользователя администратором |
| `npm run smoke` | проверка всего API (42 шага); `API_BASE=https://.../api` — проверить живой сервер |

Выкладка — см. [DEPLOY.md](DEPLOY.md).
