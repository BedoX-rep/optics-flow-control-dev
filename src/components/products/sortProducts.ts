
import { CATEGORY_OPTIONS } from "./CategoryCellEditor";
import { INDEX_OPTIONS } from "./IndexCellEditor";
import { TREATMENT_OPTIONS } from "./TreatmentCellEditor";
import { HARDCODED_COMPANIES } from "@/hooks/useCompanies";

export interface ProductSortable {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
  category?: string | null;
  index?: string | null;
  treatment?: string | null;
  company?: string | null;
  image?: string | null;
  created_at?: string | null;
}

function idxOrLast(arr: string[], v?: string | null) {
  if (!v) return arr.length; // null/undefined after all explicit options
  const i = arr.indexOf(v);
  return i === -1 ? arr.length : i;
}

export function sortProducts(products: ProductSortable[]) {
  return [...products].sort((a, b) => {
    const catComp   = idxOrLast(CATEGORY_OPTIONS, a.category)   - idxOrLast(CATEGORY_OPTIONS, b.category);
    if (catComp) return catComp;

    const idxComp   = idxOrLast(INDEX_OPTIONS, a.index)         - idxOrLast(INDEX_OPTIONS, b.index);
    if (idxComp) return idxComp;

    const treatComp = idxOrLast(TREATMENT_OPTIONS, a.treatment) - idxOrLast(TREATMENT_OPTIONS, b.treatment);
    if (treatComp) return treatComp;

    const compComp  = idxOrLast(HARDCODED_COMPANIES, a.company)     - idxOrLast(HARDCODED_COMPANIES, b.company);
    if (compComp) return compComp;

    return 0;
  });
}