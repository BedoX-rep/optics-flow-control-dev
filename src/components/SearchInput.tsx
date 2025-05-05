
import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = ({ value, onChange, placeholder = "Search..." }: SearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={`relative transition-all duration-200 rounded-full ${isFocused ? "shadow-md" : "shadow-sm"} bg-white`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Search size={18} />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="pl-10 h-11 rounded-full border border-gray-200 focus-visible:ring-teal-400 focus-visible:ring-offset-0 transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
