
import React from "react";
import { Image, X } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

// Refined: minimal, elegant empty state (just icon, centered, NO borders/text)
const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "",
  removable = false,
  onRemove,
  className = "",
}) => {
  return (
    <div className={`relative w-11 h-11 flex items-center justify-center overflow-hidden rounded-lg bg-neutral-50 border border-neutral-200 ${className}`}>
      {src ? (
        <>
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover rounded-lg"
          />
          {removable && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove && onRemove(); }}
              className="absolute top-0 right-0 bg-white/60 hover:bg-white text-neutral-600 rounded-full p-0.5"
              aria-label="Remove Image"
              style={{ boxShadow: "0 0 4px 0 rgba(0,0,0,0.05)" }}
            >
              <X size={14} />
            </button>
          )}
        </>
      ) : (
        <span className="flex items-center justify-center w-full h-full text-neutral-200">
          <Image size={22} />
        </span>
      )}
    </div>
  );
};

export default ProductImage;
