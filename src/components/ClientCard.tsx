
import React, { useState, useEffect } from "react";
import { UserCircle, ChevronDown, ChevronUp, Phone, Calendar, Edit, Trash2, Eye, Save } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import ReceiptDetailsMiniDialog from "./ReceiptDetailsMiniDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  is_deleted?: boolean;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  right_eye_sph?: number | null;
  right_eye_cyl?: number | null;
  right_eye_axe?: number | null;
  left_eye_sph?: number | null;
  left_eye_cyl?: number | null;
  left_eye_axe?: number | null;
  Add?: number | null;
  receipts?: Receipt[];
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRefresh: () => void;
}

export const ClientCard = ({ client, onEdit, onDelete, onRefresh }: ClientCardProps) => {
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
  
  // Generate a color based on the name - now only green variations
  const getColor = () => {
    return 'bg-green-50 text-green-700 border-green-200';
  };

  const cardColor = getColor();
  const avatarColor = getColor();

  const handleViewReceipt = async (receipt: Receipt) => {
    try {
      // Get full receipt details with items
      const { data, error } = await supabase
        .from('receipts')
        .select('*, receipt_items(*)')
        .eq('id', receipt.id)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw error;
      
      setSelectedReceipt(data);
      setIsReceiptDialogOpen(true);
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error("Failed to load receipt details");
    }
  };

  const handleEditReceipt = (receipt: Receipt) => {
    // In a real app, you would navigate to or open a dialog for editing the receipt
    toast.info("Receipt edit functionality to be implemented");
    setIsReceiptDialogOpen(false);
  };

  const handleDeleteReceipt = async (receipt: Receipt) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .update({ is_deleted: true })
        .eq('id', receipt.id);
      
      if (error) throw error;
      
      toast.success("Receipt deleted successfully");
      onRefresh(); // Refresh the client list to update the UI
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
      const { error } = await supabase
        .from('clients')
        .update({
          name: editedClient.name,
          phone: editedClient.phone,
          right_eye_sph: editedClient.right_eye_sph,
          right_eye_cyl: editedClient.right_eye_cyl,
          right_eye_axe: editedClient.right_eye_axe,
          left_eye_sph: editedClient.left_eye_sph,
          left_eye_cyl: editedClient.left_eye_cyl,
          left_eye_axe: editedClient.left_eye_axe,
          Add: editedClient.Add
        })
        .eq('id', client.id);
        
      if (error) throw error;
      
      toast.success("Client updated successfully");
      setIsEdited(false);
      onRefresh(); // Refresh client list
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    }
  };

  return (
    <div className={`rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${cardColor}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarColor}`}>
              {nameInitial}
            </div>
            <div>
              <div className="flex items-center">
                <input 
                  type="text" 
                  className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none"
                  value={editedClient.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </div>
              <div className="flex items-center text-gray-500 text-sm">
                <Phone size={14} className="mr-1" />
                <input 
                  type="text" 
                  className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none"
                  value={editedClient.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEdited && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveChanges}
                className="text-green-600 hover:text-green-800 hover:bg-green-50 transition-colors"
              >
                <Save size={16} />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(client)}
              className="text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              <Edit size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(client)}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        {/* Editable prescription data */}
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Right Eye</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">SPH</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.right_eye_sph !== undefined && editedClient.right_eye_sph !== null ? editedClient.right_eye_sph : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseFloat(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('right_eye_sph', value);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">CYL</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.right_eye_cyl !== undefined && editedClient.right_eye_cyl !== null ? editedClient.right_eye_cyl : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseFloat(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('right_eye_cyl', value);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">AXE</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.right_eye_axe !== undefined && editedClient.right_eye_axe !== null ? editedClient.right_eye_axe : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseInt(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('right_eye_axe', value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Left Eye</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">SPH</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.left_eye_sph !== undefined && editedClient.left_eye_sph !== null ? editedClient.left_eye_sph : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseFloat(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('left_eye_sph', value);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">CYL</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.left_eye_cyl !== undefined && editedClient.left_eye_cyl !== null ? editedClient.left_eye_cyl : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseFloat(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('left_eye_cyl', value);
                    }
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">AXE</span>
                <input 
                  type="text"
                  className="text-sm font-medium border rounded px-1 py-0.5 w-full"
                  value={editedClient.left_eye_axe !== undefined && editedClient.left_eye_axe !== null ? editedClient.left_eye_axe : ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? null : parseInt(e.target.value);
                    if (e.target.value === "" || !isNaN(value as number)) {
                      handleFieldChange('left_eye_axe', value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white bg-opacity-30 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={14} className="mr-1" />
          <span>Added on {formattedDate}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="text-gray-500 hover:text-green-600 p-1 h-auto"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      {expanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 animate-accordion-down">
          <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Purchase History</h4>
          {client.receipts && client.receipts.length > 0 ? (
            <div className="space-y-2">
              {client.receipts
                .filter(receipt => !receipt.is_deleted)
                .map(receipt => (
                <div key={receipt.id} className="text-sm p-2 bg-white rounded border border-gray-100 flex justify-between items-center">
                  <div>
                    <div className="font-medium">Receipt #{receipt.id.substring(0, 8)}</div>
                    <div className="text-xs text-gray-500">{receipt.created_at 
                      ? format(new Date(receipt.created_at), 'MMM d, yyyy') 
                      : 'Unknown date'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full text-green-600 hover:bg-green-50"
                      onClick={() => handleViewReceipt(receipt)}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No purchase history available</p>
          )}
        </div>
      )}
      
      <ReceiptDetailsMiniDialog 
        isOpen={isReceiptDialogOpen} 
        onClose={() => setIsReceiptDialogOpen(false)} 
        receipt={selectedReceipt} 
        onEdit={handleEditReceipt} 
        onDelete={handleDeleteReceipt} 
      />
    </div>
  );
};
