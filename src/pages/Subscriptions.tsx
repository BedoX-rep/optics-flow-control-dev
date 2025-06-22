import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Phone, CreditCard, Copy } from 'lucide-react';
import BankTransferDialog from '@/components/BankTransferDialog';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
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
  Monthly: 100,
  Quarterly: 300,
  Lifetime: 1000
};

const Subscriptions = () => {
  const { user, subscription: userSubscription } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: currentSubscription, isLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    enabled: !!user,
    onError: (error) => {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const contactAdmin = () => {
    toast({
      title: t('contactRequestSent'),
      description: t('adminWillContact'),
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
        title: t('subscriptionUpdated'),
        description: `${t('nowSubscribedTo')} ${type} ${t('plan')}`,
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
        title: t('error'),
        description: t('failedToUpdateSubscription'),
        variant: "destructive",
      });
    }
  };




const [bankTransferDialogOpen, setBankTransferDialogOpen] = React.useState(false);

const renderSubscriptionPlans = () => {
  return (
    <>
      <BankTransferDialog 
        isOpen={bankTransferDialogOpen}
        onClose={() => setBankTransferDialogOpen(false)}
      />
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['Monthly', 'Quarterly', 'Lifetime'].map((type) => (
          <motion.div
            key={type}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`
              relative overflow-hidden h-full transition-all duration-300
              ${currentSubscription?.subscription_type === type ? 
                'border-2 border-teal-500 shadow-xl' : 
                'hover:shadow-lg hover:border-teal-300'
              }
            `}>
              {type === 'Quarterly' && (
                <div className="absolute -right-12 top-6 rotate-45 bg-teal-500 text-white px-12 py-1 text-sm">
                  {t('popular')}
                </div>
              )}
              {/* Limited Offer Badge */}
              <div className="absolute -left-12 top-6 rotate-[-45deg] bg-red-500 text-white px-12 py-1 text-sm font-bold">
                {t('limitedOffer')}
              </div>
              <CardHeader className={`
                ${type === 'Quarterly' ? 'bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-50' : ''}
                ${currentSubscription?.subscription_type === type ? 'bg-teal-50' : ''}
                pb-4
              `}>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">{type}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type === 'Lifetime' ? t('oneTimePayment') : 
                       type === 'Monthly' ? t('billedMonthly') : 
                       type === 'Quarterly' ? t('billedQuarterly') : `Billed ${type.toLowerCase()}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {SUBSCRIPTION_PRICES[type as keyof typeof SUBSCRIPTION_PRICES]}
                    </span>
                    <span className="ml-1 text-gray-600">DH</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    t('clientManagementSystem'),
                    t('receiptGeneration'),
                    t('productInventory'),
                    t('salesAnalytics'),
                    t('prescriptionManagement'),
                    type === 'Quarterly' && t('prioritySupport'),
                    type === 'Lifetime' && t('lifetimeUpdates'),
                    type === 'Lifetime' && t('noRecurringPayments')
                  ].filter(Boolean).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-teal-600" />
                      </div>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6 flex flex-col gap-3">
                <Button 
                  onClick={() => setBankTransferDialogOpen(true)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-teal-200 hover:bg-teal-50 h-11"
                >
                  <Phone className="h-4 w-4" />
                  {t('payViaBankTransfer')}
                </Button>

                <Button 
                  onClick={() => updateSubscription(type as any, type !== 'Lifetime')}
                  disabled={currentSubscription?.subscription_type === type}
                  className={`
                    w-full h-11 ${type === 'Quarterly' ? 
                    'bg-teal-600 hover:bg-teal-700' : 
                    'bg-gray-800 hover:bg-gray-900'}
                  `}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {currentSubscription?.subscription_type === type ? 
                    t('currentPlan') : 
                    t('payWithCardPayPal')}
                </Button>
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
        {!isLoading && currentSubscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t('currentPlan')}</p>
                    <h3 className="text-xl font-bold mt-1">{currentSubscription.subscription_type}</h3>
                    <p className="text-sm mt-1">
                      {currentSubscription.price || SUBSCRIPTION_PRICES[currentSubscription.subscription_type]} DH
                      {currentSubscription.is_recurring ? 
                        ` / ${currentSubscription.subscription_type.toLowerCase()}` : 
                        ` (${t('oneTimePayment')})`}
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
                    <p className="text-sm text-gray-500">{t('startDate')}</p>
                    <h3 className="text-xl font-bold mt-1">
                      {currentSubscription.start_date ? 
                        new Date(currentSubscription.start_date).toLocaleDateString() : 
                        t('notStarted')}
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
                    <p className="text-sm text-gray-500">{t('expirationDate')}</p>
                    <h3 className="text-xl font-bold mt-1">
                      {currentSubscription.subscription_type === 'Lifetime' ? 
                        t('never') : 
                        currentSubscription.end_date ? 
                          new Date(currentSubscription.end_date).toLocaleDateString() : 
                          t('notSet')}
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