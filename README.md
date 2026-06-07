# 🛒 LuxeCart — Ecommerce

Интернет-магазин на React + Firebase. Фронтенд, бэкенд (Cloud Functions) и база данных PostgreSQL.

---

## Стек

| Слой | Технологии |
|------|-----------|
| Фронтенд | React 19, Vite, TypeScript, Redux Toolkit, SCSS, Framer Motion |
| Бэкенд | Firebase Cloud Functions, Express, JWT, Zod, bcrypt |
| База данных | PostgreSQL |
| Хостинг | Firebase Hosting |
| API | `/api/**` → Express в Cloud Functions |

---

## Структура

```
ecommerce/
├── frontend/          # React-приложение (Vite)
│   ├── src/           # исходники
│   ├── dist/          # сборка (создаётся npm run build)
│   └── package.json
├── functions/         # Cloud Functions (Express API)
│   ├── src/           # TypeScript-исходники
│   ├── lib/           # скомпилированный JS (создаётся npm run build)
│   ├── .env           # переменные окружения (не коммитить!)
│   └── package.json
├── database/
│   └── schema.sql     # схема базы данных
├── firebase.json      # конфиг Firebase
├── .firebaserc        # проект ecommerce-luxecart
└── run_schema.js      # скрипт наката схемы БД
```

---

## Установка и запуск

### 1. Зависимости

```bash
# Из корня ecommerce/

cd frontend && npm install && cd ..
cd functions && npm install && cd ..
```

### 2. Переменные окружения

Создай `functions/.env`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=твой_секретный_ключ
```

### 3. База данных

```bash
# Накатить схему (указана в database/schema.sql)
node run_schema.js
```

### 4. Запуск локально

```bash
# Эмуляторы Firebase (фронтенд + функции)
firebase emulators:start
```

Фронтенд: `http://localhost:5000`  
API: `http://localhost:5001`

### 5. Скрипты

**Фронтенд** (`frontend/`):

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Предпросмотр сборки |
| `npm run lint` | Проверка кода ESLint |

**Функции** (`functions/`):

| Команда | Что делает |
|---------|-----------|
| `npm run build` | Компиляция TypeScript |
| `npm run serve` | Эмулятор функций |
| `npm run deploy` | Деплой только функций |

---

## GitHub

🔗 **https://github.com/Ashot-js/ecommerce-luxecart**

```powershell
git remote add origin https://github.com/Ashot-js/ecommerce-luxecart.git
```

---

## Деплой

Подробная инструкция: **[DEPLOY.md](./DEPLOY.md)**

Коротко:

```bash
cd frontend && npm run build && cd ..
cd functions && npm run build && cd ..
firebase deploy
```

---

## ⚠️ Важно

- **`.env`** — не коммитить (есть в `.gitignore`)
- **`node_modules/`, `dist/`, `lib/`** — не коммитятся
- База данных **PostgreSQL**, не Firebase Firestore. Строка подключения в `functions/.env`
