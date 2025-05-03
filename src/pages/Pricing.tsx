
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import PageTitle from '@/components/PageTitle';

interface PricingPlan {
  name: string;
  price: string;
  billingCycle: string;
  description: string;
  features: Array<{
    name: string;
    detail?: string;
  }>;
  buttonText: string;
  buttonVariant: "default" | "outline";
  popular?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: "Basic",
    price: "20",
    billingCycle: "/month",
    description: "Essential features for small optical businesses",
    features: [
      { 
        name: "Client Management", 
        detail: "Store and manage up to 100 client records with basic information" 
      },
      { 
        name: "Basic Inventory Tracking", 
        detail: "Track up to 200 products in your inventory" 
      },
      { 
        name: "Simple Receipts", 
        detail: "Generate basic receipts for your clients" 
      },
      { 
        name: "1 User Account", 
        detail: "Single user access to the system" 
      }
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline"
  },
  {
    name: "Professional",
    price: "49",
    billingCycle: "/month",
    description: "Complete solution for growing businesses",
    features: [
      { 
        name: "Unlimited Client Records", 
        detail: "Store and manage unlimited client records with comprehensive information" 
      },
      { 
        name: "Advanced Inventory Management", 
        detail: "Track unlimited products with categories and detailed attributes" 
      },
      { 
        name: "Comprehensive Receipting",
        detail: "Generate detailed receipts with customization options" 
      },
      { 
        name: "Prescription Management", 
        detail: "Store and track client prescriptions with history" 
      },
      { 
        name: "5 User Accounts", 
        detail: "Multiple user access with role management" 
      }
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default",
    popular: true
  },
  {
    name: "Enterprise",
    price: "99",
    billingCycle: "/month",
    description: "Advanced features for large businesses",
    features: [
      { 
        name: "Everything in Professional", 
        detail: "All features included in the Professional plan" 
      },
      { 
        name: "Multi-location Support", 
        detail: "Manage multiple store locations from a single account" 
      },
      { 
        name: "Advanced Analytics", 
        detail: "Comprehensive business reporting and insights" 
      },
      { 
        name: "Priority Support", 
        detail: "Dedicated support channel with priority response" 
      },
      { 
        name: "Unlimited User Accounts", 
        detail: "No limit on user accounts with advanced role management" 
      }
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline"
  }
];

const Pricing = () => {
  const renderPricingFeature = (feature: { name: string; detail?: string }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <li className="flex items-center mb-2 cursor-help">
          <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
          <span>{feature.name}</span>
        </li>
      </HoverCardTrigger>
      {feature.detail && (
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{feature.detail}</p>
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0B6E63] to-[#38B2AC] py-16 px-6">
        <div className="container mx-auto text-center">
          <PageTitle title="Pricing Plans" className="text-white mb-4" />
          <p className="text-white/90 text-xl max-w-3xl mx-auto">
            Choose the perfect plan for your optical business needs
          </p>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-xl shadow-md overflow-hidden border transition-all ${
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
              
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4 flex items-baseline">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.billingCycle}</span>
                </div>
                <p className="text-gray-500 mb-6">{plan.description}</p>
                
                <Button 
                  variant={plan.buttonVariant} 
                  className="w-full mb-6"
                >
                  {plan.buttonText}
                </Button>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Features include:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index}>
                        {renderPricingFeature(feature)}
                      </div>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="container mx-auto px-6 py-16 border-t border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Can I upgrade my plan later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade your plan at any time. Your billing will be prorated for the remainder of your billing cycle.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Is there a setup fee?</h3>
            <p className="text-gray-600">
              No, there are no setup fees for any of our plans. You only pay the monthly subscription fee.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Do you offer discounts for annual billing?</h3>
            <p className="text-gray-600">
              Yes, you can save 15% by choosing annual billing on any plan. Contact our sales team for more information.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">How long is the free trial?</h3>
            <p className="text-gray-600">
              All our plans come with a 7-day free trial, allowing you to test all features before committing.
            </p>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary/5 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Try Lensly free for 7 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">Start Free Trial</Button>
            <Button variant="outline" size="lg">Contact Sales</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
