
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

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses", 
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories"
];

const INDEX_OPTIONS = [
  "1.56",
  "1.6", 
  "1.67",
  "1.74"
];

const TREATMENT_OPTIONS = [
  "White",
  "AR",
  "Blue",
  "Photochromic"
];

const COMPANY_OPTIONS = [
  "Indo",
  "ABlens",
  "Essilor",
  "GLASSANDLENS",
  "Optifak"
];

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
