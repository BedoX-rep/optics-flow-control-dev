
import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface StockCellEditorProps {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
}

const StockCellEditor: React.FC<StockCellEditorProps> = ({ 
  value, 
  onIncrease, 
  onDecrease, 
  disabled = false 
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDecrease}
        disabled={disabled || value <= 0}
        className="h-6 w-6 p-1"
      >
        <Minus size={16} />
      </Button>
      <span 
        className={`text-sm font-medium ${value === 0 ? 'text-red-600' : 'text-neutral-700'}`}
      >
        {value === 0 ? 'Out of stock' : value}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onIncrease}
        disabled={disabled}
        className="h-6 w-6 p-1"
      >
        <Plus size={16} />
      </Button>
    </div>
  );
};

export default StockCellEditor;
