# Next.js 14 App Router Project

Современное веб-приложение на Next.js 14 с App Router и TypeScript.

## Требования

- Node.js 20.19.5 (см. `.nvmrc`)
- pnpm (рекомендуется)

## Начало работы

1. Установите зависимости:

```bash
pnpm install
```

2. Скопируйте файл переменных окружения:

```bash
cp .env.example .env
```

3. Запустите сервер разработки:

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
src/
├── app/              # App Router страницы
│   ├── (auth)/      # Группа маршрутов авторизации
│   ├── (dashboard)/ # Группа маршрутов панели управления
│   ├── layout.tsx   # Корневой layout
│   ├── page.tsx     # Главная страница
│   └── globals.css  # Глобальные стили
├── components/       # React компоненты
├── lib/             # Утилиты и вспомогательные функции
└── env.ts           # Валидация переменных окружения
```

## Путевые псевдонимы

Проект использует следующие путевые псевдонимы:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/app` → `src/app`
- `@/*` → `src/*`

## Переменные окружения

Проект использует `@t3-oss/env-nextjs` и `zod` для валидации переменных окружения.
Все необходимые переменные определены в `.env.example` с разумными значениями для разработки.

Основные переменные:
- `DATABASE_URL` - URL базы данных
- `AUTH_SECRET` - Секрет для аутентификации
- `SMTP_*` - Настройки SMTP
- `S3_*` - Настройки S3
- `REDIS_URL` - URL Redis
- `API_KEY` - API ключ

## Скрипты

- `pnpm dev` - Запуск сервера разработки
- `pnpm build` - Сборка для продакшена
- `pnpm start` - Запуск продакшен сервера
- `pnpm lint` - Проверка кода с помощью ESLint

## Технологии

- [Next.js 14](https://nextjs.org/) - React фреймворк
- [TypeScript](https://www.typescriptlang.org/) - Типизация
- [Zod](https://zod.dev/) - Валидация схем
- [@t3-oss/env-nextjs](https://env.t3.gg/) - Валидация переменных окружения
