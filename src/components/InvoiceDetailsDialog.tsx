
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import { Invoice } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { FileText, Calendar, Phone, MapPin, DollarSign, Edit, Trash2, User, Eye } from 'lucide-react';

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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <FileText className="h-6 w-6 text-blue-600" />
              {t('invoiceDetails') || 'Invoice Details'} - {invoice.invoice_number}
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
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(invoice.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete') || 'Delete'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice & Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('invoiceAndClientDetails') || 'Invoice & Client Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('invoiceNumber') || 'Invoice Number'}</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('status') || 'Status'}</p>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('clientName') || 'Client Name'}</p>
                  <p className="font-medium">{invoice.client_name}</p>
                </div>
                {invoice.client_phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('clientPhone') || 'Client Phone'}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{invoice.client_phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {invoice.client_assurance && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('clientAssurance') || 'Client Assurance'}</p>
                  <p className="font-medium">{invoice.client_assurance}</p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('invoiceDate') || 'Invoice Date'}</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                {invoice.due_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('dueDate') || 'Due Date'}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('notes') || 'Notes'}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{invoice.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Information */}
          {(invoice.right_eye_sph || invoice.right_eye_cyl || invoice.right_eye_axe || 
            invoice.left_eye_sph || invoice.left_eye_cyl || invoice.left_eye_axe || 
            invoice.add_value) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('prescription') || 'Prescription'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('rightEye') || 'Right Eye'}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">SPH</p>
                        <p className="font-medium">{invoice.right_eye_sph || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">CYL</p>
                        <p className="font-medium">{invoice.right_eye_cyl || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">AXE</p>
                        <p className="font-medium">{invoice.right_eye_axe || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{t('leftEye') || 'Left Eye'}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">SPH</p>
                        <p className="font-medium">{invoice.left_eye_sph || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">CYL</p>
                        <p className="font-medium">{invoice.left_eye_cyl || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">AXE</p>
                        <p className="font-medium">{invoice.left_eye_axe || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {invoice.add_value && (
                  <div className="mt-6 w-1/3">
                    <p className="text-sm text-gray-600">{t('add') || 'ADD'}</p>
                    <p className="font-medium">{invoice.add_value}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('items') || 'Items'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.invoice_items?.map((item, index) => (
                  <Card key={item.id || index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4">
                          <p className="font-medium">{item.product_name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-sm text-gray-600">{t('quantity') || 'Quantity'}</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div className="col-span-3 text-center">
                          <p className="text-sm text-gray-600">{t('unitPrice') || 'Unit Price'}</p>
                          <p className="font-medium">{item.unit_price.toFixed(2)} DH</p>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className="text-sm text-gray-600">{t('total') || 'Total'}</p>
                          <p className="font-medium text-blue-600">{item.total_price.toFixed(2)} DH</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('subtotal') || 'Subtotal'}:</span>
                    <span className="font-medium">{invoice.subtotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">{t('total') || 'Total'}:</span>
                    <span className="font-bold text-blue-600">{invoice.total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Assurance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('paymentAndAssuranceDetails') || 'Payment & Assurance Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-3">{t('paymentSummary') || 'Payment Summary'}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('itemsTotal') || 'Items Total'}:</span>
                    <span className="font-medium">{invoice.subtotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('assuranceTotal') || 'Assurance Total'}:</span>
                    <span className="font-medium text-green-600">{invoice.tax_amount.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('advancePayment') || 'Advance Payment'}:</span>
                    <span className="font-medium">{invoice.advance_payment?.toFixed(2) || '0.00'} DH</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg">
                    <span className="font-bold">{t('balanceDue') || 'Balance Due'}:</span>
                    <span className="font-bold text-blue-600">{invoice.balance?.toFixed(2) || '0.00'} DH</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsDialog;
