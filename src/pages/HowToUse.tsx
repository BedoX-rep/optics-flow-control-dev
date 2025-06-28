
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/components/AuthProvider';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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
  FileText,
  Calculator,
  Settings,
  ChevronRight,
  Eye,
  ShoppingCart,
  CreditCard,
  BarChart3,
  UserCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  PrinterIcon,
  CheckCircle
} from 'lucide-react';

const HowToUse = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: t('clientManagement'),
      description: t('clientManagementDesc'),
    },
    {
      title: t('inventoryControl'),
      description: t('inventoryControlDesc'),
    },
    {
      title: "Simplified Billing",
      description: "Create and manage receipts, invoices, and track payments efficiently",
    },
    {
      title: "Prescription Management",
      description: "Easily record and track patient prescriptions and changes over time",
    },
    {
      title: "Statistics",
      description: "Comprehensive analytics and reporting on your business performance",
    },
    {
      title: "Access Control",
      description: "Manage user permissions and control access to sensitive data",
    }
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
    },
    {
      title: t('howToUseStep5Title'),
      description: t('howToUseStep5Desc'),
      icon: <ShoppingCart className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep5Sub1'),
        t('howToUseStep5Sub2'),
        t('howToUseStep5Sub3'),
        t('howToUseStep5Sub4')
      ]
    },
    {
      title: t('howToUseStep6Title'),
      description: t('howToUseStep6Desc'),
      icon: <BarChart3 className="h-8 w-8 text-teal-600" />,
      steps: [
        t('howToUseStep6Sub1'),
        t('howToUseStep6Sub2'),
        t('howToUseStep6Sub3'),
        t('howToUseStep6Sub4')
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      {/* Header/Navigation with Gradient Background */}
      <div className="w-full bg-gradient-to-b from-teal-600 to-teal-700 text-white relative">
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
                              <div className="text-sm font-medium leading-none">{feature.title}</div>
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
                  <NavigationMenuItem>
                    <button
                      onClick={() => navigate("/how-to-use")}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white cursor-pointer"
                    >
                      {t('howToUse')}
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
                <button onClick={() => {
                  navigate("/how-to-use");
                  setMobileMenuOpen(false);
                }} className="text-white py-3 text-xl font-medium">
                  {t('howToUse')}
                </button>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white/80">{t('features')}</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg">
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

        {/* Hero Section */}
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('howToUseTitle')}</h1>
          <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto">
            {t('howToUseSubtitle')}
          </p>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 -mt-6 md:-mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">{t('gettingStarted')}</h2>
          <p className="text-gray-600 text-lg leading-relaxed text-center mb-8">
            {t('howToUseIntro')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('quickSetup')}</h3>
              <p className="text-gray-600 text-sm">{t('quickSetupDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('easyManagement')}</h3>
              <p className="text-gray-600 text-sm">{t('easyManagementDesc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('powerfulAnalytics')}</h3>
              <p className="text-gray-600 text-sm">{t('powerfulAnalyticsDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">{t('stepByStepGuide')}</h2>
        
        <div className="space-y-8">
          {guideSteps.map((step, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 md:p-8 md:w-1/3">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
                      <span className="text-teal-600 font-bold text-xl">{index + 1}</span>
                    </div>
                    {step.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                <div className="p-6 md:p-8 md:w-2/3">
                  <h4 className="font-semibold mb-4 text-lg">{t('stepsToFollow')}:</h4>
                  <ul className="space-y-3">
                    {step.steps.map((substep, stepIndex) => (
                      <li key={stepIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{substep}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="bg-teal-50 py-8 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{t('proTips')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip1Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip1Desc')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip2Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip2Desc')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <PrinterIcon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip3Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip3Desc')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip4Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip4Desc')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip5Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip5Desc')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="font-semibold mb-2">{t('tip6Title')}</h3>
              <p className="text-gray-600 text-sm">{t('tip6Desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-8 md:py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('readyToStart')}</h2>
          <p className="text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            {t('readyToStartDesc')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>{t('startFreeTrial')}</Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/pricing")}>{t('viewPricing')}</Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 md:px-6">
        <div className="container mx-auto text-center">
          <p className="text-sm">© {new Date().getFullYear()} Lensly. All rights reserved.</p>
          <div className="mt-4 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowToUse;
