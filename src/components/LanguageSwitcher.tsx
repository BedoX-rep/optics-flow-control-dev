
import React from 'react';
import { useLanguage } from './LanguageProvider';
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
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-1 text-sm font-medium cursor-pointer hover:opacity-80">
          <span className="text-base">{currentLanguage.flag}</span>
          <span>{currentLanguage.code === 'en' ? 'English' : currentLanguage.name}</span>
          <span className="text-xs">▼</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px] mt-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'en' | 'fr')}
            className="flex items-center gap-2 cursor-pointer"
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
