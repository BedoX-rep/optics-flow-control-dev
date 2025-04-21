
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
    <div className="flex flex-col gap-2 items-end">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[#0B6E63]">{total}</span>
        <span className="text-gray-500 text-sm">Products</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {countsByCategory.map(({ label, count }) => (
          <span
            key={label}
            className="bg-[#f1fafd] text-[#0B6E63] font-medium px-2 py-0.5 rounded-full text-xs min-w-[32px] text-center"
          >
            {label.split(" ")[0]}: {count}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductStatsSummary;
