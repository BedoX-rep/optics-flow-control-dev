
import React from "react";
import { Eye } from "lucide-react";

interface EyePrescriptionProps {
  side: "left" | "right";
  sph?: number | null;
  cyl?: number | null;
  axe?: number | null;
}

export const EyePrescriptionDisplay = ({ side, sph, cyl, axe }: EyePrescriptionProps) => {
  const hasData = sph !== undefined || cyl !== undefined || axe !== undefined;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Eye size={16} className={`${side === "left" ? "text-teal-500" : "text-blue-500"}`} />
        <span className="text-sm font-medium text-gray-700">{side === "left" ? "Left Eye" : "Right Eye"}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">SPH</span>
          <span className="text-sm font-medium">{sph || "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">CYL</span>
          <span className="text-sm font-medium">{cyl || "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">AXE</span>
          <span className="text-sm font-medium">{axe || "—"}</span>
        </div>
      </div>
      {!hasData && (
        <span className="text-xs text-gray-400 italic mt-1">No prescription data</span>
      )}
    </div>
  );
};
