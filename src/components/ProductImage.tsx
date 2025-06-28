
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
        <span className="flex items-center justify-center w-full h-full">
          {alt ? (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${
              alt === "Single Vision Lenses" ? "bg-blue-500" :
              alt === "Progressive Lenses" ? "bg-purple-500" :
              alt === "Frames" ? "bg-green-500" :
              alt === "Sunglasses" ? "bg-orange-500" :
              alt === "Contact Lenses" ? "bg-cyan-500" :
              alt === "Accessories" ? "bg-pink-500" :
              alt === "Service" ? "bg-indigo-500" :
              alt === "Other" ? "bg-gray-500" :
              "bg-gray-400"
            }`}>
              {alt === "Single Vision Lenses" ? "SV" :
               alt === "Progressive Lenses" ? "PG" :
               alt === "Frames" ? "FR" :
               alt === "Sunglasses" ? "SG" :
               alt === "Contact Lenses" ? "CL" :
               alt === "Accessories" ? "AC" :
               alt === "Service" ? "SV" :
               alt === "Other" ? "OT" :
               "?"
              }
            </div>
          ) : (
            <Image size={22} className="text-neutral-200" />
          )}
        </span>
      )}
    </div>
  );
};

export default ProductImage;
