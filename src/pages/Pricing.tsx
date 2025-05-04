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
  const isQuarterlyPlan = subscription?.subscription_status === 'active' && 
                          subscription?.subscription_type === 'quarterly';

  const pricingPlans = [
    {
      name: t('monthly'),
      price: "150",
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
      price: "400",
      currency: "DH",
      billingCycle: t('quarterlySubscription'),
      savingsText: t('save'),
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
        <div className="grid md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border transition-all ${
                plan.popular 
                  ? "border-primary ring-2 ring-primary/10 transform md:-translate-y-4" 
                  : "border-gray-100"
              }`}
            >
              {plan.popular && (
                <div className="bg-primary text-white text-center text-sm py-1.5">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-1 flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price} {plan.currency}</span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-500 text-sm">{plan.billingCycle}</span>
                  {plan.savingsText && (
                    <div className="text-green-600 text-xs mt-1 font-medium">
                      {plan.savingsText}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 my-6 pt-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.current ? (
                  <div className="bg-gray-200 text-center py-2 px-4 mt-6 rounded-md">
                    {t('currentPlan')}
                  </div>
                ) : (
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full mt-6"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.buttonText}
                  </Button>
                )}
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
