import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTitle from '@/components/PageTitle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

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
  
  const renderSubscriptionPlans = () => {
    // Always render subscription plans
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="border-2 hover:border-optics-500 transition-all">
          <CardHeader>
            <CardTitle className="text-center">Monthly</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-3xl font-bold">150 DH</p>
            <p className="text-gray-500 mt-2">Monthly subscription</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>✓ Full access to all features</li>
              <li>✓ Monthly billing</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button 
              onClick={() => updateSubscription('Monthly', true)}
              className="bg-optics-600 hover:bg-optics-700 w-full"
            >
              Subscribe Now
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-2 border-optics-600 hover:border-optics-700 transition-all">
          <CardHeader className="bg-optics-50">
            <CardTitle className="text-center">Quarterly</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-3xl font-bold">400 DH</p>
            <p className="text-gray-500 mt-2">Quarterly subscription</p>
            <p className="text-xs text-green-600 mt-1">Save 11% vs monthly</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>✓ Full access to all features</li>
              <li>✓ Quarterly billing</li>
              <li>✓ Priority support</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button 
              onClick={() => updateSubscription('Quarterly', true)}
              className="bg-optics-600 hover:bg-optics-700 w-full"
            >
              Subscribe Now
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-2 hover:border-optics-500 transition-all">
          <CardHeader>
            <CardTitle className="text-center">Lifetime</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-3xl font-bold">1500 DH</p>
            <p className="text-gray-500 mt-2">One-time payment</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>✓ Full access to all features</li>
              <li>✓ Unlimited updates</li>
              <li>✓ No recurring payments</li>
              <li>✓ Lifetime access</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button 
              onClick={() => updateSubscription('Lifetime', false)}
              className="bg-optics-600 hover:bg-optics-700 w-full"
            >
              Buy Lifetime
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <PageTitle title="My Subscription" subtitle="Manage your subscription plan" />
      
      {isLoading ? (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p>Loading subscription information...</p>
          </CardContent>
        </Card>
      ) : !currentSubscription ? (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Subscription Found</h3>
                <p className="text-yellow-700">
                  You don't have an active subscription. Please contact an administrator to set up your account.
                </p>
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={contactAdmin}>
                Contact Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : currentSubscription.subscription_status.toLowerCase() !== 'active' && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Subscription Required</h3>
                <p className="text-yellow-700">
                  Your subscription is currently {currentSubscription.subscription_status.toLowerCase()}. 
                  Please subscribe to a plan below to gain full access to all features.
                </p>
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={contactAdmin}>
                Contact Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {currentSubscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <h3 className="text-xl font-bold mt-1">{currentSubscription.subscription_type}</h3>
                  <p className="text-sm mt-1">
                    {currentSubscription.price || SUBSCRIPTION_PRICES[currentSubscription.subscription_type]} DH
                    {currentSubscription.is_recurring ? ' / ' + 
                      (currentSubscription.subscription_type === 'Monthly' ? 'month' : 
                       currentSubscription.subscription_type === 'Quarterly' ? 'quarter' : 'year') : 
                     ' (one-time)'}
                  </p>
                </div>
                <SubscriptionBadge status={currentSubscription.subscription_status} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
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
                <div className="p-2 rounded-full bg-optics-100 text-optics-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
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
                <div className="p-2 rounded-full bg-optics-100 text-optics-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {renderSubscriptionPlans()}
      
      {currentSubscription && currentSubscription.subscription_status === 'Active' && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Auto Renewal Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {currentSubscription.is_recurring ? 
                  `Your ${currentSubscription.subscription_type} subscription will automatically renew when it expires.` :
                  `Your ${currentSubscription.subscription_type} subscription will not automatically renew.`}
              </p>
            </div>
            <Button
              variant="outline" 
              onClick={() => {
                toast({
                  title: "Feature Not Available",
                  description: "Changing auto-renewal settings is not available in this demo.",
                })
              }}
            >
              {currentSubscription.is_recurring ? 'Cancel Auto-Renewal' : 'Enable Auto-Renewal'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
