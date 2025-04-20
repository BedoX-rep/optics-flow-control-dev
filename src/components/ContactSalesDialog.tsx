
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"

interface ContactSalesDialogProps {
  isOpen: boolean
  onClose: () => void
}

const ContactSalesDialog = ({ isOpen, onClose }: ContactSalesDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Sales</DialogTitle>
          <DialogDescription>
            Please contact our sales team to subscribe to a plan.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Phone className="h-12 w-12 text-optics-600" />
          <p className="text-lg font-semibold">+212 627026249</p>
          <Button onClick={onClose} className="mt-2">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContactSalesDialog
