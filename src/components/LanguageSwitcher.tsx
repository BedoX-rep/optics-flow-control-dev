
import React from 'react';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' }
  ];

  // Find current language data
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative z-20 flex gap-2 items-center rounded-full border shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          <span className="text-lg leading-none">{currentLanguage.flag}</span>
          <span className="sr-only md:not-sr-only md:inline-block text-xs font-medium">{currentLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'en' | 'fr' | 'ar')}
            className={`flex items-center gap-2 cursor-pointer ${language === lang.code ? "bg-muted" : ""}`}
          >
            <span className="text-lg leading-none">{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
