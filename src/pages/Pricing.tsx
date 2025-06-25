
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Menu, X, ArrowRight } from 'lucide-react';
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

const Pricing = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user has a subscription and if it's the quarterly plan
  const isQuarterlyPlan = subscription?.subscription_status === 'Active' && 
                          subscription?.subscription_type === 'Quarterly';

  const pricingPlans = [
    {
      name: t('monthly'),
      price: "100",
      currency: "DH",
      billingCycle: t('monthlySubscription'),
      features: [
        { name: t('fullAccess') },
        { name: t('monthlyBilling') },
      ],
      buttonText: t('startFreeTrial'),
      buttonVariant: "outline" as const,
      current: false
    },
    {
      name: t('quarterly'),
      price: "300",
      currency: "DH",
      billingCycle: t('quarterlySubscription'),
      savingsText: t('saveVsMonthly'),
      features: [
        { name: t('fullAccess') },
        { name: t('quarterlyBilling') },
        { name: t('prioritySupport') },
      ],
      buttonText: t('startFreeTrial'),
      buttonVariant: "default" as const,
      current: isQuarterlyPlan
    },
    {
      name: t('lifetime'),
      price: "1000",
      currency: "DH",
      billingCycle: t('oneTimePayment'),
      features: [
        { name: t('fullAccess') },
        { name: t('unlimitedUpdates') },
        { name: t('noRecurring') },
        { name: t('lifetimeAccess') },
      ],
      buttonText: t('purchaseNow'),
      buttonVariant: "outline" as const,
      current: false
    }
  ];

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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('pricingTitle')}</h1>
          <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto">
            {t('pricingSubtitle')}
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 -mt-6 md:-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative transform transition-all duration-500 hover:-translate-y-3 ${
                plan.popular ? 'md:-translate-y-4' : ''
              }`}
            >
              <div className={`
                relative overflow-hidden h-full transition-all duration-500 rounded-2xl bg-white
                ${plan.current ? 
                  'ring-4 ring-teal-500/20 border-2 border-teal-500 shadow-2xl shadow-teal-500/10' : 
                  plan.popular ?
                  'ring-2 ring-teal-200 border border-teal-200 shadow-xl shadow-teal-500/5 group-hover:shadow-2xl group-hover:shadow-teal-500/10' :
                  'border border-gray-200 shadow-lg group-hover:shadow-xl group-hover:border-gray-300'
                }
              `}>
                
                
                
                {/* Header */}
                <div className={`
                  relative px-8 pt-8 pb-6
                  ${plan.popular ? 'bg-gradient-to-br from-teal-50 via-white to-teal-50/50' : 
                    plan.current ? 'bg-gradient-to-br from-teal-50 to-white' : 
                    'bg-gradient-to-br from-gray-50 to-white'
                  }
                `}>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.billingCycle}</p>
                    
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="ml-2 text-xl text-gray-600 font-medium">{plan.currency}</span>
                    </div>
                    
                    {plan.savingsText && (
                      <div className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {plan.savingsText}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Features */}
                <div className="px-8 py-6">
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`
                          mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0
                          ${plan.popular ? 'bg-teal-100' : 'bg-gray-100'}
                        `}>
                          <CheckCircle className={`h-3 w-3 ${plan.popular ? 'text-teal-600' : 'text-gray-600'}`} />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA Button */}
                <div className="px-8 pb-8 mt-auto">
                  {plan.current ? (
                    <div className={`
                      w-full py-4 px-6 rounded-xl text-center font-semibold text-sm
                      bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 border-2 border-teal-200
                    `}>
                      {t('currentPlan')}
                    </div>
                  ) : (
                    <Button 
                      className={`
                        w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105
                        ${plan.popular ? 
                          'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl' : 
                          'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white shadow-lg hover:shadow-xl'
                        }
                      `}
                      onClick={() => navigate("/auth")}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 border-t border-gray-100">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Can I upgrade my plan later?</h3>
            <p className="text-gray-600 text-sm">
              Yes, you can upgrade your plan at any time. Your billing will be prorated for the remainder of your billing cycle.
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Is there a setup fee?</h3>
            <p className="text-gray-600 text-sm">
              No, there are no setup fees for any of our plans. You only pay the subscription fee.
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600 text-sm">
              We accept all major credit cards, PayPal, and bank transfers for our subscription plans.
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 md:p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">How long is the free trial?</h3>
            <p className="text-gray-600 text-sm">
              All our plans come with a 7-day free trial, allowing you to test all features before committing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 py-8 md:py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            Try Lensly free for 7 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>Start Free Trial</Button>
            <Button variant="outline" size="lg">Contact Sales</Button>
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

export default Pricing;
