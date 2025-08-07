
import React, { useState, useEffect } from "react";
import { UserCircle, ChevronDown, ChevronUp, Phone, Calendar, Edit, Trash2, Eye, Save, Star, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
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
  pd_distance?: number | null;
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
          pd_distance: convertToNumber(editedClient.pd_distance),
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
    <Card 
      className={`h-[420px] w-full overflow-hidden transition-all duration-300 border-l-4 font-inter ${
        isEdited 
          ? 'border-l-amber-400 shadow-lg bg-gradient-to-br from-amber-50/40 to-amber-100/20 hover:shadow-xl' 
          : 'border-l-teal-500 bg-gradient-to-br from-teal-50/30 to-seafoam-50/20 hover:border-l-teal-600 hover:shadow-lg hover:from-teal-50/50 hover:to-seafoam-50/30'
      }`}
      data-client-id={client.id}
      data-is-edited={isEdited}
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-500/10 to-teal-600/10 p-4 border-b border-teal-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-poppins font-semibold text-lg">
              {nameInitial}
            </div>
            <div className="min-w-0 flex-1">
              <input 
                type="text" 
                className="text-lg font-poppins font-semibold text-teal-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                value={editedClient.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
              <div className="flex items-center text-teal-600 text-sm font-inter">
                <Phone size={12} className="mr-1" />
                <input 
                  type="text" 
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
                  value={editedClient.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className={`${client.is_favorite ? 'text-amber-500' : 'text-teal-400'} hover:text-amber-600 hover:bg-amber-50 h-8 px-3 text-xs font-inter rounded-lg`}
            >
              <Star size={14} className={client.is_favorite ? 'fill-current' : ''} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(client)}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-3 text-xs font-inter rounded-lg"
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-xs font-inter rounded-lg"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Eye Prescription Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs text-teal-700 font-poppins font-medium block">{t('rightEyeShort')}</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('sph')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('cyl')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('axe')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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

          <div className="space-y-3">
            <label className="text-xs text-teal-700 font-poppins font-medium block">{t('leftEyeShort')}</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('sph')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('cyl')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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
                <label className="text-xs text-teal-600 font-inter block mb-1">{t('axe')}</label>
                <input 
                  type="text"
                  className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
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

        {/* Add and PD Distance Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('add') || 'ADD'}</label>
            <input 
              type="text"
              className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
              value={editedClient.Add !== undefined && editedClient.Add !== null ? editedClient.Add : ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || /^\d*[.,]?\d*$/.test(inputValue)) {
                  handleFieldChange('Add', inputValue === "" ? null : inputValue);
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs text-teal-700 font-poppins font-medium block mb-1">{t('pdDistance') || 'PD Distance'}</label>
            <input 
              type="text"
              className="w-full h-8 px-2 text-xs font-inter border border-teal-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 bg-white/70"
              value={editedClient.pd_distance !== undefined && editedClient.pd_distance !== null ? editedClient.pd_distance : ""}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || /^\d*[.,]?\d*$/.test(inputValue)) {
                  handleFieldChange('pd_distance', inputValue === "" ? null : inputValue);
                }
              }}
            />
          </div>
        </div>

        {/* Additional Information */}
        {client.store_prescription && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-teal-700 font-poppins font-medium">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              {t('prescriptionStored')}
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t-2 border-teal-100 pt-4 pb-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-xs text-teal-600 font-inter">
            <Calendar size={12} className="mr-1" />
            <span>{t('addedOn')} {formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            {client.need_renewal && (
              <Button
                onClick={handleRenewal}
                size="sm"
                className="text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-500 shadow-sm h-7 px-2 text-xs font-inter rounded-lg"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('renewNow')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleExpanded}
              className="text-teal-500 hover:text-teal-700 hover:bg-teal-50 h-7 px-2 text-xs font-inter rounded-lg"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEdited && (
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9 px-3 text-xs font-poppins font-medium rounded-lg shadow-sm"
            >
              <Save size={14} className="mr-2" />
              {t('saveButton')}
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 bg-white border-t border-teal-100">
          <h4 className="text-xs font-medium uppercase text-teal-600 mb-2 font-poppins">{t('purchaseHistory')}</h4>
          {client.receipts && client.receipts.length > 0 ? (
            <div className="space-y-2">
              {client.receipts
                .filter(receipt => !receipt.is_deleted)
                .map(receipt => (
                <div key={receipt.id} className="text-sm p-2 bg-teal-50 rounded border border-teal-100 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-teal-800 font-poppins">Receipt #{receipt.id.substring(0, 8)}</div>
                    <div className="text-xs text-teal-600 font-inter">{receipt.created_at 
                      ? format(new Date(receipt.created_at), 'MMM d, yyyy') 
                      : 'Unknown date'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full text-teal-600 hover:bg-teal-100"
                      onClick={() => handleViewReceipt(receipt)}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-teal-600 font-inter">{t('noPurchaseHistory')}</p>
          )}
        </div>
      )}

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
    </Card>
  );
};
