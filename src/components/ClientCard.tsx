
import React, { useState, useEffect } from "react";
import { UserCircle, ChevronDown, ChevronUp, Phone, Calendar, Edit, Trash2, Eye, Save, Star, RefreshCw, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentView, setCurrentView] = useState<'prescription' | 'history'>('prescription');

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
      className="h-[420px] w-full flex flex-col bg-gradient-to-br from-teal-50/40 to-seafoam-50/30 rounded-xl border-l-4 border-l-teal-500 border border-teal-200/60 shadow-lg hover:border-l-teal-600 hover:shadow-xl hover:shadow-teal-100/20 transition-all duration-300 overflow-hidden backdrop-blur-sm"
      data-client-id={client.id}
      data-is-edited={isEdited}
    >
      {/* Header Section - Enhanced with better spacing and visual hierarchy */}
      <div className="h-20 px-5 py-4 flex-shrink-0 bg-white/40 backdrop-blur-sm border-b border-teal-100/50">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Enhanced Avatar with better styling */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 border-2 border-teal-300 flex-shrink-0 flex items-center justify-center shadow-md">
                <span className="font-poppins font-bold text-teal-700 text-lg">{nameInitial}</span>
              </div>
              {client.store_prescription && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs">📋</span>
                </div>
              )}
              {client.need_renewal && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                  <Clock size={10} className="text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <input 
                type="text" 
                name="name"
                className="font-poppins font-semibold text-teal-800 text-lg bg-transparent border-b-2 border-transparent hover:border-teal-300 focus:border-teal-500 focus:outline-none w-full truncate transition-colors duration-200"
                value={editedClient.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Client Name"
              />
              <div className="flex items-center text-teal-600 text-sm mt-1">
                <Phone size={12} className="mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  name="phone"
                  className="font-inter bg-transparent border-b border-transparent hover:border-teal-300 focus:border-teal-500 focus:outline-none flex-1 min-w-0 transition-colors duration-200"
                  value={editedClient.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className={`${client.is_favorite ? 'text-amber-500 hover:bg-amber-50 bg-amber-50/50' : 'text-teal-400 hover:bg-teal-50'} transition-all duration-200 h-9 w-9 rounded-lg shadow-sm`}
            >
              <Star size={16} className={client.is_favorite ? 'fill-current' : ''} />
            </Button>
            {isEdited && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSaveChanges}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-red-50/50 transition-all duration-200 h-9 w-9 rounded-lg shadow-sm"
              >
                <Save size={16} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(client)}
              className="text-teal-500 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 h-9 w-9 rounded-lg shadow-sm"
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDelete}
              className="text-teal-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 h-9 w-9 rounded-lg shadow-sm"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section - Enhanced with better visual organization */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <div className="space-y-5">
          {/* Toggle between Prescription and Purchase History */}
          <div className="bg-white/60 rounded-lg p-4 border border-teal-100 shadow-sm relative overflow-hidden">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-poppins font-semibold text-teal-700 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                {currentView === 'prescription' ? 'Prescription Details' : t('purchaseHistory')}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentView('prescription')}
                  className={`h-8 w-8 rounded-full transition-all duration-200 ${
                    currentView === 'prescription' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-teal-400 hover:bg-teal-50'
                  }`}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentView('history')}
                  className={`h-8 w-8 rounded-full transition-all duration-200 ${
                    currentView === 'history' 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'text-teal-400 hover:bg-teal-50'
                  }`}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            {/* Content Container with Slide Animation */}
            <div className="relative w-full overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(${currentView === 'prescription' ? '0%' : '-100%'})` }}
              >
                {/* Prescription Details View */}
                <div className="w-full flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-poppins font-medium text-teal-700 text-xs uppercase tracking-wide">{t('rightEyeShort')}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('sph')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="right_eye_sph"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('cyl')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="right_eye_cyl"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('axe')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="right_eye_axe"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                      <h4 className="font-poppins font-medium text-teal-700 text-xs uppercase tracking-wide">{t('leftEyeShort')}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('sph')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="left_eye_sph"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('cyl')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="left_eye_cyl"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                          <span className="text-xs text-teal-600 font-inter block mb-1">{t('axe')}</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            name="left_eye_axe"
                            className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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

                  {/* Enhanced ADD field */}
                  <div className="flex justify-center mt-4 pt-3 border-t border-teal-100">
                    <div className="w-28">
                      <span className="text-xs text-teal-600 font-inter text-center block mb-1 font-medium">{t('add') || 'ADD'}</span>
                      <input 
                        type="text"
                        inputMode="decimal"
                        name="add"
                        className="text-sm font-inter border border-teal-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 text-center hover:border-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all duration-200"
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
                </div>

                {/* Purchase History View */}
                <div className="w-full flex-shrink-0 pl-4">
                  {client.receipts && client.receipts.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {client.receipts
                        .filter(receipt => !receipt.is_deleted)
                        .slice(0, expanded ? undefined : 3)
                        .map(receipt => (
                        <div key={receipt.id} className="text-sm p-3 bg-white/80 rounded-lg border border-teal-200 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => handleViewReceipt(receipt)}>
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-poppins font-medium text-teal-800">Receipt #{receipt.id.substring(0, 8)}</div>
                              <div className="text-xs text-teal-600 font-inter flex items-center gap-2">
                                <Calendar size={10} />
                                {receipt.created_at 
                                  ? format(new Date(receipt.created_at), 'MMM d, yyyy') 
                                  : 'Unknown date'}
                              </div>
                              {receipt.total && (
                                <div className="text-xs text-emerald-600 font-medium mt-1">
                                  {receipt.total.toFixed(2)} DH
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {receipt.payment_status && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  receipt.payment_status === 'Paid' 
                                    ? 'bg-green-100 text-green-700'
                                    : receipt.payment_status === 'Partially Paid'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {receipt.payment_status === 'Paid' ? t('paid') : 
                                   receipt.payment_status === 'Partially Paid' ? t('partiallyPaid') : 
                                   t('unpaid')}
                                </span>
                              )}
                              {receipt.balance && receipt.balance > 0 && (
                                <div className="text-xs text-red-600 font-medium">
                                  Balance: {receipt.balance.toFixed(2)} DH
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!expanded && client.receipts.filter(receipt => !receipt.is_deleted).length > 3 && (
                        <div className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleExpanded}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs"
                          >
                            +{client.receipts.filter(receipt => !receipt.is_deleted).length - 3} more receipts
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-teal-500 font-inter">{t('noPurchaseHistory')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Renewal Information */}
          {(client.need_renewal || isEdited) && (
            <div className="bg-white/60 rounded-lg p-4 border border-amber-200 shadow-sm">
              <h3 className="font-poppins font-semibold text-amber-700 text-sm mb-3 flex items-center gap-2">
                <Clock size={14} />
                {t('renewalInformation')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-amber-600 font-inter block mb-1">{t('renewalDate')}</span>
                  <input 
                    type="date"
                    name="renewal_date"
                    className="text-sm font-inter border border-amber-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-amber-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                    value={editedClient.renewal_date || ""}
                    onChange={(e) => handleFieldChange('renewal_date', e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-xs text-amber-600 font-inter block mb-1">{t('needRenewalField')}</span>
                  <div className="flex items-center justify-center h-9">
                    <input 
                      type="checkbox"
                      name="need_renewal"
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 scale-110"
                      checked={editedClient.need_renewal || false}
                      onChange={(e) => handleFieldChange('need_renewal', e.target.checked)}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-600 font-inter block mb-1">{t('renewalTimes')}</span>
                  <input 
                    type="number"
                    name="renewal_times"
                    min="0"
                    className="text-sm font-inter border border-amber-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-amber-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                    value={editedClient.renewal_times || 0}
                    onChange={(e) => handleFieldChange('renewal_times', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              {/* Enhanced Prescription Information */}
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-100">
                <div>
                  <span className="text-xs text-amber-600 font-inter block mb-2">{t('storePrescription')}</span>
                  <div className="flex items-center h-9">
                    <input 
                      type="checkbox"
                      name="store_prescription"
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 scale-110"
                      checked={editedClient.store_prescription || false}
                      onChange={(e) => handleFieldChange('store_prescription', e.target.checked)}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-600 font-inter block mb-1">{t('opticianPrescribedBy')}</span>
                  <input 
                    type="text"
                    name="optician_prescribed_by"
                    className="text-sm font-inter border border-amber-200 bg-white/60 rounded-md px-3 py-2 w-full h-9 hover:border-amber-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                    value={editedClient.optician_prescribed_by || ""}
                    onChange={(e) => handleFieldChange('optician_prescribed_by', e.target.value)}
                    placeholder={t('enterOpticianName')}
                  />
                </div>
              </div>
            </div>
          )}

          
        </div>
      </div>

      {/* Enhanced Footer Section */}
      <div className="h-16 bg-white/50 backdrop-blur-sm border-t-2 border-teal-100 px-5 py-3 flex-shrink-0">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center text-xs text-teal-600 font-inter">
            <Calendar size={12} className="mr-2" />
            <span>{t('addedOn')} {formattedDate}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {client.need_renewal && (
              <Button
                onClick={handleRenewal}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-poppins font-medium px-3 py-1 h-8 text-xs rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('renewNow')}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleExpanded}
              className="text-teal-500 hover:text-teal-600 hover:bg-teal-50 p-1 h-8 w-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
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
