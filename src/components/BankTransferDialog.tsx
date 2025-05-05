
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BankTransferDialogProps {
  isOpen: boolean
  onClose: () => void
}

const BankTransferDialog = ({ isOpen, onClose }: BankTransferDialogProps) => {
  const { toast } = useToast();
  const ribNumber = "123456789012345678901234"; // Replace with actual RIB

  const copyRib = () => {
    navigator.clipboard.writeText(ribNumber);
    toast({
      description: "RIB number copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bank Transfer Details</DialogTitle>
          <DialogDescription>
            Please use the following details for bank transfer
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div className="font-mono text-sm">{ribNumber}</div>
              <Button variant="ghost" size="icon" onClick={copyRib}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>+212 62706249</span>
          </div>
          <p className="text-sm text-muted-foreground">
            After completing the transfer, please contact us to activate your subscription.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BankTransferDialog
