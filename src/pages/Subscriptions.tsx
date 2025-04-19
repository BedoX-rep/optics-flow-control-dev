
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Search, Calendar } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define interfaces
interface Subscription {
  id: string;
  email: string;
  display_name: string;
  start_date: string | null;
  end_date: string | null;
  subscription_type: 'Trial' | 'Monthly' | 'Quarterly' | 'Lifetime';
  subscription_status: 'Active' | 'Suspended' | 'Cancelled' | 'inActive' | 'Expired';
  is_recurring: boolean;
  trial_used: boolean;
}

const Subscriptions = () => {
  const { user, subscription: userSubscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        
        // Only admins would be able to see all subscriptions, 
        // regular users only see their own subscription
        // For demo, we'll fetch just the user's subscription
        
        if (!user) return;
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setSubscriptions(data || []);
        refreshSubscription(); // Refresh the user's subscription status in context
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        toast({
          title: "Error",
          description: "Failed to load subscriptions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptions();
  }, [user, toast, refreshSubscription]);
  
  const filteredSubscriptions = subscriptions.filter(subscription => 
    (subscription.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || statusFilter === subscription.subscription_status) &&
    (typeFilter === 'all' || typeFilter === subscription.subscription_type)
  );

  const viewSubscriptionDetails = (id: string) => {
    // Logic to view subscription details (would open a modal in a real app)
    console.log(`View subscription details for ID: ${id}`);
  };

  // Current user subscription
  const currentSubscription = userSubscription || (subscriptions.length > 0 ? subscriptions[0] : null);

  return (
    <div>
      <PageTitle title="Subscriptions" subtitle="Manage your subscription plans" />
      
      {currentSubscription && currentSubscription.subscription_status !== 'Active' && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Subscription Required</h3>
                <p className="text-yellow-700">
                  Your subscription is currently {currentSubscription.subscription_status.toLowerCase()}. 
                  Please contact an administrator to activate your subscription and gain full access.
                </p>
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
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
                    {currentSubscription.end_date ? 
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

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Search by name or email..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="inActive">Inactive</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Trial Used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  Loading subscriptions...
                </TableCell>
              </TableRow>
            ) : filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.email}</TableCell>
                  <TableCell className="font-medium">{subscription.display_name}</TableCell>
                  <TableCell>
                    {subscription.start_date ? 
                      new Date(subscription.start_date).toLocaleDateString() : 
                      '-'}
                  </TableCell>
                  <TableCell>
                    {subscription.end_date ? 
                      new Date(subscription.end_date).toLocaleDateString() : 
                      '-'}
                  </TableCell>
                  <TableCell>{subscription.subscription_type}</TableCell>
                  <TableCell>
                    <SubscriptionBadge status={subscription.subscription_status} />
                  </TableCell>
                  <TableCell>{subscription.is_recurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{subscription.trial_used ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => viewSubscriptionDetails(subscription.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">SQL Statements for Tables</h3>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
{`-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts Table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES clients(id),
  right_eye_sph DECIMAL,
  right_eye_cyl DECIMAL,
  right_eye_axe INTEGER,
  left_eye_sph DECIMAL,
  left_eye_cyl DECIMAL,
  left_eye_axe INTEGER,
  subtotal DECIMAL NOT NULL,
  tax DECIMAL NOT NULL,
  discount_percentage DECIMAL,
  discount_amount DECIMAL,
  total DECIMAL NOT NULL,
  advance_payment DECIMAL DEFAULT 0,
  balance DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'Undelivered',
  montage_status TEXT NOT NULL DEFAULT 'UnOrdered'
);

-- Receipt Items Table
CREATE TABLE receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  receipt_id UUID REFERENCES receipts(id),
  product_id UUID REFERENCES products(id),
  custom_item_name TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Types and Status Enum
CREATE TYPE subscription_type AS ENUM ('Trial','Monthly','Quarterly','Lifetime');
CREATE TYPE subscription_status AS ENUM ('Active','Suspended','Cancelled','inActive','Expired');

-- Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  subscription_type subscription_type DEFAULT 'Trial',
  trial_used BOOLEAN DEFAULT TRUE,
  subscription_status subscription_status DEFAULT 'Active',
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Products table RLS policy
CREATE POLICY "Users can CRUD their own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Clients table RLS policy
CREATE POLICY "Users can CRUD their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Receipts table RLS policy
CREATE POLICY "Users can CRUD their own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);

-- Receipt items table RLS policy
CREATE POLICY "Users can CRUD their own receipt items" ON receipt_items
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions table RLS policy - can only read their own subscription
CREATE POLICY "Users can read their own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger to create a subscription when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, email, display_name, start_date, end_date, subscription_status)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email), NULL, NULL, 'inActive');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SQL Function to update subscription status based on dates
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_date is in the past, set status to Expired
  IF NEW.end_date < NOW() THEN
    NEW.subscription_status := 'Expired';
  END IF;
  
  -- If start_date is in the future, set status to inActive
  IF NEW.start_date > NOW() THEN
    NEW.subscription_status := 'inActive';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update subscription status when dates change
CREATE TRIGGER before_subscription_update
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_status();

-- DB Function to check subscription status periodically
CREATE OR REPLACE FUNCTION check_all_subscriptions()
RETURNS void AS $$
BEGIN
  -- Update expired subscriptions
  UPDATE subscriptions
  SET subscription_status = 'Expired'
  WHERE end_date < NOW() AND subscription_status = 'Active';
  
  -- Update newly active subscriptions
  UPDATE subscriptions
  SET subscription_status = 'Active'
  WHERE start_date <= NOW() AND end_date > NOW() AND subscription_status = 'inActive';
  
  -- Handle recurring subscriptions that are about to expire
  UPDATE subscriptions
  SET end_date = end_date + INTERVAL '1 month'
  WHERE is_recurring = TRUE AND subscription_type = 'Monthly' AND end_date <= NOW() + INTERVAL '1 day';
  
  UPDATE subscriptions
  SET end_date = end_date + INTERVAL '3 months'
  WHERE is_recurring = TRUE AND subscription_type = 'Quarterly' AND end_date <= NOW() + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up cron job to run check_all_subscriptions() every 2 minutes
SELECT cron.schedule('*/2 * * * *', $$SELECT check_all_subscriptions()$$);`}
        </pre>
      </div>
    </div>
  );
};

export default Subscriptions;
