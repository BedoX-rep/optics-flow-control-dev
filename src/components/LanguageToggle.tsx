
import React from 'react';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-sm font-medium"
    >
      <span className="text-base">
        {language === 'en' ? '🇺🇸' : '🇫🇷'}
      </span>
      <span>
        {language === 'en' ? 'EN' : 'FR'}
      </span>
    </Button>
  );
};

export default LanguageToggle;
