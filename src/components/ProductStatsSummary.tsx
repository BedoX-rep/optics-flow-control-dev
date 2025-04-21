
import React from "react";

interface ProductStatsSummaryProps {
  products: Array<{ category?: string | null }>;
}

const CATEGORY_LABELS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories",
];

const CATEGORY_COLORS: { [key: string]: string } = {
  "Single Vision Lenses": "border-gray-300 text-gray-800",
  "Progressive Lenses": "border-gray-300 text-gray-800",
  "Frames": "border-gray-400 text-gray-900",
  "Sunglasses": "border-gray-400 text-gray-800",
  "Contact Lenses": "border-gray-300 text-gray-800",
  "Accessories": "border-gray-300 text-gray-800",
};

const ProductStatsSummary: React.FC<ProductStatsSummaryProps> = ({ products }) => {
  const total = products.length;
  const countsByCategory = CATEGORY_LABELS
    .map((cat) => ({
      label: cat,
      count: products.filter((p) => (p.category ?? "Uncategorized") === cat).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-black">{total}</span>
        <span className="text-gray-400 text-xs font-medium">Products</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {countsByCategory.map(({ label, count }) => (
          <span
            key={label}
            className={`border px-2 py-0.5 rounded-full bg-white font-semibold text-xs ${CATEGORY_COLORS[label] || "border-gray-300"}`}
          >
            {label.replace(/Lenses|Frames|Glasses|Accessories/, match => match[0])}: {count}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductStatsSummary;
