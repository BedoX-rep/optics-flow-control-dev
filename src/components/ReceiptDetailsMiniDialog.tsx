
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Printer, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { format } from "date-fns";

interface ReceiptDetailsMiniDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any;
  onEdit: (receipt: any) => void;
  onDelete: (receipt: any) => void;
}

const ReceiptDetailsMiniDialog = ({ 
  isOpen, 
  onClose, 
  receipt, 
  onEdit,
  onDelete 
}: ReceiptDetailsMiniDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!receipt) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(receipt);
      onClose();
    } catch (error) {
      console.error("Error deleting receipt:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-teal-600" />
            Receipt Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p>{formatDate(receipt.created_at)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
              <Badge variant="outline" className={getPaymentStatusColor(receipt.payment_status)}>
                {receipt.payment_status || "Unpaid"}
              </Badge>
            </div>
          </div>

          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Prescription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Right Eye</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">SPH:</span> {receipt.right_eye_sph || "–"}
                  </div>
                  <div>
                    <span className="text-gray-500">CYL:</span> {receipt.right_eye_cyl || "–"}
                  </div>
                  <div>
                    <span className="text-gray-500">AXE:</span> {receipt.right_eye_axe || "–"}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Left Eye</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">SPH:</span> {receipt.left_eye_sph || "–"}
                  </div>
                  <div>
                    <span className="text-gray-500">CYL:</span> {receipt.left_eye_cyl || "–"}
                  </div>
                  <div>
                    <span className="text-gray-500">AXE:</span> {receipt.left_eye_axe || "–"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Financial Details</h3>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div>
                <span className="text-gray-500">Total:</span> {receipt.total?.toFixed(2) || "0.00"} DH
              </div>
              <div>
                <span className="text-gray-500">Advance Payment:</span> {receipt.advance_payment?.toFixed(2) || "0.00"} DH
              </div>
              <div>
                <span className="text-gray-500">Balance:</span> {receipt.balance?.toFixed(2) || "0.00"} DH
              </div>
              {receipt.discount_amount > 0 && (
                <div>
                  <span className="text-gray-500">Discount:</span> {receipt.discount_amount.toFixed(2)} DH
                </div>
              )}
            </div>
          </div>
          
          <Separator />

          {receipt.receipt_items && receipt.receipt_items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Items</h3>
              <div className="max-h-60 overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.receipt_items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.custom_item_name || "Item"}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price?.toFixed(2)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none" 
              onClick={() => onEdit(receipt)}
            >
              <Edit size={16} className="mr-1" /> Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1 sm:flex-none" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} className="mr-1" /> Delete
            </Button>
          </div>
          <Button variant="default" className="bg-teal-600 hover:bg-teal-700">
            <Printer size={16} className="mr-1" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDetailsMiniDialog;
