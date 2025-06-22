import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/components/AuthProvider';

const Pricing = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const { user, subscription } = useAuth();

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
      popular: true,
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

  return (
    <div className={`min-h-screen bg-gray-50 ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      {/* Navigation */}
      <div className="bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] py-4 px-4 md:px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 
            className="text-xl font-bold text-white cursor-pointer" 
            onClick={() => navigate('/')}
          >
            Lensly
          </h1>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] py-8 md:py-16 px-4 md:px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('pricingTitle')}</h1>
          <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto">
            {t('pricingSubtitle')}
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-16 -mt-6 md:-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className="transform transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`
                relative overflow-hidden h-full transition-all duration-300 bg-white rounded-lg
                ${plan.current ? 
                  'border-2 border-teal-500 shadow-xl' : 
                  'hover:shadow-lg hover:border-teal-300 border border-gray-100'
                }
              `}>
                {plan.popular && (
                  <div className="absolute -left-12 top-6 rotate-[-45deg] bg-teal-500 text-white px-12 py-1 text-sm">
                    {t('popular')}
                  </div>
                )}
                {/* Limited Offer Badge */}
                <div className="absolute -right-12 top-6 rotate-[45deg] bg-red-500 text-white px-12 py-1 text-sm font-bold z-10">
                  {t('limitedOffer')}
                </div>
                
                <div className={`
                  ${plan.popular ? 'bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-50' : ''}
                  ${plan.current ? 'bg-teal-50' : ''}
                  p-6 pb-4
                `}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.billingCycle}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="ml-1 text-gray-600">{plan.currency}</span>
                    </div>
                    {plan.savingsText && (
                      <div className="text-green-600 text-xs mt-1 font-medium">
                        {plan.savingsText}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-teal-600" />
                        </div>
                        <span className="text-gray-600">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-6 p-6 flex flex-col gap-3">
                  {plan.current ? (
                    <div className="bg-gray-200 text-center py-3 px-4 rounded-md h-11 flex items-center justify-center">
                      {t('currentPlan')}
                    </div>
                  ) : (
                    <Button 
                      variant={plan.buttonVariant} 
                      className={`w-full h-11 ${plan.popular ? 
                        'bg-teal-600 hover:bg-teal-700' : 
                        'bg-gray-800 hover:bg-gray-900'}`}
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