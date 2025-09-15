import { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

// Translation strings
const translations = {
  en: {
    // Header
    'header.search.placeholder': 'Search CVEs, threats, techniques...',
    'header.post': 'Post',
    'header.admin.panel': 'Admin Panel',
    'header.settings': 'Settings',
    'header.profile': 'Profile',
    'header.logout': 'Logout',
    
    // Sidebar
    'sidebar.activity.title': 'Activity This Week',
    'sidebar.posts': 'Posts',
    'sidebar.likes': 'Likes', 
    'sidebar.comments': 'Comments',
    'sidebar.online': 'Online',
    'sidebar.reputation': 'Reputation Progress',
    'sidebar.quick.actions': 'Quick Actions',
    'sidebar.threat.level': 'Global Threat Level',
    'sidebar.cves.today': 'CVEs Today',
    'sidebar.critical.high': 'Critical/High',
    'sidebar.kev.added': 'KEV Added',
    'sidebar.headlines': "Today's Security Headlines",
    'sidebar.trend': '7-Day Trend',
    
    // Posts
    'posts.like.tooltip': 'Login to like posts',
    'posts.comment': 'Comment',
    'posts.share': 'Share',
    'posts.login.required': 'Login required to interact',
    
    // Theme toggle
    'theme.light': 'Switch to light theme',
    'theme.dark': 'Switch to dark theme',
    
    // Language toggle
    'language.switch': 'Switch language',
    
    // General
    'login': 'Login',
    'register': 'Register',
    'loading': 'Loading...',
    'error': 'Error',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'online': 'Online',
    'offline': 'Offline'
  },
  ru: {
    // Header
    'header.search.placeholder': 'Поиск CVE, угроз, техник...',
    'header.post': 'Пост',
    'header.admin.panel': 'Админ панель',
    'header.settings': 'Настройки',
    'header.profile': 'Профиль',
    'header.logout': 'Выйти',
    
    // Sidebar
    'sidebar.activity.title': 'Активность за неделю',
    'sidebar.posts': 'Посты',
    'sidebar.likes': 'Лайки',
    'sidebar.comments': 'Комментарии',
    'sidebar.online': 'Онлайн',
    'sidebar.reputation': 'Прогресс репутации',
    'sidebar.quick.actions': 'Быстрые действия',
    'sidebar.threat.level': 'Глобальный уровень угроз',
    'sidebar.cves.today': 'CVE сегодня',
    'sidebar.critical.high': 'Критичные/Высокие',
    'sidebar.kev.added': 'KEV добавлено',
    'sidebar.headlines': 'Новости безопасности сегодня',
    'sidebar.trend': 'Тренд за 7 дней',
    
    // Posts
    'posts.like.tooltip': 'Войдите, чтобы лайкать посты',
    'posts.comment': 'Комментарий',
    'posts.share': 'Поделиться',
    'posts.login.required': 'Требуется вход для взаимодействия',
    
    // Theme toggle
    'theme.light': 'Переключить на светлую тему',
    'theme.dark': 'Переключить на темную тему',
    
    // Language toggle
    'language.switch': 'Переключить язык',
    
    // General
    'login': 'Войти',
    'register': 'Регистрация',
    'loading': 'Загрузка...',
    'error': 'Ошибка',
    'save': 'Сохранить',
    'cancel': 'Отмена',
    'delete': 'Удалить',
    'edit': 'Редактировать',
    'online': 'Онлайн',
    'offline': 'Не в сети'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) return savedLanguage;
    
    // Check browser language
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('ru')) return 'ru';
    return 'en';
  });

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ru' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}