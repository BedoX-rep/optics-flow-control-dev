import { CATEGORY_OPTIONS } from "./CategoryCellEditor";
import { INDEX_OPTIONS } from "./IndexCellEditor";
import { TREATMENT_OPTIONS } from "./TreatmentCellEditor";
import { COMPANY_OPTIONS } from "./CompanyCellEditor";

export interface ProductSortable {
  id: string;
  name: string;
  category?: string | null;
  company?: string | null;
  treatment?: string | null;
  index?: string | null;
  price: number;
  stock?: number;
  image?: string | null;
  cost_ttc?: number;
  created_at?: string;
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

    const compComp  = idxOrLast(COMPANY_OPTIONS, a.company)     - idxOrLast(COMPANY_OPTIONS, b.company);
    if (compComp) return compComp;

    return 0;
  });
}
