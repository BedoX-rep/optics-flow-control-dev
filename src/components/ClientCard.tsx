
import React, { useState } from "react";
import { UserCircle, ChevronDown, ChevronUp, Phone, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { EyePrescriptionDisplay } from "./EyePrescriptionDisplay";

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  receipts?: Array<{
    id: string;
    right_eye_sph?: number;
    right_eye_cyl?: number;
    right_eye_axe?: number;
    left_eye_sph?: number;
    left_eye_cyl?: number;
    left_eye_axe?: number;
  }>;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export const ClientCard = ({ client, onEdit, onDelete }: ClientCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
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
  const nameInitial = client.name ? client.name.charAt(0).toUpperCase() : '?';
  
  // Generate a color based on the name
  const getColor = (name: string) => {
    const colors = ['bg-teal-100 text-teal-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  const avatarColor = getColor(client.name);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarColor}`}>
              {nameInitial}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{client.name}</h3>
              <div className="flex items-center text-gray-500 text-sm">
                <Phone size={14} className="mr-1" />
                <span>{client.phone}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(client)}
              className="text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
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
        
        {latestReceipt && (
          <div className="mt-4 grid grid-cols-2 gap-6">
            <EyePrescriptionDisplay
              side="right"
              sph={latestReceipt.right_eye_sph}
              cyl={latestReceipt.right_eye_cyl}
              axe={latestReceipt.right_eye_axe}
            />
            <EyePrescriptionDisplay
              side="left"
              sph={latestReceipt.left_eye_sph}
              cyl={latestReceipt.left_eye_cyl}
              axe={latestReceipt.left_eye_axe}
            />
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={14} className="mr-1" />
          <span>Added on {formattedDate}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleExpanded}
          className="text-gray-500 hover:text-teal-600 p-1 h-auto"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>
      
      {expanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 animate-accordion-down">
          <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">History</h4>
          {client.receipts && client.receipts.length > 0 ? (
            <div className="space-y-2">
              {client.receipts.map(receipt => (
                <div key={receipt.id} className="text-sm p-2 bg-white rounded border border-gray-100">
                  Receipt #{receipt.id.substring(0, 8)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No purchase history available</p>
          )}
        </div>
      )}
    </div>
  );
};
