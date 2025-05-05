
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingActionButton = ({ onClick, className }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full p-0 shadow-lg bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 transition-all duration-300 hover:scale-105 hover:shadow-xl z-50",
        className
      )}
    >
      <Plus size={24} className="text-white" />
    </Button>
  );
};
