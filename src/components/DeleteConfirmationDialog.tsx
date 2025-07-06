
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
    ? t('deleteConfirmationMessage')?.replace('{itemName}', itemName) || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : t('deleteConfirmationGeneric') || 'Are you sure you want to delete this item? This action cannot be undone.');
  const defaultDeleteButtonText = deleteButtonText || t('delete') || 'Delete';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-gradient-to-br from-teal-50 to-white border-2 border-teal-300 shadow-xl rounded-xl overflow-hidden">
        <DialogHeader className="text-center pb-4 pt-4">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-4 shadow-md border-2 border-teal-300">
            <AlertTriangle className="h-6 w-6 text-teal-700" />
          </div>
          <DialogTitle className="text-lg font-bold text-teal-800">
            {defaultTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center px-4 py-2">
          <p className="text-teal-700 text-sm leading-relaxed">
            {defaultMessage}
          </p>
        </div>

        <DialogFooter className="flex gap-3 p-4 bg-gradient-to-r from-teal-100 to-teal-50 border-t border-teal-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border-2 border-teal-400 text-teal-700 hover:bg-teal-200 hover:border-teal-500 font-medium py-2 rounded-lg transition-all duration-200"
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-none shadow-md hover:shadow-lg transition-all duration-200 font-medium py-2 rounded-lg"
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
