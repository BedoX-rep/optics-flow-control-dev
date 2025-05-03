export interface ProductSortable {
  id: string;
  name: string;
  price: number;
  category?: string;
  index?: string;
  treatment?: string;
  company?: string;
  image?: string;
  stock?: number;
  created_at?: string;
  is_deleted?: boolean;
  cost_ttc?: number;
  position?: number;
  user_id?: string;
}

export const sortProducts = (products: ProductSortable[]) => {
  // Implement your sorting logic here
  // For now, we'll just return the products unchanged
  return [...products];
};
