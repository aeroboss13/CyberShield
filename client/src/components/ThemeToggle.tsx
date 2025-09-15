import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="cyber-bg-surface hover:cyber-bg-surface-light border cyber-border rounded-lg p-2"
      data-testid="button-theme-toggle"
      title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 cyber-text-amber" />
      ) : (
        <Moon className="w-5 h-5 cyber-text-blue" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? t('theme.light') : t('theme.dark')}
      </span>
    </Button>
  );
}