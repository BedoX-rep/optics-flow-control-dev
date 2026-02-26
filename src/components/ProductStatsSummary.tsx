import React from "react";
import { useLanguage } from "./LanguageProvider";

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
  const { t } = useLanguage();
  const total = products.length;

  const countsByCategory = CATEGORY_LABELS
    .map((cat) => ({
      label: cat,
      // Handle potential translation key formatting (no spaces, lowercase)
      tKey: cat.toLowerCase().replace(/\s+/g, ''),
      count: products.filter((p) => (p.category ?? "Uncategorized") === cat).length,
    }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
      <div className="flex flex-col">
        <span className="text-4xl font-black text-white leading-none">{total}</span>
        <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">{t('totalProducts') || 'TOTAL PRODUCTS'}</span>
      </div>

      <div className="hidden md:block w-px h-8 bg-white/10" />

      <div className="flex flex-wrap gap-2">
        {countsByCategory.map(({ label, tKey, count }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-sm"
          >
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">
              {t(tKey) || label}
            </span>
            <span className="h-4 w-px bg-white/10 mx-0.5" />
            <span className="text-sm font-black text-teal-400">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductStatsSummary;
