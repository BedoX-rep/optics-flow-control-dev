
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isDeleting?: boolean;
  deleteButtonText?: string;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isDeleting = false,
  deleteButtonText
}: DeleteConfirmationDialogProps) => {
  const { t } = useLanguage();

  const defaultTitle = title || t('confirmDelete') || 'Confirm Delete';
  const defaultMessage = message || (itemName 
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : 'Are you sure you want to delete this item? This action cannot be undone.');
  const defaultDeleteButtonText = deleteButtonText || t('delete') || 'Delete';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-teal-200 shadow-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-teal-800">
            {defaultTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {defaultMessage}
          </p>
        </div>

        <DialogFooter className="flex gap-3 pt-4 border-t border-teal-100">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('deleting') || 'Deleting...'}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {defaultDeleteButtonText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
