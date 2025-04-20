
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReceiptDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  receipt: any // We'll type this properly in a moment
}

const ReceiptDetailsDialog = ({ isOpen, onClose, receipt }: ReceiptDetailsDialogProps) => {
  if (!receipt) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Client Information</h3>
              <p>Name: {receipt.client_name}</p>
              <p>Phone: {receipt.client_phone}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Payment Details</h3>
              <p>Subtotal: {receipt.subtotal.toFixed(2)} DH</p>
              <p>Tax: {receipt.tax.toFixed(2)} DH</p>
              {receipt.discount_amount && (
                <p>Discount: {receipt.discount_amount.toFixed(2)} DH</p>
              )}
              <p className="font-bold mt-2">Total: {receipt.total.toFixed(2)} DH</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Delivery Status</p>
                <p>{receipt.delivery_status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montage Status</p>
                <p>{receipt.montage_status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance</p>
                <p>{receipt.balance.toFixed(2)} DH</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Prescription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Right Eye</p>
                <p>SPH: {receipt.right_eye_sph || 'N/A'}</p>
                <p>CYL: {receipt.right_eye_cyl || 'N/A'}</p>
                <p>AXE: {receipt.right_eye_axe || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Left Eye</p>
                <p>SPH: {receipt.left_eye_sph || 'N/A'}</p>
                <p>CYL: {receipt.left_eye_cyl || 'N/A'}</p>
                <p>AXE: {receipt.left_eye_axe || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptDetailsDialog
