
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import { Invoice } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { FileText, Calendar, Phone, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
}

const InvoiceDetailsDialog: React.FC<InvoiceDetailsDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onDelete
}) => {
  const { t } = useLanguage();

  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              {invoice.invoice_number}
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(invoice)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(invoice.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('clientInformation')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('clientName')}</p>
                  <p className="font-medium">{invoice.client_name}</p>
                </div>
                {invoice.client_phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('phone')}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{invoice.client_phone}</p>
                    </div>
                  </div>
                )}
                {invoice.client_assurance && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('clientAssurance')}</p>
                    <p className="font-medium">{invoice.client_assurance}</p>
                  </div>
                )}
                {invoice.client_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">{t('address')}</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p>{invoice.client_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Information */}
          {(invoice.right_eye_sph || invoice.right_eye_cyl || invoice.right_eye_axe || 
            invoice.left_eye_sph || invoice.left_eye_cyl || invoice.left_eye_axe || 
            invoice.add_value) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t('prescription')}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">{t('rightEye')}</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">SPH</p>
                        <p className="font-medium">{invoice.right_eye_sph || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CYL</p>
                        <p className="font-medium">{invoice.right_eye_cyl || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">AXE</p>
                        <p className="font-medium">{invoice.right_eye_axe || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">{t('leftEye')}</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">SPH</p>
                        <p className="font-medium">{invoice.left_eye_sph || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CYL</p>
                        <p className="font-medium">{invoice.left_eye_cyl || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">AXE</p>
                        <p className="font-medium">{invoice.left_eye_axe || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {invoice.add_value && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">ADD</p>
                    <p className="font-medium">{invoice.add_value}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('invoiceInformation')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('invoiceDate')}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                {invoice.due_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('dueDate')}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                )}
                {invoice.receipt && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">{t('linkedReceipt')}</p>
                    <p className="text-blue-600">#{invoice.receipt.id.slice(0, 8)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('items')}</h3>
              <div className="space-y-3">
                {invoice.invoice_items?.map((item, index) => (
                  <div key={item.id || index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4">
                        <p className="font-medium">{item.product_name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-sm text-gray-600">{t('quantity')}</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div className="col-span-3 text-center">
                        <p className="text-sm text-gray-600">{t('unitPrice')}</p>
                        <p className="font-medium">{item.unit_price.toFixed(2)} DH</p>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="text-sm text-gray-600">{t('total')}</p>
                        <p className="font-medium">{item.total_price.toFixed(2)} DH</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('subtotal')}:</span>
                  <span className="font-medium">{invoice.subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('tax')} ({invoice.tax_percentage}%):</span>
                  <span className="font-medium">{invoice.tax_amount.toFixed(2)} DH</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">{t('total')}:</span>
                  <span className="font-bold text-blue-600">{invoice.total.toFixed(2)} DH</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3">{t('notes')}</h3>
                <p className="text-gray-700">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsDialog;
