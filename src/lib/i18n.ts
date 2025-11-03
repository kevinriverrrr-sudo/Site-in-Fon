export type Locale = "ru";

// Simple key-value i18n with nested groups using dot path access
// Default locale is Russian
const ru = {
  app: {
    title: "Генератор изображений",
    description: "Загрузите изображение, отслеживайте обработку и скачайте результат",
  },
  nav: {
    dashboard: "Панель",
    history: "История",
    auth: "Войти",
    home: "Главная",
  },
  landing: {
    heroTitle: "Мгновенная обработка изображений",
    heroSubtitle:
      "Загружайте изображения и получайте готовые результаты. Просто, быстро и бесплатно.",
    cta: "Начать бесплатно",
    featuresTitle: "Почему это удобно",
    features: [
      "Загрузка изображений перетаскиванием",
      "Отслеживание статуса выполнения",
      "Скачивание результата одним кликом",
      "Ежедневный бесплатный лимит — 30 изображений",
    ],
  },
  dashboard: {
    title: "Панель управления",
    instructions: "Перетащите изображение сюда или нажмите, чтобы выбрать файл.",
    formatsHint: "PNG, JPG, WEBP",
    orClick: "или нажмите, чтобы выбрать",
    uploading: "Загрузка...",
    enqueue: "Отправить в обработку",
    remaining: (remaining: number, limit: number) =>
      `Осталось сегодня: ${remaining} из ${limit}`,
    limitReached: "Достигнут дневной лимит. Попробуйте завтра.",
    recentJobs: "Недавние задания",
    resultReady: "Результат готов",
    download: "Скачать PNG",
    delete: "Удалить",
  },
  history: {
    title: "История",
    empty: "История пуста. Загрузите изображение, чтобы начать.",
  },
  status: {
    queued: "В очереди",
    processing: "Обработка",
    completed: "Готово",
    failed: "Ошибка",
  },
  errors: {
    quotaExceeded: "Превышен дневной лимит. Повторите попытку завтра.",
    uploadFailed: "Не удалось загрузить файл.",
    unsupportedType: "Поддерживаются только изображения.",
    notAuthenticated: "Необходимо войти в систему.",
  },
  common: {
    loading: "Загрузка...",
  },
} as const;

export type Dictionary = typeof ru;

const dictionaries: Record<Locale, Dictionary> = {
  ru,
};

export function getDictionary(locale: Locale = "ru"): Dictionary {
  return dictionaries[locale] ?? ru;
}

export function t<K extends keyof Dictionary>(key: K, locale: Locale = "ru"): Dictionary[K] {
  return getDictionary(locale)[key];
}
