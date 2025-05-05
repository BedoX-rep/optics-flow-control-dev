
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

export const sortProducts = (products: ProductSortable[], sortOption?: string): ProductSortable[] => {
  if (!sortOption || sortOption === "arrange") {
    // Return a copy of the products array to avoid mutating the original
    return [...products];
  }

  return [...products].sort((a, b) => {
    switch (sortOption) {
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "newest":
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      case "oldest":
        return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
      case "stock_asc":
        return (a.stock || 0) - (b.stock || 0);
      case "stock_desc":
        return (b.stock || 0) - (a.stock || 0);
      default:
        return 0;
    }
  });
};
