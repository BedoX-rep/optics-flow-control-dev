import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Phone, CreditCard, RefreshCw } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

type SubscriptionStatus = 'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';

interface Subscription {
  id: string;
  email: string;
  display_name: string;
  start_date: string | null;
  end_date: string | null;
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  subscription_status: SubscriptionStatus;
  is_recurring: boolean;
  trial_used: boolean;
  price?: number;
}

const SUBSCRIPTION_PRICES = {
  Trial: 0,
  Monthly: 150,
  Quarterly: 400,
  Lifetime: 1500
};

const Subscriptions = () => {
  const { user, subscription: userSubscription } = useAuth();
  const { toast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);

      if (!user) {
        setCurrentSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setCurrentSubscription(null);
        } else {
          throw error;
        }
      } else {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const contactAdmin = () => {
    toast({
      title: "Contact Request Sent",
      description: "An administrator will contact you shortly about your subscription.",
    });
  };

  const updateSubscription = async (type: 'Monthly' | 'Quarterly' | 'Lifetime', isRecurring: boolean) => {
    try {
      if (!user || !currentSubscription) return;

      const now = new Date();
      const endDate = new Date();

      if (type === 'Monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (type === 'Quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 100);
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          subscription_type: type,
          is_recurring: isRecurring,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          subscription_status: 'Active',
          trial_used: true,
          price: SUBSCRIPTION_PRICES[type]
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      toast({
        title: "Subscription Updated",
        description: `You are now subscribed to the ${type} plan.`,
      });

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setCurrentSubscription(data);

    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    }
  };


const AutoRenewalToggle = ({ isRecurring, onToggle }: { isRecurring: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur rounded-lg shadow-sm mb-6">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-full ${isRecurring ? 'bg-teal-100' : 'bg-gray-100'}`}>
        <RefreshCw className={`h-5 w-5 ${isRecurring ? 'text-teal-600' : 'text-gray-500'}`} />
      </div>
      <div>
        <h3 className="font-medium">Auto-Renewal</h3>
        <p className="text-sm text-gray-500">{isRecurring ? 'Your subscription will renew automatically' : 'Manual renewal required'}</p>
      </div>
    </div>
    <Switch
      checked={isRecurring}
      onCheckedChange={onToggle}
      className={`${isRecurring ? 'bg-teal-600' : 'bg-gray-200'}`}
    />
  </div>
);

const renderSubscriptionPlans = () => {
  return (
    <>
      {currentSubscription && (
        <AutoRenewalToggle 
          isRecurring={currentSubscription.is_recurring || false}
          onToggle={() => updateSubscription(
            currentSubscription.subscription_type as any,
            !currentSubscription.is_recurring
          )}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['Monthly', 'Quarterly', 'Lifetime'].map((type) => (
          <motion.div
            key={type}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`
              border-2 h-full transition-all duration-300
              ${currentSubscription?.subscription_type === type ? 
                'border-teal-500 shadow-teal-200 shadow-lg' : 
                'hover:border-teal-300'
              }
            `}>
              <CardHeader className={`
                ${type === 'Quarterly' ? 'bg-gradient-to-r from-teal-50 to-teal-100' : ''}
                ${currentSubscription?.subscription_type === type ? 'bg-teal-50' : ''}
              `}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-gray-800">{type}</CardTitle>
                  {currentSubscription?.subscription_type === type && (
                    <span className="px-3 py-1 bg-teal-500 text-white text-sm rounded-full">
                      Current Plan
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <p className="text-4xl font-bold text-gray-900">
                    {SUBSCRIPTION_PRICES[type as keyof typeof SUBSCRIPTION_PRICES]} DH
                  </p>
                  <p className="text-gray-500 mt-2">
                    {type === 'Lifetime' ? 'One-time payment' : `${type.toLowerCase()} billing`}
                  </p>
                </div>
                <ul className="space-y-4">
                  {[
                    'Client Management System',
'Receipt Generation',
'Product Inventory',
'Sales Analytics',
'Prescription Management',
                    type === 'Quarterly' && 'Priority support',
                    type === 'Lifetime' && 'Lifetime updates',
                    type === 'Lifetime' && 'No recurring payments'
                  ].filter(Boolean).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-teal-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={() => {
                      window.location.href = `tel:+21262706249`;
                    }}
                    variant="outline"
                    className="w-full flex items-center gap-2 border-teal-200 hover:bg-teal-50"
                  >
                    <Phone className="h-4 w-4" />
                    Pay via Bank Transfer
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Contact +212 62706249</p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={() => updateSubscription(type as any, type !== 'Lifetime')}
                    disabled={currentSubscription?.subscription_type === type}
                    className={`
                      w-full ${type === 'Quarterly' ? 
                      'bg-teal-600 hover:bg-teal-700' : 
                      'bg-gray-800 hover:bg-gray-900'}
                    `}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {currentSubscription?.subscription_type === type ? 
                      'Current Plan' : 
                      'Pay with Card/PayPal'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Secure online payment</p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageTitle 
          title="Subscription Management" 
          subtitle="Choose the plan that best fits your needs" 
        />

        {!isLoading && currentSubscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Current Plan</p>
                    <h3 className="text-xl font-bold mt-1">{currentSubscription.subscription_type}</h3>
                    <p className="text-sm mt-1">
                      {currentSubscription.price || SUBSCRIPTION_PRICES[currentSubscription.subscription_type]} DH
                      {currentSubscription.is_recurring ? 
                        ` / ${currentSubscription.subscription_type.toLowerCase()}` : 
                        ' (one-time)'}
                    </p>
                  </div>
                  <SubscriptionBadge status={currentSubscription.subscription_status} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <h3 className="text-xl font-bold mt-1">
                      {currentSubscription.start_date ? 
                        new Date(currentSubscription.start_date).toLocaleDateString() : 
                        'Not Started'}
                    </h3>
                  </div>
                  <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Expiration Date</p>
                    <h3 className="text-xl font-bold mt-1">
                      {currentSubscription.subscription_type === 'Lifetime' ? 
                        'Never' : 
                        currentSubscription.end_date ? 
                          new Date(currentSubscription.end_date).toLocaleDateString() : 
                          'Not Set'}
                    </h3>
                  </div>
                  <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {renderSubscriptionPlans()}
      </div>
    </div>
  );
};

export default Subscriptions;