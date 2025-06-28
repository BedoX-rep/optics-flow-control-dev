
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Phone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageProvider';

interface ContactSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactSubscriptionDialog = ({ isOpen, onClose }: ContactSubscriptionDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const phoneNumber = "0627026249";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast({
        title: t('copied') || "Copié",
        description: t('phoneNumberCopied') || "Numéro de téléphone copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: t('error') || "Erreur",
        description: t('failedToCopy') || "Impossible de copier le numéro",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-teal-600" />
            {t('contactForSubscription') || "Contactez pour l'abonnement"}
          </DialogTitle>
          <DialogDescription>
            {t('contactSubscriptionDesc') || "Pour procéder à la mise à jour de votre abonnement, veuillez nous contacter au numéro ci-dessous."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <p className="text-sm text-gray-600 mb-2">
              {t('phoneNumber') || "Numéro de téléphone:"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-teal-800">{phoneNumber}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {t('copy') || "Copier"}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            {t('subscriptionContactNote') || "Notre équipe vous assistera dans le processus de mise à jour de votre abonnement et répondra à toutes vos questions."}
          </p>
          
          <Button onClick={onClose} className="w-full">
            {t('understood') || "Compris"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSubscriptionDialog;
