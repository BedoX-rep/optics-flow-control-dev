
import React, { useState } from "react";
import { ChevronDown, Filter, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses", 
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories"
];
const INDEX_OPTIONS = ["1.56", "1.6", "1.67", "1.74"];
const TREATMENT_OPTIONS = ["White", "AR", "Blue", "Photochromic"];
const COMPANY_OPTIONS = ["Indo", "ABlens", "Essilor", "GLASSANDLENS", "Optifak"];

export interface ProductFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const FILTER_FIELDS = [
  { key: "company", label: "Company", options: COMPANY_OPTIONS },
  { key: "index", label: "Index", options: INDEX_OPTIONS },
  { key: "treatment", label: "Treatment", options: TREATMENT_OPTIONS },
];

const Combobox = ({ options, value, onChange, placeholder }: { 
  options: string[],
  value: string,
  onChange: (value: string) => void,
  placeholder: string
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[100px] text-xs h-8 pr-6 bg-white justify-between"
        >
          {value || placeholder}
          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={(v) => {
              setInputValue(v);
              onChange(v);
            }}
            className="h-9"
          />
          <CommandEmpty>No result found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
              >
                {option}
                {value === option && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange }) => {
  const [activeExtraFilter, setActiveExtraFilter] = useState<string | null>(null);
  const [showAddFilterList, setShowAddFilterList] = useState(false);

  function handleAddFilter(field: string) {
    setActiveExtraFilter(field);
    setShowAddFilterList(false);
  }

  function handleRemoveExtraFilter() {
    if (activeExtraFilter) {
      onChange({ ...filters, [activeExtraFilter]: "" });
    }
    setActiveExtraFilter(null);
  }

  function handleFilterChange(key: string, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
      <Combobox
        options={CATEGORY_OPTIONS}
        value={filters.category || ""}
        onChange={(v) => handleFilterChange("category", v)}
        placeholder="Category"
      />

      {!activeExtraFilter && (
        <div className="relative">
          <Button
            type="button"
            size="icon"
            className="h-8 w-8 bg-white border border-black/10 text-black/60 hover:bg-neutral-100 transition"
            onClick={() => setShowAddFilterList(v => !v)}
            aria-label="Add filter"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {showAddFilterList && (
            <div className="absolute right-0 mt-1 min-w-[120px] bg-white rounded-lg border border-black/10 shadow-xl z-[100] py-1">
              {FILTER_FIELDS.map(f =>
                <button
                  key={f.key}
                  className="w-full px-3 py-1 text-left text-xs hover:bg-neutral-100 bg-white"
                  disabled={activeExtraFilter === f.key}
                  onClick={() => handleAddFilter(f.key)}
                >{f.label}</button>
              )}
            </div>
          )}
        </div>
      )}

      {activeExtraFilter && (
        <div className="flex items-center gap-1">
          <Combobox
            options={FILTER_FIELDS.find(f => f.key === activeExtraFilter)?.options || []}
            value={filters[activeExtraFilter] || ""}
            onChange={(v) => handleFilterChange(activeExtraFilter, v)}
            placeholder={FILTER_FIELDS.find(f => f.key === activeExtraFilter)?.label || ""}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-neutral-500 hover:text-black"
            onClick={handleRemoveExtraFilter}
            aria-label="Remove filter"
          >
            ×
          </Button>
        </div>
      )}

      <Combobox
        options={["Sort: Category", "Sort: Latest"]}
        value={filters.sort || ""}
        onChange={(v) => handleFilterChange("sort", v)}
        placeholder="Sort"
      />
    </div>
  );
};

export default ProductFilters;
