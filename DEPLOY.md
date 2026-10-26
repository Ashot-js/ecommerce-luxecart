# Выкладка LuxeCart

Три части, все бесплатные: база **Supabase**, сервер **Render**, витрина **Firebase Hosting**.

## 1. База данных (Supabase) — один раз

1. supabase.com → **New project** (регион Europe), сохранить пароль базы.
2. **Connect** → **Direct** → Method **Session pooler** → скопировать строку
   (`postgresql://postgres.<id>:[YOUR-PASSWORD]@aws-...pooler.supabase.com:5432/postgres`).
   Нужен именно Session pooler: прямое подключение у Supabase только по IPv6, Render до него не достаёт.
3. Подставить пароль. Особые символы в пароле нужно закодировать
   (`node -e "console.log(encodeURIComponent('пароль'))"`).
4. Вписать строку в `functions/.env` как `DATABASE_URL=...` и выполнить:
   ```bash
   cd functions && npm install && npm run db:setup
   ```

## 2. Сервер (Render) — один раз

1. render.com → **New + → Blueprint** → репозиторий `ecommerce-luxecart` (Render читает `render.yaml`).
2. В поле **DATABASE_URL** вставить строку из шага 1. `JWT_SECRET` Render создаёт сам.
3. Дождаться статуса **Live**. Проверка: `https://<имя>.onrender.com/api/health` → `{"status":"ok"}`.
   Если имя сервиса занято, Render добавит суффикс (сейчас `luxecart-api-wxmk`) —
   тогда поменять адрес в `frontend/.env.production`.

Дальше каждый `git push` в `main` пересобирает сервер автоматически.

Если сервер не стартует — **Logs**: строка `Health check: database unavailable: ...` показывает,
почему он не может подключиться к базе (чаще всего неверный `DATABASE_URL`).

## 3. Витрина (Firebase Hosting)

```bash
cd frontend
npm install
npm run build              # берёт VITE_API_URL из .env.production
cd ..
npx firebase deploy --only hosting --project ecommerce-luxecart
```

## 4. Администратор

1. Зарегистрироваться на сайте.
2. `cd functions && npm run make-admin -- ваш@email` (с `DATABASE_URL` от Supabase в `.env`).
3. Перезайти на сайт — появится ссылка на админ-панель (`/admin`).

## Проверка после выкладки

```bash
cd functions
API_BASE=https://luxecart-api-wxmk.onrender.com/api npm run smoke
```

Проверка создаёт двух тестовых пользователей (`smoke-…@example.com`, `admin-…@example.com`) и один заказ —
удалите их после (пользователи удаляются вместе с заказами).
