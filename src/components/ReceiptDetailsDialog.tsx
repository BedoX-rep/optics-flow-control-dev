
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Printer, User, Phone, Receipt } from "lucide-react"

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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5 text-primary" />
            Receipt Details
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50/80 p-4 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1 text-gray-900">Client Information</h3>
                  <p className="text-sm text-gray-600">Name: <span className="font-medium">{receipt.client_name}</span></p>
                  <p className="text-sm text-gray-600">Phone: <span className="font-medium">{receipt.client_phone}</span></p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/80 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1 text-gray-900">Payment Details</h3>
                  <p className="text-sm text-gray-600">Subtotal: <span className="font-medium">{receipt.subtotal?.toFixed(2) || '0.00'} DH</span></p>
                  {receipt.tax > 0 && (
                    <p className="text-sm text-gray-600">Tax: <span className="font-medium">{receipt.tax?.toFixed(2) || '0.00'} DH</span></p>
                  )}
                  {receipt.discount_amount > 0 && (
                    <p className="text-sm text-gray-600">Discount: <span className="font-medium">{receipt.discount_amount.toFixed(2)} DH</span></p>
                  )}
                  <p className="text-sm text-gray-800 font-medium mt-1.5">Total: <span className="text-primary">{receipt.total.toFixed(2)} DH</span></p>
                  <p className="text-sm text-gray-600 mt-2">Cost TTC: <span className="font-medium">{receipt.cost_ttc?.toFixed(2) || '0.00'} DH</span></p>
                  <p className="text-sm text-gray-600">Profit: <span className="font-medium">{(receipt.total - (receipt.cost_ttc || 0)).toFixed(2)} DH</span></p>
                  <p className="text-sm text-gray-600">Advance Payment: <span className="font-medium">{receipt.advance_payment?.toFixed(2) || '0.00'} DH</span></p>
                  <p className="text-sm text-gray-600">Balance: <span className="font-medium">{(receipt.total - (receipt.advance_payment || 0)).toFixed(2)} DH</span></p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-gray-900">Status Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  receipt.delivery_status === 'Completed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {receipt.delivery_status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Montage Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  receipt.montage_status === 'Completed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {receipt.montage_status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  receipt.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                  receipt.payment_status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {receipt.payment_status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-gray-900">Prescription</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <p className="font-medium text-gray-800 mb-2">Right Eye</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">SPH</p>
                    <p className="font-medium">{receipt.right_eye_sph || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CYL</p>
                    <p className="font-medium">{receipt.right_eye_cyl || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">AXE</p>
                    <p className="font-medium">{receipt.right_eye_axe || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <p className="font-medium text-gray-800 mb-2">Left Eye</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">SPH</p>
                    <p className="font-medium">{receipt.left_eye_sph || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CYL</p>
                    <p className="font-medium">{receipt.left_eye_cyl || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">AXE</p>
                    <p className="font-medium">{receipt.left_eye_axe || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-500">ADD</p>
                <p className="font-medium">{receipt.add || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/80 p-4 rounded-lg mt-4">
            <h3 className="font-medium mb-3 text-gray-900">Receipt Items</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || item.custom_item_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">{Number(item.price).toFixed(2)} DH</TableCell>
                      <TableCell className="text-right">{Number(item.cost).toFixed(2)} DH</TableCell>
                      <TableCell className="text-right">{(Number(item.price) * item.quantity).toFixed(2)} DH</TableCell>
                      <TableCell className="text-right">{((Number(item.price) * item.quantity) - (Number(item.cost) * item.quantity)).toFixed(2)} DH</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button className="primary-gradient text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptDetailsDialog

