import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Menu, X, Mail, Phone } from 'lucide-react';
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

const Pricing = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isQuarterlyPlan = subscription?.subscription_status === 'Active' &&
    subscription?.subscription_type === 'Quarterly';

  const menuItems = [
    { label: t('pricing'), onClick: () => navigate("/pricing") },
    { label: t('howToUse'), onClick: () => navigate("/how-to-use") },
  ];

  const pricingPlans = [
    {
      name: t('monthly'),
      price: "150",
      currency: "DH",
      billingCycle: t('monthlySubscription'),
      features: [
        { name: t('fullAccess') },
        { name: t('monthlyBilling') },
        { name: t('prioritySupport') },
      ],
      buttonText: t('startFreeTrial'),
      popular: false,
      current: false
    },
    {
      name: t('quarterly'),
      price: "400",
      currency: "DH",
      billingCycle: t('quarterlySubscription'),
      savingsText: t('saveVsMonthly'),
      features: [
        { name: t('fullAccess') },
        { name: t('quarterlyBilling') },
        { name: t('prioritySupport') },
        { name: 'Training session' },
      ],
      buttonText: t('startFreeTrial'),
      popular: true,
      current: isQuarterlyPlan
    },
    {
      name: t('lifetime'),
      price: "1500",
      currency: "DH",
      billingCycle: t('oneTimePayment'),
      features: [
        { name: t('fullAccess') },
        { name: t('unlimitedUpdates') },
        { name: t('noRecurring') },
        { name: t('lifetimeAccess') },
      ],
      buttonText: t('purchaseNow'),
      popular: false,
      current: false
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

        {/* ───── Pricing Hero ───── */}
        <section className="pt-40 pb-16 md:pt-56 md:pb-24 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-50/50 rounded-full blur-3xl -z-10" />
          <div className="container mx-auto px-6 text-center space-y-8 max-w-4xl">
            <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-tight">
              Simple, Transparent <span className="text-teal-600">Pricing</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Choose the plan that's right for your practice. No hidden fees, no complicated contracts.
            </p>
          </div>
        </section>

        {/* ───── Pricing Plans ───── */}
        <section className="pb-24 bg-white relative">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col relative p-8 md:p-10 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.02] ${plan.popular
                    ? 'bg-gray-900 text-white shadow-2xl scale-105 z-10'
                    : 'bg-gray-50 text-gray-900 border border-gray-100'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-2 mb-8">
                    <h3 className={`text-2xl font-black ${plan.popular ? 'text-teal-400' : 'text-gray-900'}`}>{plan.name}</h3>
                    <p className={`font-bold ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.billingCycle}</p>
                  </div>

                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                    <span className="text-2xl font-bold opacity-60">{plan.currency}</span>
                  </div>

                  {plan.savingsText && (
                    <div className="inline-flex items-center bg-teal-500/10 text-teal-500 text-xs font-black px-4 py-1 rounded-full mb-8 w-fit uppercase">
                      {plan.savingsText}
                    </div>
                  )}

                  <div className="space-y-5 mb-10 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className={`mt-1 p-1 rounded-full ${plan.popular ? 'bg-teal-500/20' : 'bg-teal-100'}`}>
                          <CheckCircle className={`h-4 w-4 ${plan.popular ? 'text-teal-400' : 'text-teal-600'}`} />
                        </div>
                        <span className={`font-bold text-base ${plan.popular ? 'text-gray-300' : 'text-gray-700'}`}>{feature.name}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate("/auth")}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${plan.popular
                      ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-xl shadow-teal-500/20'
                      : 'bg-gray-900 hover:bg-black text-white'
                      }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FAQ Section ───── */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Frequently Asked <span className="text-teal-600">Questions</span></h2>
              <p className="text-xl text-gray-600 font-medium">Everything you need to know about our service.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto font-sans">
              {[
                { q: 'Can I upgrade my plan later?', a: 'Yes, you can upgrade your plan at any time. Your billing will be prorated automatically.' },
                { q: 'Is there a setup fee?', a: 'No, there are no setup fees. You only pay the subscription fee.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers.' },
                { q: 'How long is the free trial?', a: 'All our plans come with a 7-day free trial, allowing you to test all features.' }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                  <h3 className="font-black text-xl text-gray-900 tracking-tight">{faq.q}</h3>
                  <p className="text-gray-600 font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
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

export default Pricing;
