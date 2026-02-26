import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/components/AuthProvider';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import ContactMenu from '@/components/ContactMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Menu,
  X,
  ArrowRight,
  Package,
  Users,
  Receipt,
  ShoppingCart,
  BarChart3,
  UserCheck,
  Search,
  Settings,
  Eye,
  Calculator,
  PrinterIcon,
  Upload,
  CheckCircle
} from 'lucide-react';

const HowToUse = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: t('pricing'), onClick: () => navigate("/pricing") },
    { label: t('howToUse'), onClick: () => navigate("/how-to-use") },
  ];

  const guideSteps = [
    {
      title: t('howToUseStep1Title'),
      description: t('howToUseStep1Desc'),
      icon: <UserCheck className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep1Sub1'),
        t('howToUseStep1Sub2'),
        t('howToUseStep1Sub3'),
        t('howToUseStep1Sub4')
      ]
    },
    {
      title: t('howToUseStep2Title'),
      description: t('howToUseStep2Desc'),
      icon: <Package className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep2Sub1'),
        t('howToUseStep2Sub2'),
        t('howToUseStep2Sub3'),
        t('howToUseStep2Sub4')
      ]
    },
    {
      title: t('howToUseStep3Title'),
      description: t('howToUseStep3Desc'),
      icon: <Users className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep3Sub1'),
        t('howToUseStep3Sub2'),
        t('howToUseStep3Sub3'),
        t('howToUseStep3Sub4')
      ]
    },
    {
      title: t('howToUseStep4Title'),
      description: t('howToUseStep4Desc'),
      icon: <Receipt className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep4Sub1'),
        t('howToUseStep4Sub2'),
        t('howToUseStep4Sub3'),
        t('howToUseStep4Sub4')
      ]
    }
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
                className="hidden md:inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg"
              >
                {user ? t('goToDashboard') : t('signInRegister')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

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

        {/* ───── Guide Hero ───── */}
        <section className="pt-40 pb-16 md:pt-56 md:pb-24 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-[1000px] h-[600px] bg-teal-50/50 rounded-full blur-3xl -z-10" />
          <div className="container mx-auto px-6 text-center space-y-8 max-w-4xl">
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight">
              How to Use <span className="text-teal-600">Lensly</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Everything you need to know to master your optical management platform.
            </p>
          </div>
        </section>

        {/* ───── Introduction Card ───── */}
        <section className="pb-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="bg-gray-900 text-white rounded-[3rem] p-10 md:p-20 text-center space-y-12 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">{t('gettingStarted')}</h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed">
                  {t('howToUseIntro')}
                </p>
                <div className="grid md:grid-cols-3 gap-8 pt-8">
                  {[
                    { icon: <UserCheck className="h-8 w-8" />, title: t('quickSetup'), desc: t('quickSetupDesc') },
                    { icon: <Package className="h-8 w-8" />, title: t('easyManagement'), desc: t('easyManagementDesc') },
                    { icon: <BarChart3 className="h-8 w-8" />, title: t('powerfulAnalytics'), desc: t('powerfulAnalyticsDesc') }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto">
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-xl">{item.title}</h3>
                      <p className="text-gray-500 text-sm font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Step by Step ───── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 text-center mb-20 tracking-tighter">
              Step-by-Step <span className="text-teal-600">Guide</span>
            </h2>
            <div className="grid gap-8 max-w-5xl mx-auto">
              {guideSteps.map((step, idx) => (
                <div key={idx} className="group bg-gray-50 p-8 md:p-12 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row gap-12 transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                  <div className="md:w-1/3 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-teal-600/20">
                        {idx + 1}
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-teal-50 transition-colors">
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{step.title}</h3>
                    <p className="text-gray-600 font-medium leading-relaxed">{step.description}</p>
                  </div>
                  <div className="md:w-2/3 space-y-6">
                    <h4 className="font-black text-sm uppercase tracking-widest text-teal-600">{t('stepsToFollow')}</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {step.steps.map((substep, sidx) => (
                        <div key={sidx} className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                          <CheckCircle className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 font-bold text-sm leading-tight">{substep}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Pro Tips ───── */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 text-center mb-20 tracking-tighter">Pro <span className="text-teal-600">Tips</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { icon: <Search />, title: t('tip1Title'), desc: t('tip1Desc') },
                { icon: <Upload />, title: t('tip2Title'), desc: t('tip2Desc') },
                { icon: <PrinterIcon />, title: t('tip3Title'), desc: t('tip3Desc') },
                { icon: <Eye />, title: t('tip4Title'), desc: t('tip4Desc') },
                { icon: <Settings />, title: t('tip5Title'), desc: t('tip5Desc') },
                { icon: <Calculator />, title: t('tip6Title'), desc: t('tip6Desc') }
              ].map((tip, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                    {tip.icon}
                  </div>
                  <h3 className="font-black text-xl text-gray-900">{tip.title}</h3>
                  <p className="text-gray-600 font-medium text-sm leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <h2 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight">{t('readyToStart')}</h2>
              <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto">
                {t('readyToStartDesc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <button
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto px-12 py-6 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-teal-200"
                >
                  {t('startFreeTrial')}
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className="w-full sm:w-auto px-12 py-6 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl font-black text-xl transition-all"
                >
                  {t('viewPricing')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Footer ───── */}
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10 mt-auto">
          <div className="container mx-auto px-6 text-center space-y-8">
            <h3 className="text-3xl font-black text-teal-700 tracking-tighter">Lensly</h3>
            <div className="flex flex-wrap justify-center gap-8 text-gray-500 font-bold uppercase tracking-widest text-xs">
              <button onClick={() => navigate("/pricing")} className="hover:text-teal-600">Pricing</button>
              <button onClick={() => navigate("/how-to-use")} className="hover:text-teal-600">Guide</button>
              <button onClick={() => navigate("/auth")} className="hover:text-teal-600">Sign In</button>
            </div>
            <p className="text-xs text-gray-400 font-bold tracking-widest">© {new Date().getFullYear()} Lensly. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HowToUse;
