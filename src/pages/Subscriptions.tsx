import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Phone, CreditCard, Copy } from 'lucide-react';
import BankTransferDialog from '@/components/BankTransferDialog';
import ContactSubscriptionDialog from '@/components/ContactSubscriptionDialog';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { CreditCard as CardIcon } from 'lucide-react'; // avoid conflict

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
  const { user, subscription: userSubscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Use subscription data from AuthProvider instead of making separate API call
  const currentSubscription = userSubscription;
  const isLoading = false; // AuthProvider handles loading state

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

      // If adding an ID property or Price property is an issue, they come from the Supabase record directly, not the UserSubscription subset
      const { error } = await supabase
        .from('subscriptions')
        .update({
          subscription_type: type,
          is_recurring: isRecurring,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          subscription_status: 'Active',
          trial_used: true,
          price: SUBSCRIPTION_PRICES[type as keyof typeof SUBSCRIPTION_PRICES]
        })
        .eq('user_id', user.id); // Update by user_id since we don't have id on UserSubscription

      if (error) throw error;

      toast({
        title: t('subscriptionUpdated'),
        description: `${t('nowSubscribedTo')} ${type} ${t('plan')}`,
      });

      // Refresh subscription data in AuthProvider
      await refreshSubscription(true);

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
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);

  const renderSubscriptionPlans = () => {
    return (
      <>
        <BankTransferDialog
          isOpen={bankTransferDialogOpen}
          onClose={() => setBankTransferDialogOpen(false)}
        />

        <ContactSubscriptionDialog
          isOpen={contactDialogOpen}
          onClose={() => setContactDialogOpen(false)}
        />


        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {['Monthly', 'Quarterly', 'Lifetime'].map((type) => (
            <motion.div
              key={type}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`
              relative overflow-hidden h-full transition-all duration-500 rounded-[32px] border-2
              ${currentSubscription?.subscription_type === type ?
                  'border-teal-500 shadow-2xl shadow-teal-500/20 bg-white' :
                  'border-transparent hover:border-teal-200 shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-xl hover:bg-white'
                }
            `}>

                {/* Limited Offer Badge */}
                <div className="absolute -right-12 top-6 rotate-[45deg] bg-gradient-to-r from-red-500 to-rose-600 shadow-md text-white px-12 py-1.5 text-xs font-black tracking-widest uppercase">
                  {t('limitedOffer')}
                </div>
                <CardHeader className={`
                ${type === 'Quarterly' ? 'bg-gradient-to-br from-teal-50/50 via-teal-100/30 to-transparent' : ''}
                ${currentSubscription?.subscription_type === type ? 'bg-teal-50/50' : ''}
                pb-6 pt-8 px-8
              `}>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                        {type === 'Monthly' ? t('monthly') :
                          type === 'Quarterly' ? t('quarterly') :
                            type === 'Lifetime' ? t('lifetime') : type}
                      </CardTitle>
                      <p className="text-sm font-medium text-slate-500 mt-2">
                        {type === 'Lifetime' ? t('oneTimePayment') :
                          type === 'Monthly' ? t('billedMonthly') :
                            type === 'Quarterly' ? t('billedQuarterly') : `Billed ${type.toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">
                        {SUBSCRIPTION_PRICES[type as keyof typeof SUBSCRIPTION_PRICES]}
                      </span>
                      <span className="ml-2 text-lg font-bold text-slate-400">DH</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 px-8">
                  <ul className="space-y-4">
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
                      <li key={index} className="flex items-center gap-3 text-sm font-medium">
                        <div className="h-6 w-6 rounded-full bg-teal-100/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Check className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-8 pb-8 px-8 flex flex-col gap-3">
                  <Button
                    onClick={() => setContactDialogOpen(true)}
                    disabled={currentSubscription?.subscription_type === type}
                    className={`
                    w-full h-14 rounded-2xl font-black transition-all shadow-lg active:scale-95 uppercase tracking-widest text-[11px]
                    ${type === 'Quarterly' ?
                        'bg-teal-600 hover:bg-teal-700 shadow-teal-500/25' :
                        'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}
                  `}
                  >
                    {currentSubscription?.subscription_type === type ?
                      t('currentPlan') :
                      t('upgradeYourPlanToday')}
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
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 w-full max-w-none">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('subscriptions')}</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your plan and billing</p>
        </div>
      </div>

      {!isLoading && currentSubscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('currentPlan')}</p>
                  <h3 className="text-2xl font-black mt-1 text-slate-900 tracking-tight">{currentSubscription.subscription_type}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {(currentSubscription as any).price || SUBSCRIPTION_PRICES[currentSubscription.subscription_type as keyof typeof SUBSCRIPTION_PRICES]} DH
                    {currentSubscription.is_recurring ?
                      ` / ${currentSubscription.subscription_type.toLowerCase()}` :
                      ` (${t('oneTimePayment')})`}
                  </p>
                </div>
                <SubscriptionBadge status={currentSubscription.subscription_status} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('startDate')}</p>
                  <h3 className="text-2xl font-black mt-1 text-slate-900 tracking-tight">
                    {currentSubscription.start_date ?
                      new Date(currentSubscription.start_date).toLocaleDateString() :
                      t('notStarted')}
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100/50 text-teal-600 shadow-inner">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-slate-200/60 shadow-lg shadow-slate-200/40 rounded-3xl hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('expirationDate')}</p>
                  <h3 className="text-2xl font-black mt-1 text-slate-900 tracking-tight">
                    {currentSubscription.subscription_type === 'Lifetime' ?
                      t('never') :
                      currentSubscription.end_date ?
                        new Date(currentSubscription.end_date).toLocaleDateString() :
                        t('notSet')}
                  </h3>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100/50 text-teal-600 shadow-inner">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {renderSubscriptionPlans()}
    </div>
  );
};

export default Subscriptions;