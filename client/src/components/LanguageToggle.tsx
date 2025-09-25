import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageToggle(): JSX.Element {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="cyber-bg-surface hover:cyber-bg-surface-light border cyber-border rounded-lg p-2"
      data-testid="button-language-toggle"
      title={t('language.switch')}
    >
      <Globe className="w-5 h-5 cyber-text-green mr-1" />
      <span className="text-xs font-medium cyber-text">{language.toUpperCase()}</span>
      <span className="sr-only">{t('language.switch')}</span>
    </Button>
  );
}