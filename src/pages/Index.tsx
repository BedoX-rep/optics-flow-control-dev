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
  X
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import ContactMenu from '@/components/ContactMenu';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';

const IndexPage = () => {
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: t('clientManagement'),
      description: t('clientManagementDesc'),
      icon: <Package className="h-6 w-6" />,
      detail: "Store detailed client information including contact details, prescription history, purchase records, and appointment scheduling."
    },
    {
      title: t('inventoryControl'),
      description: t('inventoryControlDesc'),
      icon: <Package className="h-6 w-6" />,
      detail: "Track stock levels, set reorder points, manage suppliers, and categorize products for easy searching and management."
    },
    {
      title: "Simplified Billing",
      description: "Create and manage receipts, invoices, and track payments efficiently",
      icon: <Receipt className="h-6 w-6" />,
      detail: "Generate professional receipts, manage payment methods, track outstanding balances, and integrate with common accounting systems."
    },
    {
      title: "Prescription Management",
      description: "Easily record and track patient prescriptions and changes over time",
      icon: <FileText className="h-6 w-6" />,
      detail: "Record detailed prescription data, track changes over time, and quickly retrieve prescription history for returning clients."
    },
    {
      title: "Statistics",
      description: "Comprehensive analytics and reporting on your business performance",
      icon: <ChartBar className="h-6 w-6" />,
      detail: "Monitor sales trends, analyze customer preferences, and generate insightful reports to optimize your business operations."
    },
    {
      title: "Access Control",
      description: "Manage user permissions and control access to sensitive data",
      icon: <Database className="h-6 w-6" />,
      detail: "Set role-based permissions, secure sensitive client information, and ensure data privacy compliance."
    }
  ];

  return (
    <div className={`flex flex-col min-h-screen ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      {/* Header/Navigation with Gradient Background */}
      <div className="w-full min-h-screen md:h-screen bg-gradient-to-b from-teal-600 to-teal-700 text-white relative">
        <header className="container mx-auto py-4 px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate('/')}>Lensly</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white">
                      {t('features')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                        {features.map((feature) => (
                          <li key={feature.title}>
                            <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                              <div className="flex items-center gap-2">
                                {React.cloneElement(feature.icon, { className: "h-5 w-5 text-primary" })}
                                <div className="text-sm font-medium leading-none">{feature.title}</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <button
                      onClick={() => navigate("/pricing")}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white cursor-pointer"
                    >
                      {t('pricing')}
                    </button>
                  </NavigationMenuItem>
                  <ContactMenu />
                </NavigationMenuList>
              </NavigationMenu>
              
              {/* Language Switcher */}
              <div className="mx-2 z-20">
                <LanguageSwitcher />
              </div>
              
              <div className="flex items-center space-x-4 relative z-10">
                <button
                  onClick={() => navigate(user ? "/dashboard" : "/auth")}
                  className="inline-flex items-center px-4 py-2 bg-white hover:bg-white/90 rounded-md text-primary font-medium transition-colors relative z-20 cursor-pointer"
                >
                  {user ? t('goToDashboard') : t('signInRegister')}
                  <ArrowRight className={`${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} h-4 w-4`} />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
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
            <div className="md:hidden fixed inset-0 top-16 bg-teal-700 z-50 px-4 py-5 shadow-lg animate-in fade-in slide-in-from-top overflow-auto">
              <div className="flex flex-col space-y-6">
                <button onClick={() => {
                  navigate("/pricing");
                  setMobileMenuOpen(false);
                }} className="text-white py-3 text-xl font-medium">
                  {t('pricing')}
                </button>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/80">{t('features')}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg">
                        <div className="mt-1">{React.cloneElement(feature.icon, { className: "h-5 w-5" })}</div>
                        <div>
                          <h4 className="font-medium">{feature.title}</h4>
                          <p className="text-sm text-white/70">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigate(user ? "/dashboard" : "/auth");
                    setMobileMenuOpen(false);
                  }}
                  className="bg-white text-primary py-3 px-4 rounded-md font-medium mt-4 text-center"
                >
                  {user ? t('goToDashboard') : t('signInRegister')}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Combined Hero and Effortless Section */}
        <section className="container mx-auto pt-8 pb-20 md:py-16 px-4 md:px-6 lg:px-10 text-center relative">
          <h1 className="text-3xl md:text-5xl font-bold mb-5 leading-tight max-w-2xl mx-auto">
            {t('heroTitle')}
          </h1>
          <p className="text-base md:text-lg mb-8 text-white/90 max-w-xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="relative z-[1]">
            <button 
              onClick={() => navigate("/auth")}
              className="inline-flex items-center px-5 py-3 md:px-7 md:py-4 text-base md:text-lg bg-[#FF3B9A] hover:bg-[#FF3B9A]/90 text-white rounded-md font-medium transition-colors cursor-pointer shadow-lg"
            >
              {t('startFreeTrial')}
              <ArrowRight className={`${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} h-4 w-4`} />
            </button>
          </div>
        </section>

        {/* Diagonal cut that spans both sections */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-white"
            style={{
              clipPath: 'polygon(0% 95%, 100% 45%, 100% 100%, 0% 100%)'
            }}
          />
        </div>
      </div>

      {/* Effortless Section Content */}
      <section className="pt-0 -mt-24 sm:-mt-32 md:-mt-45 px-4 md:px-6 lg:px-10 bg-transparent relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className={`order-2 ${direction === 'rtl' ? 'md:order-2' : 'md:order-1'} md:pl-12`}>
              <div className="hidden md:inline-block mb-4">
                <img src="/lovable-uploads/icon-recept (1).png" alt="Icon" className="w-16 h-16 md:w-24 md:h-24" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-teal-600">
                {t('effortlessTitle')}
              </h2>
              <p className="text-gray-600 mb-6 text-xs md:text-sm">
                {t('effortlessDesc')}
              </p>

              <p className="text-gray-600 mb-6 text-xs md:text-sm">This optical software offers:</p>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">{t('clientManagementDesc')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">{t('inventoryControlDesc')}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Simplified Billing - Create and manage receipts, invoices, and track payments efficiently</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Prescription Management - Easily record and track patient prescriptions and changes over time</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Statistics - Comprehensive analytics and reporting on your business performance</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">Access Control - Manage user permissions and control access to sensitive data</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">And so much more!</span>
                </li>
              </ul>

              <Button size="lg" className="bg-[#FF3B9A] text-white hover:bg-[#FF3B9A]/90 px-6 py-4 text-sm">
                Learn more
              </Button>
            </div>

            <div className={`relative order-1 ${direction === 'rtl' ? 'md:order-1' : 'md:order-2'} md:scale-[1.32] mt-8 md:mt-0`}>
              <div className="rounded-xl overflow-hidden shadow-2xl transform -rotate-6">
                <img 
                  src="/lovable-uploads/2e06dd1e-f886-4184-8b53-def6765f32d3.png" 
                  alt="Lensly software interface" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -z-10 -bottom-6 -right-6 w-32 h-32 md:w-64 md:h-64 bg-primary/10 rounded-full"></div>
              <div className="absolute -z-10 -top-6 -left-6 w-24 h-24 md:w-48 md:h-48 bg-primary/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-10 md:py-20 px-4 md:px-6 lg:px-10 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">{t('powerfulFeatures')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg">{t('featuresSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 text-primary flex items-center justify-center rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-20 px-4 md:px-6 lg:px-10 bg-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t('ctaTitle')}</h2>
          <p className="text-base md:text-xl mb-6 md:mb-10 max-w-2xl mx-auto text-white/90">
            {t('ctaDesc')}
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center px-6 py-4 md:px-8 md:py-6 text-base md:text-lg bg-white hover:bg-white/90 text-primary rounded-md font-medium transition-colors"
          >
            {t('freeTrialCta')}
            <ArrowRight className={`${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} h-5 w-5`} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 md:py-12 px-4 md:px-6 lg:px-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-base md:text-lg font-semibold mb-4">Lensly</h3>
              <p className="text-xs md:text-sm">The comprehensive management solution designed specifically for opticians in Morocco and across Africa.</p>
            </div>
            <div>
              <h4 className="text-white text-sm md:text-base font-medium mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li><button onClick={() => navigate("/")} className="w-full text-left text-xs md:text-sm text-gray-300 hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => navigate("/pricing")} className="w-full text-left text-xs md:text-sm text-gray-300 hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate("/auth")} className="w-full text-left text-xs md:text-sm text-gray-300 hover:text-white transition-colors">Sign In</button></li>
                <li><button onClick={() => navigate("/auth")} className="w-full text-left text-xs md:text-sm text-gray-300 hover:text-white transition-colors">Register</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm md:text-base font-medium mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs md:text-sm">
                  <Mail className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span>support@lensly.com</span>
                </li>
                <li className="flex items-center gap-2 text-xs md:text-sm">
                  <Phone className="h-3 w-3 md:h-4 md:w-4" /> 
                  <span>+1-234-567-8900</span>
                </li>
              </ul>
              {/* Language switcher in footer */}
              <div className="mt-4">
                <div className="z-20">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 md:mt-10 pt-4 md:pt-6 text-xs md:text-sm text-center text-gray-500">
            <p>© {new Date().getFullYear()} Lensly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
