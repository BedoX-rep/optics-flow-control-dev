
import React, { useState, useEffect } from "react";
import { UserCircle, ChevronDown, ChevronUp, Phone, Calendar, Edit, Trash2, Eye, Save, Star, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import ReceiptDetailsMiniDialog from "./ReceiptDetailsMiniDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from './LanguageProvider';

interface Receipt {
  id: string;
  created_at: string;
  right_eye_sph?: number;
  right_eye_cyl?: number;
  right_eye_axe?: number;
  left_eye_sph?: number;
  left_eye_cyl?: number;
  left_eye_axe?: number;
  total?: number;
  advance_payment?: number;
  balance?: number;
  payment_status?: string;
  receipt_items?: Array<any>;
  discount_amount?: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  is_favorite?: boolean;
  right_eye_sph?: number | null;
  right_eye_cyl?: number | null;
  right_eye_axe?: number | null;
  left_eye_sph?: number | null;
  left_eye_cyl?: number | null;
  left_eye_axe?: number | null;
  Add?: number | null;
  receipts?: Receipt[];
  renewal_date?: string | null;
  need_renewal?: boolean;
  renewal_times?: number | null;
  store_prescription?: boolean;
  optician_prescribed_by?: string | null;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRefresh: () => void;
}

export const ClientCard = ({ client, onEdit, onDelete, onRefresh }: ClientCardProps) => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>({...client});
  const [isEdited, setIsEdited] = useState(false);

  // Reset edited client when client changes
  useEffect(() => {
    setEditedClient({...client});
    setIsEdited(false);
  }, [client]);

  // Get the latest receipt if available
  const latestReceipt = client.receipts && client.receipts.length > 0 
    ? client.receipts[0] 
    : null;

  // Format the date
  const formattedDate = client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : '';

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Get first letter of name for avatar
  const nameInitial = editedClient.name ? editedClient.name.charAt(0).toUpperCase() : '?';

  // Toggle favorite status
  const toggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_favorite: !client.is_favorite })
        .eq('id', client.id);

      if (error) throw error;

      // Invalidate clients query to refresh the list
      await queryClient.invalidateQueries(['clients']);
      toast.success(client.is_favorite ? t('removedFromFavorites') : t('addedToFavorites'));
    } catch (error: any) {
      toast.error("Failed to update favorite status");
    }
  };

  const handleViewReceipt = async (receipt: Receipt) => {
    try {
      const { data: fullReceipt, error } = await supabase
        .from('receipts')
        .select(`
          *,
          clients (
            name,
            phone
          ),
          receipt_items (
            id,
            quantity,
            price,
            cost,
            profit,
            custom_item_name,
            product:product_id (
              name
            )
          )
        `)
        .eq('id', receipt.id)
        .single();

      if (error) throw error;
      setSelectedReceipt(fullReceipt);
      setIsReceiptDialogOpen(true);
    } catch (error) {
      console.error('Error fetching receipt details:', error);
      toast.error('Failed to load receipt details');
    }
  };

  const handleEditReceipt = (receipt: Receipt) => {
    toast.info("Receipt edit functionality to be implemented");
    setIsReceiptDialogOpen(false);
  };

  const handleDeleteReceipt = async (receipt: Receipt) => {
    try {
      const { data: updatedReceipt, error } = await supabase
        .from('receipts')
        .update({ is_deleted: true })
        .eq('id', receipt.id)
        .select(`
          *,
          clients (
            name,
            phone
          ),
          receipt_items (
            id,
            quantity,
            price,
            cost,
            profit,
            custom_item_name,
            product:product_id (
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      if (selectedReceipt?.id === receipt.id) {
        setSelectedReceipt(updatedReceipt);
      }

      toast.success("Receipt deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt");
    }
  };

  // Update field value in editing mode
  const handleFieldChange = (field: keyof Client, value: any) => {
    setEditedClient(prev => {
      const updated = { ...prev, [field]: value };
      setIsEdited(JSON.stringify(updated) !== JSON.stringify(client));
      return updated;
    });
  };

  // Save all edited fields
  const handleSaveChanges = async () => {
    try {
      const convertToNumber = (value: any) => {
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "number") return value;
        const stringValue = String(value).replace(',', '.');
        const numValue = parseFloat(stringValue);
        return isNaN(numValue) ? null : numValue;
      };

      const { error } = await supabase
        .from('clients')
        .update({
          name: editedClient.name,
          phone: editedClient.phone,
          right_eye_sph: convertToNumber(editedClient.right_eye_sph),
          right_eye_cyl: convertToNumber(editedClient.right_eye_cyl),
          right_eye_axe: convertToNumber(editedClient.right_eye_axe),
          left_eye_sph: convertToNumber(editedClient.left_eye_sph),
          left_eye_cyl: convertToNumber(editedClient.left_eye_cyl),
          left_eye_axe: convertToNumber(editedClient.left_eye_axe),
          Add: convertToNumber(editedClient.Add),
          renewal_date: editedClient.renewal_date,
          need_renewal: editedClient.need_renewal,
          renewal_times: editedClient.renewal_times,
          store_prescription: editedClient.store_prescription,
          optician_prescribed_by: editedClient.optician_prescribed_by || null
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success("Client updated successfully");
      setIsEdited(false);
      await queryClient.invalidateQueries(['clients']);
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  const handleDelete = () => {
    onDelete(client);
  };

  const handleRenewal = async () => {
    try {
      if (!client.need_renewal) {
        toast.error('Client does not need renewal')
        return
      }

      const today = new Date()
      const newRenewalDate = new Date(today)
      newRenewalDate.setMonth(newRenewalDate.getMonth() + 18)

      const { error } = await supabase
        .from('clients')
        .update({ 
          need_renewal: false,
          renewal_times: (client.renewal_times || 0) + 1,
          renewal_date: newRenewalDate.toISOString().split('T')[0]
        })
        .eq('id', client.id)

      if (error) {
        console.error('Error updating client:', error)
        throw error
      }

      toast.success(`Client renewed successfully! Next renewal: ${newRenewalDate.toISOString().split('T')[0]}`)
      await queryClient.invalidateQueries(['clients']);
    } catch (error) {
      console.error('Error renewing client:', error)
      toast.error('Failed to renew client');
    }
  }

  return (
    <div 
      className="h-[420px] w-full flex flex-col bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 rounded-lg border-l-4 border-l-teal-500 border border-teal-200 shadow-sm hover:border-l-teal-600 hover:shadow-lg transition-all duration-200 overflow-hidden"
      data-client-id={client.id}
      data-is-edited={isEdited}
    >
      {/* Header Section - Fixed Height */}
      <div className="h-20 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-full bg-teal-100 border-2 border-teal-300 flex-shrink-0 flex items-center justify-center relative">
              <span className="font-poppins font-semibold text-teal-700 text-lg">{nameInitial}</span>
              {client.store_prescription && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                  <span className="text-xs">📋</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input 
                type="text" 
                name="name"
                className="font-poppins font-semibold text-teal-800 text-lg bg-transparent border-b border-transparent hover:border-teal-300 focus:border-teal-500 focus:outline-none w-full truncate"
                value={editedClient.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <div className="flex items-center text-teal-600 text-sm mt-1">
                <Phone size={12} className="mr-1 flex-shrink-0" />
                <input 
                  type="text" 
                  name="phone"
                  className="font-inter bg-transparent border-b border-transparent hover:border-teal-300 focus:border-teal-500 focus:outline-none flex-1 min-w-0"
                  value={editedClient.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className={`${client.is_favorite ? 'text-amber-500 hover:bg-amber-50' : 'text-teal-400 hover:bg-teal-50'} transition-colors h-8 w-8`}
            >
              <Star size={16} className={client.is_favorite ? 'fill-current' : ''} />
            </Button>
            {isEdited && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSaveChanges}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors h-8 w-8"
              >
                <Save size={16} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(client)}
              className="text-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-colors h-8 w-8"
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="text-teal-400 hover:text-red-600 hover:bg-red-50 transition-colors h-8 w-8"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section - Flexible */}
      <div className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Prescription Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <h3 className="font-poppins font-medium text-teal-700 text-sm">{t('rightEyeShort')}</h3>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('sph')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="right_eye_sph"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.right_eye_sph !== undefined && editedClient.right_eye_sph !== null ? editedClient.right_eye_sph : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^-?\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('right_eye_sph', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('cyl')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="right_eye_cyl"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.right_eye_cyl !== undefined && editedClient.right_eye_cyl !== null ? editedClient.right_eye_cyl : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^-?\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('right_eye_cyl', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('axe')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="right_eye_axe"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.right_eye_axe !== undefined && editedClient.right_eye_axe !== null ? editedClient.right_eye_axe : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('right_eye_axe', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-poppins font-medium text-teal-700 text-sm">{t('leftEyeShort')}</h3>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('sph')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="left_eye_sph"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.left_eye_sph !== undefined && editedClient.left_eye_sph !== null ? editedClient.left_eye_sph : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^-?\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('left_eye_sph', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('cyl')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="left_eye_cyl"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.left_eye_cyl !== undefined && editedClient.left_eye_cyl !== null ? editedClient.left_eye_cyl : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^-?\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('left_eye_cyl', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('axe')}</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    name="left_eye_axe"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.left_eye_axe !== undefined && editedClient.left_eye_axe !== null ? editedClient.left_eye_axe : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || /^\d*[.,]?\d*$/.test(inputValue)) {
                        handleFieldChange('left_eye_axe', inputValue === "" ? null : inputValue);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ADD field */}
          <div className="flex justify-center">
            <div className="w-24">
              <span className="text-xs text-teal-600 font-inter text-center block">{t('add') || 'ADD'}</span>
              <input 
                type="text"
                inputMode="decimal"
                name="add"
                className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 text-center hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                value={editedClient.Add !== undefined && editedClient.Add !== null ? editedClient.Add : ""}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === "" || /^\d*[.,]?\d*$/.test(inputValue)) {
                    handleFieldChange('Add', inputValue === "" ? null : inputValue);
                  }
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Renewal Information */}
          {(client.need_renewal || isEdited) && (
            <div className="pt-3 border-t-2 border-teal-100 space-y-3">
              <h3 className="font-poppins font-medium text-teal-700 text-sm text-center">{t('renewalInformation')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('renewalDate')}</span>
                  <input 
                    type="date"
                    name="renewal_date"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.renewal_date || ""}
                    onChange={(e) => handleFieldChange('renewal_date', e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('needRenewalField')}</span>
                  <div className="flex items-center justify-center h-8">
                    <input 
                      type="checkbox"
                      name="need_renewal"
                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                      checked={editedClient.need_renewal || false}
                      onChange={(e) => handleFieldChange('need_renewal', e.target.checked)}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('renewalTimes')}</span>
                  <input 
                    type="number"
                    name="renewal_times"
                    min="0"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.renewal_times || 0}
                    onChange={(e) => handleFieldChange('renewal_times', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              {/* Prescription Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('storePrescription')}</span>
                  <div className="flex items-center h-8">
                    <input 
                      type="checkbox"
                      name="store_prescription"
                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                      checked={editedClient.store_prescription || false}
                      onChange={(e) => handleFieldChange('store_prescription', e.target.checked)}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-teal-600 font-inter">{t('opticianPrescribedBy')}</span>
                  <input 
                    type="text"
                    name="optician_prescribed_by"
                    className="text-sm font-inter border border-teal-200 bg-teal-50/30 rounded px-2 py-1 w-full h-8 hover:border-teal-400 focus:border-teal-500 focus:outline-none transition-colors"
                    value={editedClient.optician_prescribed_by || ""}
                    onChange={(e) => handleFieldChange('optician_prescribed_by', e.target.value)}
                    placeholder={t('enterOpticianName')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Purchase History (when expanded) */}
          {expanded && (
            <div className="pt-3 border-t-2 border-teal-100">
              <h4 className="font-poppins font-medium text-teal-700 text-xs uppercase mb-2">{t('purchaseHistory')}</h4>
              {client.receipts && client.receipts.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {client.receipts
                    .filter(receipt => !receipt.is_deleted)
                    .map(receipt => (
                    <div key={receipt.id} className="text-sm p-2 bg-white/60 rounded border border-teal-200 flex justify-between items-center">
                      <div>
                        <div className="font-poppins font-medium text-teal-800">Receipt #{receipt.id.substring(0, 8)}</div>
                        <div className="text-xs text-teal-600 font-inter">{receipt.created_at 
                          ? format(new Date(receipt.created_at), 'MMM d, yyyy') 
                          : 'Unknown date'}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full text-teal-600 hover:bg-teal-50"
                        onClick={() => handleViewReceipt(receipt)}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-teal-500 font-inter">{t('noPurchaseHistory')}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Section - Fixed Height */}
      <div className="h-16 bg-white/50 border-t-2 border-teal-100 px-4 py-2 flex-shrink-0">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center text-xs text-teal-600 font-inter">
            <Calendar size={12} className="mr-1" />
            <span>{t('addedOn')} {formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {client.need_renewal && (
              <Button
                onClick={handleRenewal}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-poppins font-medium px-3 py-1 h-8 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('renewNow')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleExpanded}
              className="text-teal-500 hover:text-teal-600 hover:bg-teal-50 p-1 h-8 w-8"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>
      </div>

      <ReceiptDetailsMiniDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        receipt={selectedReceipt}
        onEdit={(receipt) => {
          handleEditReceipt(receipt);
          setIsReceiptDialogOpen(false);
        }}
        onDelete={(receipt) => {
          handleDeleteReceipt(receipt);
          setIsReceiptDialogOpen(false);
        }}
      />
    </div>
  );
};
