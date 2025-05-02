
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';

export function ReferralButton() {
  const { subscription } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = async () => {
    if (subscription?.referral_code) {
      try {
        await navigator.clipboard.writeText(subscription.referral_code);
        toast({
          title: "Copied!",
          description: "Referral code copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy referral code",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Gift className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Referral Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Share this code with others to help them get started
          </p>
          <div className="flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.6rem] py-[0.4rem] font-mono text-lg font-semibold">
              {subscription?.referral_code || 'Loading...'}
            </code>
            <Button onClick={copyToClipboard} size="sm">
              Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
