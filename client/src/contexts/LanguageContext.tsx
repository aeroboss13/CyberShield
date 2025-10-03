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
    'offline': 'Offline',
    'close': 'Close',
    'view': 'View',
    'details': 'Details',
    'source': 'Source',
    'code': 'Code',
    'overview': 'Overview',
    'timeline': 'Timeline',
    'share': 'Share',
    'comment': 'Comment',
    'post': 'Post',
    'search': 'Search',
    'filter': 'Filter',
    'clear': 'Clear',
    'refresh': 'Refresh',
    'update': 'Update',
    'create': 'Create',
    'submit': 'Submit',
    'next': 'Next',
    'previous': 'Previous',
    'more': 'More',
    
    // Dashboard & Navigation
    'dashboard': 'Dashboard',
    'admin': 'Admin',
    'profile': 'Profile',
    'settings': 'Settings',
    'about': 'About',
    'home': 'Home',
    'back': 'Back',
    
    // User & Authentication
    'username': 'Username',
    'email': 'Email',
    'password': 'Password',
    'name': 'Name',
    'full.name': 'Full Name',
    'create.account': 'Create Account',
    'sign.in': 'Sign In',
    'sign.out': 'Sign Out',
    'not.signed.in': 'Not Signed In',
    'sign.in.to.access': 'Sign in to access your profile',
    'administrator': 'Administrator',
    'member': 'Member',
    'reputation.progress': 'Reputation Progress',
    
    // CVE & Security
    'vulnerability.description': 'Vulnerability Description',
    'risk.assessment': 'Risk Assessment',
    'affected.vendor': 'Affected Vendor',
    'cve.id': 'CVE ID',
    'technical.details': 'Technical Details',
    'published': 'Published',
    'last.updated': 'Last Updated',
    'exploits': 'Exploits',
    'no.exploits.found': 'No exploits found for this CVE',
    'no.technical.references': 'No technical references available',
    'security.warning': 'Security Warning',
    'check.back.later': 'Check back later...',
    'loading.technique.details': 'Loading Technique Details...',
    'view.on.mitre': 'View on MITRE',
    'view.exploit': 'View Exploit',
    'nvd': 'NVD',
    
    // Quick Actions
    'quick.actions': 'Quick Actions',
    'report.security.incident': 'Report Security Incident',
    'submit.cve.analysis': 'Submit CVE Analysis',
    'share.threat.intel': 'Share Threat Intel',
    
    // Activity & Stats
    'activity': 'Activity',
    'threats.analyzed': 'Threats Analyzed',
    'community.rank': 'Community Rank',
    'this.week': 'This Week',
    'cves': 'CVEs',
    
    // Error Pages
    'page.not.found': '404 Page Not Found',
    'page.not.found.description': 'The page you are looking for does not exist.',
    
    // UI Components
    'toggle.sidebar': 'Toggle Sidebar'
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
    'offline': 'Не в сети',
    'close': 'Закрыть',
    'view': 'Просмотр',
    'details': 'Подробности',
    'source': 'Источник',
    'code': 'Код',
    'overview': 'Обзор',
    'timeline': 'Временная шкала',
    'share': 'Поделиться',
    'comment': 'Комментарий',
    'post': 'Пост',
    'search': 'Поиск',
    'filter': 'Фильтр',
    'clear': 'Очистить',
    'refresh': 'Обновить',
    'update': 'Обновить',
    'create': 'Создать',
    'submit': 'Отправить',
    'next': 'Далее',
    'previous': 'Назад',
    'more': 'Ещё',
    
    // Dashboard & Navigation
    'dashboard': 'Панель управления',
    'admin': 'Админ',
    'profile': 'Профиль',
    'settings': 'Настройки',
    'about': 'О нас',
    'home': 'Главная',
    'back': 'Назад',
    
    // User & Authentication
    'username': 'Имя пользователя',
    'email': 'Электронная почта',
    'password': 'Пароль',
    'name': 'Имя',
    'full.name': 'Полное имя',
    'create.account': 'Создать аккаунт',
    'sign.in': 'Войти',
    'sign.out': 'Выйти',
    'not.signed.in': 'Не авторизован',
    'sign.in.to.access': 'Войдите для доступа к профилю',
    'administrator': 'Администратор',
    'member': 'Участник',
    'reputation.progress': 'Прогресс репутации',
    
    // CVE & Security
    'vulnerability.description': 'Описание уязвимости',
    'risk.assessment': 'Оценка риска',
    'affected.vendor': 'Затронутый поставщик',
    'cve.id': 'CVE ID',
    'technical.details': 'Технические детали',
    'published': 'Опубликовано',
    'last.updated': 'Последнее обновление',
    'exploits': 'Эксплойты',
    'no.exploits.found': 'Эксплойты для этой CVE не найдены',
    'no.technical.references': 'Технические ссылки недоступны',
    'security.warning': 'Предупреждение безопасности',
    'check.back.later': 'Проверьте позже...',
    'loading.technique.details': 'Загрузка деталей техники...',
    'view.on.mitre': 'Просмотр в MITRE',
    'view.exploit': 'Просмотреть эксплойт',
    'nvd': 'NVD',
    
    // Quick Actions
    'quick.actions': 'Быстрые действия',
    'report.security.incident': 'Заявить инцидент ИБ',
    'submit.cve.analysis': 'Отправить анализ CVE',
    'share.threat.intel': 'Поделиться данными угроз',
    
    // Activity & Stats
    'activity': 'Активность',
    'threats.analyzed': 'Угрозы проанализированы',
    'community.rank': 'Ранг в сообществе',
    'this.week': 'На этой неделе',
    'cves': 'CVE',
    
    // Error Pages
    'page.not.found': '404 Страница не найдена',
    'page.not.found.description': 'Страница, которую вы ищете, не существует.',
    
    // UI Components
    'toggle.sidebar': 'Переключить боковую панель'
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
    // Provide fallback values if context is not available
    return {
      language: 'en' as const,
      toggleLanguage: () => {},
      t: (key: string) => key
    };
  }
  return context;
}