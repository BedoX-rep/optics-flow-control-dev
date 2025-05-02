
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface ReferralCodeDialogProps {
  referralCode: string | null;
}

const ReferralCodeDialog: React.FC<ReferralCodeDialogProps> = ({ referralCode }) => {
  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied to clipboard!');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Show referral code</span>
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary"></div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Referral Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Share this code with others and get benefits when they sign up using it.
          </p>
          <div className="flex items-center space-x-2">
            <Input 
              value={referralCode || 'No code available'} 
              readOnly 
              className="font-mono text-lg text-center tracking-wider"
            />
            <Button type="button" onClick={handleCopy} disabled={!referralCode}>
              Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralCodeDialog;
