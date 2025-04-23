
import React from "react";
import { Package, Box, Shirt, Utensils, Book } from "lucide-react";

interface CategoryIconProps {
  category: string | null | undefined;
  size?: number;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 24 }) => {
  switch (category) {
    case "Single Vision Lenses":
    case "Progressive Lenses":
      return <Package size={size} />;
    case "Frames":
      return <Box size={size} />;
    case "Sunglasses":
      return <Shirt size={size} />;
    case "Contact Lenses":
      return <Utensils size={size} />;
    case "Accessories":
      return <Book size={size} />;
    default:
      return <Package size={size} />;
  }
};

export default CategoryIcon;
