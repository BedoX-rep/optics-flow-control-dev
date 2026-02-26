
import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 bg-white border-none hover:bg-slate-50 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 border-l border-slate-200 pl-2 ml-1">{currentLanguage.code.toUpperCase()}</span>
          {currentLanguage.flag}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-1 rounded-xl border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Language</p>
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'en' | 'fr')}
            className={`cursor-pointer h-10 rounded-lg flex items-center justify-between px-3 transition-colors ${language === lang.code
                ? 'bg-teal-50 text-teal-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{lang.name}</span>
            </div>
            {language === lang.code && (
              <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                <span className="text-[10px] text-white">✓</span>
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;
