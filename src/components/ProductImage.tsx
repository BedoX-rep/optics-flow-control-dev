
import React from "react";
import { Image, X } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "",
  removable = false,
  onRemove,
  className = "",
}) => {
  return (
    <div className={`relative w-12 h-12 rounded-lg bg-[#F5F6F7] border border-gray-200 flex items-center justify-center overflow-hidden ${className}`}>
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
              className="absolute top-0 right-0 bg-white/80 hover:bg-white text-neutral-500 rounded-full shadow p-0.5"
              aria-label="Remove Image"
            >
              <X size={14} />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center text-gray-300">
          <Image size={26} />
        </div>
      )}
    </div>
  );
};

export default ProductImage;
