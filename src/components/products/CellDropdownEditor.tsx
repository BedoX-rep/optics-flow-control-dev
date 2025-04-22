
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";

interface Props {
  value: string | null | undefined;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}

const CellDropdownEditor: React.FC<Props> = ({
  value,
  options,
  placeholder,
  disabled,
  onChange,
}) => {
  const [isCustom, setIsCustom] = useState(value === null || (value && !options.includes(value)));
  const [customValue, setCustomValue] = useState(
    value && !options.includes(value) ? value : ""
  );

  const handleSelect = (v: string) => {
    if (v === "__custom__") {
      setIsCustom(true);
      setCustomValue("");
      onChange(null); // Erase value until confirmed
    } else {
      setIsCustom(false);
      setCustomValue("");
      onChange(v);
    }
  };

  const handleCustomApply = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setIsCustom(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2 w-full">
      {!isCustom ? (
        <Select
          value={value && options.includes(value) ? value : ""}
          onValueChange={handleSelect}
          disabled={disabled}
        >
          <SelectTrigger className="w-full h-8 bg-[#fafafa] border border-neutral-300 rounded text-xs font-medium px-2">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            {options.map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
            <SelectItem value="__custom__">Custom</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 w-full">
          <Input
            autoFocus
            className="h-8 w-[100px] border border-black/10 rounded text-xs px-2 py-1 bg-[#fafafa] focus:ring-2 focus:ring-black"
            value={customValue}
            placeholder={`Enter custom ${placeholder.toLowerCase()}`}
            disabled={disabled}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCustomApply();
              if (e.key === "Escape") {
                setIsCustom(false);
                setCustomValue("");
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleCustomApply}
            className="h-7 w-7 px-0 py-0 ml-1"
            disabled={disabled || !customValue.trim()}
            tabIndex={0}
            aria-label="Save custom value"
          >
            <Check size={15} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsCustom(false);
              setCustomValue("");
            }}
            className="h-7 w-7 px-0 py-0"
            aria-label="Cancel"
            tabIndex={0}
          >
            <X size={15} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CellDropdownEditor;
