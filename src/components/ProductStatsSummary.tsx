
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

const ProductStatsSummary: React.FC<ProductStatsSummaryProps> = ({ products }) => {
  const total = products.length;
  const countsByCategory = CATEGORY_LABELS
    .map((cat) => ({
      label: cat,
      count: products.filter((p) => (p.category ?? "Uncategorized") === cat).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="flex flex-col items-end gap-0.5 w-max min-w-[130px]">
      <div className="flex items-center gap-1">
        <span className="text-[1.5rem] font-bold text-black">{total}</span>
        <span className="text-gray-400 text-xs font-medium">listed</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {countsByCategory.map(({ label, count }) => (
          <span
            key={label}
            className="border border-black/20 px-2 py-0.5 rounded-full bg-white font-medium text-xs text-black/80"
          >
            {label.replace(/Lenses|Frames|Glasses|Accessories/, match => match[0])}: {count}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductStatsSummary;
