import React from 'react';

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export default function HighlightText({ text, searchQuery, className = '' }: HighlightTextProps) {
  if (!searchQuery || !text) {
    return <span className={className}>{text}</span>;
  }

  // Очищаем поисковый запрос от специальных символов
  const cleanQuery = searchQuery.trim();
  if (!cleanQuery) {
    return <span className={className}>{text}</span>;
  }

  // Создаем регулярное выражение для поиска (игнорируем регистр)
  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Разбиваем текст на части
  const parts = text.split(regex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Проверяем, является ли часть совпадением (с учетом регистра)
        const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
        return isMatch ? (
          <mark 
            key={index} 
            className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}
