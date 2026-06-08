# 🚀 PERFORMANCE & OPTIMIZATION GUIDE

> Оптимизация проекта LuxeCart для максимальной скорости

---

## ✅ Что уже оптимизировано

### 1. **Code Splitting**

- ✅ Все страницы используют `React.lazy()`
- ✅ `Suspense` fallback с `PageLoader` компонентом
- ✅ Admin маршруты в отдельном чанке
- ✅ Автоматическое разделение в Vite

### 2. **Bundle Optimization**

- ✅ Terser minification с удалением `console` и `debugger`
- ✅ Manual chunks (vendor, ui, redux)
- ✅ Sourcemaps отключены в production
- ✅ Chunk size warning limit: 500KB

### 3. **Lazy Loading Images**

- ✅ `loading="lazy"` на img тегах в `Cart.tsx`
- ✅ Можно добавить на остальные страницы

### 4. **Network Optimization**

- ✅ RTK Query кэширование API ответов
- ✅ Запросы оптимизированы в `store/api/`

### 5. **CSS Optimization**

- ✅ SCSS компиляция с минификацией
- ✅ CSS-in-JS через styled components (если нужно)

---

## 📊 Проверка производительности

### Build Analysis

```powershell
cd frontend
npm run build
```

Посмотри размер `frontend/dist/`:

- `index.js` — главный бандл
- `vendor-*.js` — React, Redux, UI библиотеки
- `assets/` — images, styles

### Local Testing

```powershell
npm run preview
# Откроется http://localhost:4173
# Открой DevTools (F12) → Network и Performance tabs
```

### Firebase Performance

```powershell
firebase open hosting:site
# Проверь: DevTools → Lighthouse (run audit)
```

---

## 🎯 Дополнительные оптимизации (если нужны)

### 1. Image Optimization

```typescript
// Add lazy loading universally
<img loading="lazy" src={url} alt="..." />

// Использовать WebP с fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." loading="lazy" />
</picture>
```

### 2. Component-level Code Splitting

```typescript
// Внутри страницы (если большой компонент)
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export default function ProductDetail() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 3. API Response Caching

- RTK Query уже кэширует (проверь в `store/api/`)
- Можно добавить `keepUnusedDataFor` для более долгого кэширования

### 4. Database Query Optimization

- Убедись что индексы установлены в PostgreSQL
- Проверь N+1 query проблемы в бэкенде

### 5. Compression

- Firebase Hosting автоматически сжимает (gzip/brotli)
- Backend (Cloud Functions) тоже

---

## 📈 Размеры бандлов (примерные)

После оптимизации:

- `vendor.js` — ~150KB
- `ui.js` — ~50KB
- `redux.js` — ~30KB
- `index.js` — ~100KB
- **Итого (gzipped): ~80-100KB**

---

## 🔧 Commands для мониторинга

```powershell
# Сборка с статистикой
cd frontend
npm run build

# Preview production build локально
npm run preview

# Lint (если настроен)
npm run lint

# Clean build (удалить node_modules и пересобрать)
rm node_modules -Recurse -Force
npm ci
npm run build
```

---

## 📋 Чек-лист перед продакшеном

- [ ] `npm run build` завершился без ошибок
- [ ] Lighthouse score > 80
- [ ] DevTools Network tab — нет 4xx/5xx ошибок
- [ ] Console tab — нет ошибок
- [ ] Все lazy-loaded страницы загружаются корректно
- [ ] API запросы работают (Network tab)
- [ ] Images отображаются правильно
- [ ] Responsive дизайн на мобилях
- [ ] `.env` переменные установлены правильно

---

## 🚀 Итоговый деплой

```powershell
# Clean install + build + deploy
cd frontend; rm node_modules -Recurse -Force; npm ci; npm run build; cd ..
cd functions; rm node_modules -Recurse -Force; npm ci; npm run build; cd ..
firebase deploy
```

Готово! 🎉
