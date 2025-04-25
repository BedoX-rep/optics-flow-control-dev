
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

const Subscriptions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, subscription, refreshSubscription } = useAuth();

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  const handleActivateSubscription = async (type: string) => {
    // This is a placeholder for actual subscription activation logic
    toast({
      title: "Subscription activated",
      description: `Your ${type} subscription has been activated.`,
    });
    
    // After activation, refresh subscription data
    await refreshSubscription();
    
    // If subscription is now active, navigate to dashboard
    if (subscription?.subscription_status === "Active") {
      navigate("/dashboard");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Expired":
        return "bg-red-500";
      case "Suspended":
        return "bg-yellow-500";
      case "Cancelled":
        return "bg-gray-500";
      case "inActive":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageTitle title="Subscriptions" description="Manage your subscription" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(subscription?.subscription_status || "inActive")}>
                    {subscription?.subscription_status || "Not Subscribed"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Type:</span>
                  <span>{subscription?.subscription_type || "None"}</span>
                </div>
                {subscription?.end_date && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Expires:</span>
                    <span>{format(new Date(subscription.end_date), "PPP")}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p>Please login to view your subscription</p>
                <Button onClick={() => navigate("/auth")} className="mt-2">
                  Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Options */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Subscription</CardTitle>
            <CardDescription>$150 per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li>✓ Full access to all features</li>
              <li>✓ Monthly billing</li>
              <li>✓ Priority support</li>
            </ul>
            <Button
              onClick={() => handleActivateSubscription("monthly")}
              className="w-full"
              disabled={!user}
            >
              Activate Monthly
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quarterly Subscription</CardTitle>
            <CardDescription>$400 per quarter (Save $50)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li>✓ Full access to all features</li>
              <li>✓ Quarterly billing</li>
              <li>✓ Priority support</li>
              <li>✓ Bulk discount</li>
            </ul>
            <Button
              onClick={() => handleActivateSubscription("quarterly")}
              className="w-full"
              disabled={!user}
            >
              Activate Quarterly
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifetime Access</CardTitle>
            <CardDescription>$1500 one-time payment</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-4">
              <li>✓ Full access to all features</li>
              <li>✓ One-time payment</li>
              <li>✓ Lifetime updates</li>
              <li>✓ Premium support</li>
            </ul>
            <Button
              onClick={() => handleActivateSubscription("lifetime")}
              className="w-full"
              disabled={!user}
            >
              Activate Lifetime
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscriptions;
