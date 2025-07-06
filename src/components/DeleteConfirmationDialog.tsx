
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false
}: DeleteConfirmationDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white border-0 shadow-2xl backdrop-blur-sm max-w-md">
        <AlertDialogHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-gray-800">
                "{itemName}"
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
          <AlertDialogCancel 
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 rounded-xl font-medium transition-all duration-200"
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-xl font-medium shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
