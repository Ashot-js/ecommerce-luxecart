# 🚀 Deploy — Ecommerce LuxeCart

> **Windows 11 Pro · Visual Studio Code · PowerShell**

---

## Как открыть проект

1. Запусти **Visual Studio Code**
2. `File` → `Open Folder...` → выбери `C:\Users\ashgr\Desktop\ecommerce`
3. Открой терминал: `` Ctrl + ` `` (или `View` → `Terminal`)
4. Убедись что в терминале выбран **PowerShell** (вкладка справа от `+`)

Все команды ниже — прямо в этом терминале, из корня `ecommerce`.

---

## Шаг 1 — Node.js (если ещё нет)

Скачай и установи: [nodejs.org](https://nodejs.org) → версия **LTS** (20.x или 24.x)

Проверь:

```powershell
node --version
npm --version
```

---

## GitHub-репозиторий

```powershell
git remote add origin https://github.com/Ashot-js/ecommerce-luxecart.git
```

---

## Шаг 2 — Firebase CLI (один раз)

```powershell
npm install -g firebase-tools
```

---

## Шаг 3 — вход в Firebase (один раз)

```powershell
firebase login
```

Откроется браузер → войди в Google-аккаунт, привязанный к `ecommerce-luxecart`.

---

## Шаг 4 — установка зависимостей

```powershell
cd frontend
npm install
cd ..

cd functions
npm install
cd ..
```

---

## Шаг 5 — сборка фронтенда

```powershell
cd frontend
npm run build          # TypeScript + Vite → папка dist/
cd ..
```

Результат: `frontend\dist\` — готовая статика.

---

## Шаг 6 — сборка бэкенда (функции)

```powershell
cd functions
npm run build          # TypeScript → папка lib/
cd ..
```

Результат: `functions\lib\` — скомпилированный JS.

---

## Шаг 7 — деплой

```powershell
# Всё сразу: функции + хостинг
firebase deploy
```

Или по отдельности:

```powershell
firebase deploy --only functions    # только бэкенд
firebase deploy --only hosting      # только фронтенд
```

---

## Шаг 8 — открыть сайт

```powershell
firebase open hosting:site
```

---

## Шаг 9 — эмуляторы (тест локально, без деплоя)

```powershell
firebase emulators:start
```

|          | Адрес                   |
| -------- | ----------------------- |
| Фронтенд | `http://localhost:5000` |
| API      | `http://localhost:5001` |

---

## 📋 Шпаргалка — деплой за 3 команды

```powershell
cd frontend; npm install; npm run build; cd ..
cd functions; npm install; npm run build; cd ..
firebase deploy
```

---

## ⚠️ Перед деплоем проверь

- [ ] `functions\.env` заполнен (`DATABASE_URL`, `JWT_SECRET`)
- [ ] `frontend\.env` заполнен (Firebase-конфиг, если есть)
- [ ] PostgreSQL доступен из облака
- [ ] Схема БД накатана: `node run_schema.js`

---

## 📊 Оптимизация проекта

### Build оптимизация (Vite)

- ✅ Terser minification (удаление console/debugger)
- ✅ Код splitting (vendor, ui, redux бандлы)
- ✅ Sourcemaps отключены в production
- ✅ Lazy loading всех страниц (React.lazy + Suspense)

### Bundle анализ

```powershell
cd frontend
npm run build       # Показывает размер бандла
npm run preview     # Локальный preview production
```

### Удаление неиспользуемого

**Для очистки проекта от node_modules:**

```powershell
rm frontend/node_modules -Recurse -Force
rm functions/node_modules -Recurse -Force
npm ci --prefix frontend
npm ci --prefix functions
```

### Performance советы

- 🚀 Images: используй `loading="lazy"` (уже есть в Cart.tsx)
- 🚀 CSS: сжимается автоматически в build
- 🚀 API: используй RTK Query кэширование (уже есть)
- 🚀 Code splitting: route-based lazy loading активно
