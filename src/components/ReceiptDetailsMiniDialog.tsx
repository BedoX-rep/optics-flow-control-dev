import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { format } from "date-fns";
import { useLanguage } from "./LanguageProvider";

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
  const { t } = useLanguage();
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

  const getStatusColor = (type: string, status: string) => {
    switch (type) {
      case 'payment':
        return status === 'Paid' ? 'bg-green-100 text-green-800' :
               status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
               'bg-red-100 text-red-800';
      case 'delivery':
        return status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
               'bg-yellow-100 text-yellow-800';
      case 'montage':
        return status === 'Ready' ? 'bg-emerald-100 text-emerald-800' :
               status === 'Ordered' ? 'bg-blue-100 text-blue-800' :
               status === 'InStore' ? 'bg-orange-100 text-orange-800' :
               status === 'InCutting' ? 'bg-amber-100 text-amber-800' :
               'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-teal-600" />
            <div className="flex flex-col">
              <span className="text-base font-medium">{receipt.clients?.name || receipt.client_name}</span>
              <span className="text-sm text-gray-500">{receipt.clients?.phone || receipt.client_phone}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p>{formatDate(receipt.created_at)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="flex flex-col gap-1.5 mt-1">
                <Badge variant="outline" className={getStatusColor('payment', receipt.payment_status)}>
                  {t('paymentStatus')} {receipt.payment_status === 'Paid' ? t('paid') : 
                   receipt.payment_status === 'Partially Paid' ? t('partial') : t('unpaid')}
                </Badge>
                <Badge variant="outline" className={getStatusColor('delivery', receipt.delivery_status)}>
                  {t('deliveryLabel')} {receipt.delivery_status === 'Completed' ? t('completed') : t('undelivered')}
                </Badge>
                <Badge variant="outline" className={getStatusColor('montage', receipt.montage_status)}>
                  {t('montageLabel')} {receipt.montage_status === 'UnOrdered' ? t('unOrdered') :
                   receipt.montage_status === 'Ordered' ? t('ordered') :
                   receipt.montage_status === 'InStore' ? t('inStore') :
                   receipt.montage_status === 'InCutting' ? t('inCutting') :
                   receipt.montage_status === 'Ready' ? t('ready') :
                   receipt.montage_status === 'Paid costs' ? t('paidCosts') : receipt.montage_status || t('unOrdered')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('orderType')}</span>
            <p>{receipt.order_type || t('unspecified')}</p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">{t('prescription')}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{t('rightEyeLabel')}</p>
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
                  <p className="text-xs text-gray-500">{t('leftEyeLabel')}</p>
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
              {(receipt.add_value || receipt.Add || receipt.clients?.Add) && (
                <div className="text-sm">
                  <span className="text-gray-500">{t('add') || 'ADD'}:</span> {receipt.add_value || receipt.Add || receipt.clients?.Add}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">{t('financialDetails')}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">{t('subtotal')} <span className="font-medium">{receipt.subtotal?.toFixed(2) || "0.00"} DH</span></p>
                {receipt.tax > 0 && (
                  <>
                    <p className="text-sm text-gray-600">{t('taxBaseAmount')} <span className="font-medium">{receipt.tax_base?.toFixed(2) || "0.00"} DH</span></p>
                    <p className="text-sm text-gray-600">{t('tax')}: <span className="font-medium">{receipt.tax?.toFixed(2) || "0.00"} DH</span></p>
                  </>
                )}
                {(Number(receipt.discount_percentage || 0) > 0 || Number(receipt.discount_amount || 0) > 0 || Number(receipt.total_discount || 0) > 0) && (
                  <p className="text-sm text-gray-600">
                    {t('totalDiscountLabel')}
                    {Number(receipt.discount_percentage || 0) > 0 && <> ({receipt.discount_percentage}%)</>}
                    {Number(receipt.discount_amount || 0) > 0 && Number(receipt.discount_percentage || 0) > 0 && " + "}
                    {Number(receipt.discount_amount || 0) > 0 && `${receipt.discount_amount} DH`}: 
                    <span className="font-medium text-red-600"> -{Number(receipt.total_discount || 0).toFixed(2)} DH</span>
                  </p>
                )}
                <p className="text-sm font-medium">{t('total')}: <span className="text-primary">{receipt.total.toFixed(2)} DH</span></p>
                <p className="text-sm text-gray-600">{t('advancePayment')}: <span className="font-medium">{receipt.advance_payment?.toFixed(2) || "0.00"} DH</span></p>
                <p className="text-sm text-gray-600">{t('balanceLabel')} <span className="font-medium">{(receipt.total - (receipt.advance_payment || 0)).toFixed(2)} DH</span></p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">{t('productsCost')} <span className="font-medium">{Number(receipt.products_cost || 0).toFixed(2)} DH</span></p>
                <p className="text-sm text-gray-600">{t('montageCosts')}: <span className="font-medium">{Number(receipt.montage_costs || 0).toFixed(2)} DH</span></p>
                <p className="text-sm text-gray-600">{t('totalCostTTC')} <span className="font-medium text-gray-800">{Number(receipt.cost_ttc || 0).toFixed(2)} DH</span></p>
                <p className="text-sm text-gray-600">{t('profitLabel')} <span className="font-medium text-green-600">{(Number(receipt.total || 0) - Number(receipt.cost_ttc || 0)).toFixed(2)} DH</span></p>
              </div>
            </div>
          </div>

          <Separator />

          {receipt.receipt_items && receipt.receipt_items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t('items')}</h3>
              <div className="max-h-60 overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('item')}</TableHead>
                      <TableHead className="text-right">{t('qty')}</TableHead>
                      <TableHead className="text-right">{t('price')}</TableHead>
                      <TableHead className="text-right">{t('cost')}</TableHead>
                      <TableHead className="text-right">{t('profit')}</TableHead>
                      <TableHead className="text-right">{t('total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.receipt_items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.custom_item_name || item.product?.name || t('item')}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price?.toFixed(2)} DH</TableCell>
                        <TableCell className="text-right">{item.cost?.toFixed(2)} DH</TableCell>
                        <TableCell className="text-right">{((item.price - (item.cost || 0)) * item.quantity).toFixed(2)} DH</TableCell>
                        <TableCell className="text-right">{(item.quantity * item.price).toFixed(2)} DH</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(receipt)}
          >
            <Edit size={16} className="mr-1" /> {t('edit')}
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} className="mr-1" /> {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDetailsMiniDialog;