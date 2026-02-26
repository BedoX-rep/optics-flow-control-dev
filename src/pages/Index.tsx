import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import {
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  Menu,
  X
} from 'lucide-react';
import ContactMenu from '@/components/ContactMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const IndexPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // We'll keep these for the highlights but remove the "Features" section component
  const highlights = [
    t('clientManagementDesc'),
    t('inventoryControlDesc'),
    t('simplifiedBillingDesc'),
    t('prescriptionManagementDesc'),
  ];

  // Lock scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [mobileMenuOpen]);

  const menuItems = [
    { label: t('pricing'), onClick: () => navigate("/pricing") },
    { label: t('howToUse'), onClick: () => navigate("/how-to-use") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Fullscreen Mobile Menu - Totally Opaque Blocking */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 md:hidden animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-8 p-3 text-gray-900 bg-gray-50 rounded-full border border-gray-100 shadow-sm"
            aria-label="Close menu"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="flex flex-col items-center space-y-12 w-full max-w-sm">
            <h1 className="text-5xl font-black text-teal-700 mb-4 tracking-tighter">Lensly</h1>

            <nav className="flex flex-col items-center space-y-8 w-full">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); setMobileMenuOpen(false); }}
                  className="text-4xl font-black text-gray-900 tracking-tighter hover:text-teal-600 transition-colors uppercase"
                >
                  {item.label}
                </button>
              ))}

              <ContactMenu modalMode={true} onClose={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="pt-8 w-full text-center">
              <button
                onClick={() => { navigate(user ? "/dashboard" : "/auth"); setMobileMenuOpen(false); }}
                className="w-full bg-teal-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-teal-100 uppercase tracking-widest"
              >
                {user ? t('goToDashboard') : t('signInRegister')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={mobileMenuOpen ? "hidden md:flex flex-col flex-1" : "flex flex-col flex-1"}>
        {/* ───── Modern Header ───── */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="container mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <h1
                className="text-3xl md:text-4xl font-black text-teal-700 cursor-pointer tracking-tighter"
                onClick={() => navigate('/')}
              >
                Lensly
              </h1>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <NavigationMenu>
                  <NavigationMenuList className="gap-8">
                    {menuItems.map((item) => (
                      <NavigationMenuItem key={item.label}>
                        <button
                          onClick={item.onClick}
                          className="text-base font-semibold text-gray-600 hover:text-teal-600 transition-colors uppercase tracking-wider bg-transparent"
                        >
                          {item.label}
                        </button>
                      </NavigationMenuItem>
                    ))}
                    <ContactMenu />
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              <button
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
                className="hidden md:inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                {user ? t('goToDashboard') : t('signInRegister')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              {/* Mobile Toggle */}
              <div className="md:hidden flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-900"
                >
                  {mobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
                </button>
              </div>
            </div>
          </div>

        </header>

        {/* ───── Refined Hero Section ───── */}
        <section className="relative pt-28 pb-12 md:pt-32 md:pb-24 overflow-hidden bg-white">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-teal-50 rounded-full blur-3xl opacity-50 -z-10" />

          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom duration-1000">

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tighter px-2">
                {t('heroTitle').split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    <span className={i > 2 ? "text-teal-600 inline-block" : "inline-block"}>
                      {word}
                    </span>
                    {i < t('heroTitle').split(' ').length - 1 ? ' ' : ''}
                  </React.Fragment>
                ))}
              </h1>

              <p className="text-base md:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium px-2">
                {t('heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-2 font-sans">
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto px-10 py-4 md:py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-lg md:text-xl transition-all shadow-xl shadow-teal-200 hover:scale-105 active:scale-95"
                >
                  {t('startFreeTrial')}
                </button>
                <button
                  onClick={() => document.getElementById('effortless')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-10 py-4 md:py-5 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg md:text-xl transition-all"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="mt-12 md:mt-24 relative max-w-6xl mx-auto animate-in fade-in zoom-in duration-1000 delay-300 px-2 md:px-0">
              <div className="relative z-10 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200 border-2 md:border-8 border-white bg-white max-h-[400px] md:max-h-[65vh]">
                <img
                  src="/lovable-uploads/Secondsectionimage.png"
                  alt="Optical Software Interface Showcase"
                  className="w-full h-auto object-cover object-top"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───── Effortless Section ───── */}
        <section id="effortless" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-16">
                <div className="w-full lg:w-1/2 space-y-6 md:space-y-8 text-center lg:text-left">
                  <h2 className="text-3xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight px-2 md:px-0">
                    {t('effortlessTitle')}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium px-4 md:px-0">
                    {t('effortlessDesc')}
                  </p>

                  <div className="pt-4 hidden md:block">
                    <Button
                      size="lg"
                      onClick={() => navigate("/how-to-use")}
                      className="bg-gray-900 text-white hover:bg-black px-12 py-8 text-xl rounded-2xl transition-all shadow-xl"
                    >
                      Explore Guide
                      <ArrowRight className="ml-2 h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {highlights.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                      <div className="mt-1 bg-teal-100 p-2 rounded-xl flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="text-gray-800 font-bold text-base md:text-lg leading-tight text-left">{item}</span>
                    </div>
                  ))}
                  <div className="pt-6 sm:hidden w-full px-4 text-center">
                    <Button
                      size="lg"
                      onClick={() => navigate("/how-to-use")}
                      className="w-full bg-gray-900 text-white hover:bg-black py-7 text-lg rounded-2xl transition-all shadow-xl"
                    >
                      Explore Guide
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── CTA Section ───── */}
        <section className="py-12 md:py-24 px-6">
          <div className="container mx-auto">
            <div className="relative rounded-[2rem] md:rounded-[3rem] bg-teal-600 px-6 py-12 md:px-8 md:py-20 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-6 md:space-y-8">
                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-tight md:leading-none px-2">
                  {t('ctaTitle')}
                </h2>
                <p className="text-lg md:text-xl text-teal-50 max-w-2xl mx-auto leading-relaxed font-medium px-4">
                  {t('ctaDesc')}
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-white hover:bg-teal-50 text-teal-700 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-black/20 hover:scale-105 active:scale-95"
                  >
                    {t('freeTrialCta')}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Footer ───── */}
        <footer className="bg-white border-t border-gray-100 pt-12 md:pt-20 pb-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
              <div className="col-span-1 md:col-span-2 space-y-6 flex flex-col items-center md:items-start">
                <h3 className="text-3xl font-black text-teal-700 tracking-tighter">Lensly</h3>
                <p className="text-gray-500 text-lg leading-relaxed max-w-sm font-medium">
                  The comprehensive management solution designed specifically for opticians in Morocco and across Africa.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <h4 className="text-gray-900 font-bold uppercase tracking-widest text-sm mb-6">Explore</h4>
                <ul className="space-y-4">
                  <li><button onClick={() => navigate("/pricing")} className="text-gray-500 hover:text-teal-600 font-bold">Pricing</button></li>
                  <li><button onClick={() => navigate("/auth")} className="text-gray-500 hover:text-teal-600 font-bold">Sign In</button></li>
                  <li><button onClick={() => navigate("/how-to-use")} className="text-gray-500 hover:text-teal-600 font-bold">Guide</button></li>
                </ul>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <h4 className="text-gray-900 font-bold uppercase tracking-widest text-sm mb-6">Support</h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-gray-500 font-bold justify-center md:justify-start">
                    <Mail className="h-5 w-5 text-teal-600" />
                    support@lensly.com
                  </li>
                  <li className="flex items-center gap-3 text-gray-500 font-bold justify-center md:justify-start">
                    <Phone className="h-5 w-5 text-teal-600" />
                    0627026249
                  </li>
                  <li className="pt-2 hidden md:block"><LanguageSwitcher /></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-8 flex flex-col items-center justify-between gap-4">
              <p className="text-sm text-gray-400 font-bold">© {new Date().getFullYear()} Lensly. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default IndexPage;