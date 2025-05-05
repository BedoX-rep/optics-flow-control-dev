
export interface ProductSortable {
  id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string | null;
  index?: string | null;
  treatment?: string | null;
  company?: string | null;
  image?: string | null;
  created_at?: string;
  cost_ttc?: number;
  [key: string]: any;
}

export const sortProducts = (products: ProductSortable[]): ProductSortable[] => {
  // Return a copy of the products array to avoid mutating the original
  return [...products];
};
