import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import {
  CheckCircle,
  Package,
  Receipt,
  FileText,
  ArrowRight,
  Mail,
  Phone,
  ChartBar,
  Database,
  Menu,
  X,
  Users,
  Shield
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import ContactMenu from '@/components/ContactMenu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';

// Unique gradient colors per feature to break the "same icon" monotony
const featureColors = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
];

const IndexPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: t('clientManagement'),
      description: t('clientManagementDesc'),
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: t('inventoryControl'),
      description: t('inventoryControlDesc'),
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: t('simplifiedBilling'),
      description: t('simplifiedBillingDesc'),
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      title: t('prescriptionManagement'),
      description: t('prescriptionManagementDesc'),
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: t('statistics'),
      description: t('statisticsDesc'),
      icon: <ChartBar className="h-5 w-5" />,
    },
    {
      title: t('accessControl'),
      description: t('accessControlDesc'),
      icon: <Shield className="h-5 w-5" />,
    }
  ];

  const highlights = [
    t('clientManagementDesc'),
    t('inventoryControlDesc'),
    t('simplifiedBillingDesc'),
    t('prescriptionManagementDesc'),
  ];

  return (
    <div className="flex flex-col min-h-screen text-left">
      {/* ───── Hero Section ───── */}
      <div className="w-full min-h-screen md:h-screen relative overflow-hidden">
        {/* Gradient background with subtle radial accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-400/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        {/* Content */}
        <div className="relative z-10 text-white">
          <header className="container mx-auto py-5 px-6 md:px-8 lg:px-0">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold cursor-pointer tracking-tight" onClick={() => navigate('/')}>
                Lensly
              </h1>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
                        {t('features')}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[560px] gap-2 p-4 md:grid-cols-2">
                          {features.map((feature, idx) => (
                            <li key={feature.title}>
                              <div className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors">
                                <div className={`w-8 h-8 ${featureColors[idx]} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-white`}>
                                  {React.cloneElement(feature.icon, { className: "h-4 w-4" })}
                                </div>
                                <div>
                                  <div className="text-sm font-medium leading-none text-foreground">{feature.title}</div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white cursor-pointer"
                      >
                        {t('pricing')}
                      </button>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <button
                        onClick={() => navigate("/how-to-use")}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white cursor-pointer"
                      >
                        {t('howToUse')}
                      </button>
                    </NavigationMenuItem>
                    <ContactMenu />
                  </NavigationMenuList>
                </NavigationMenu>

                <div className="mx-2 z-20">
                  <LanguageSwitcher />
                </div>

                <button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="inline-flex items-center px-5 py-2.5 bg-white hover:bg-white/90 rounded-lg text-teal-700 font-semibold text-sm transition-all hover:shadow-lg cursor-pointer"
                >
                  {user ? t('goToDashboard') : t('signInRegister')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>

              {/* Mobile */}
              <div className="md:hidden flex items-center gap-2">
                <div className="z-20">
                  <LanguageSwitcher />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md hover:bg-white/10 z-20"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden fixed inset-0 top-16 bg-teal-700/98 backdrop-blur-sm z-50 px-6 py-5 shadow-lg animate-in fade-in slide-in-from-top overflow-auto">
                <div className="flex flex-col space-y-6">
                  <button onClick={() => { navigate("/pricing"); setMobileMenuOpen(false); }}
                    className="text-white py-3 text-xl font-medium text-left">
                    {t('pricing')}
                  </button>
                  <button onClick={() => { navigate("/how-to-use"); setMobileMenuOpen(false); }}
                    className="text-white py-3 text-xl font-medium text-left">
                    {t('howToUse')}
                  </button>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white/80">{t('features')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                          <div className={`w-8 h-8 ${featureColors[i]} rounded-lg flex items-center justify-center flex-shrink-0 text-white`}>
                            {feature.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{feature.title}</h4>
                            <p className="text-xs text-white/60">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate(user ? "/dashboard" : "/auth"); setMobileMenuOpen(false); }}
                    className="bg-white text-teal-700 py-3 px-4 rounded-lg font-semibold mt-4 text-center"
                  >
                    {user ? t('goToDashboard') : t('signInRegister')}
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Hero Content */}
          <section className="container mx-auto pt-12 pb-20 md:py-20 px-6 md:px-8 lg:px-0 text-center relative">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] max-w-3xl mx-auto">
              {t('heroTitle')}
            </h1>
            <p className="text-base md:text-lg mb-10 text-white/80 max-w-xl mx-auto leading-relaxed font-light">
              {t('heroSubtitle')}
            </p>
            <div className="relative z-[1] flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center px-7 py-4 text-base md:text-lg bg-white hover:bg-white/95 text-teal-700 rounded-xl font-semibold transition-all cursor-pointer shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 active:scale-[0.98]"
              >
                {t('startFreeTrial')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center px-6 py-3.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/20 cursor-pointer"
              >
                {t('features')}
              </button>
            </div>
          </section>
        </div>

        {/* Wave transition instead of harsh diagonal */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* ───── Product Showcase ───── */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-24 px-6 md:px-8 lg:px-0 bg-white relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Text side */}
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium mb-5 border border-teal-100">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('effortlessTitle')}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-5 text-gray-900 leading-tight">
                {t('effortlessTitle')}
              </h2>
              <p className="text-gray-500 mb-8 text-sm md:text-base leading-relaxed">
                {t('effortlessDesc')}
              </p>

              <div className="space-y-3 mb-8">
                {highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-teal-600" />
                    </div>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => navigate("/how-to-use")}
                className="bg-teal-600 text-white hover:bg-teal-700 px-6 py-3 text-sm rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                {t('howToUse')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Screenshot side */}
            <div className="relative order-1 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-200/60">
                <img
                  src="/lovable-uploads/2e06dd1e-f886-4184-8b53-def6765f32d3.png"
                  alt="Lensly software interface"
                  className="w-full h-auto"
                />
              </div>
              {/* Subtle decorative blobs */}
              <div className="absolute -z-10 -bottom-8 -right-8 w-40 h-40 md:w-56 md:h-56 bg-teal-50 rounded-full blur-xl" />
              <div className="absolute -z-10 -top-6 -left-6 w-32 h-32 md:w-40 md:h-40 bg-blue-50 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features Section ───── */}
      <section id="features" className="py-16 md:py-24 px-6 md:px-8 lg:px-0 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">{t('features')}</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900">{t('powerfulFeatures')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg">{t('featuresSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`w-11 h-11 ${featureColors[idx]} text-white flex items-center justify-center rounded-xl mb-4 shadow-sm`}>
                  {feature.icon}
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-16 md:py-24 px-6 md:px-8 lg:px-0">
        <div className="container mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600 px-8 py-14 md:px-16 md:py-20 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-300/15 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-5">{t('ctaTitle')}</h2>
              <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
                {t('ctaDesc')}
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center px-8 py-4 md:px-10 md:py-5 text-base md:text-lg bg-white hover:bg-white/95 text-teal-700 rounded-xl font-semibold transition-all shadow-xl shadow-black/10 hover:shadow-2xl active:scale-[0.98]"
              >
                {t('freeTrialCta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-gray-900 text-gray-400 py-10 md:py-14 px-6 md:px-8 lg:px-0">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-white text-lg font-bold mb-3 tracking-tight">Lensly</h3>
              <p className="text-sm leading-relaxed max-w-xs">
                The comprehensive management solution designed specifically for opticians in Morocco and across Africa.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-400 hover:text-white transition-colors">{t('features')}</button></li>
                <li><button onClick={() => navigate("/pricing")} className="text-sm text-gray-400 hover:text-white transition-colors">{t('pricing')}</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-sm text-gray-400 hover:text-white transition-colors">{t('signInRegister')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Contact</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>support@lensly.com</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>0627026249</span>
                </li>
              </ul>
              <div className="mt-5">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Lensly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;