
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
      <DialogContent className="max-w-md bg-white border-2 border-teal-200 shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="text-center pb-6 pt-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-red-200 to-red-300 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-teal-800 mb-2">
            {defaultTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center px-6 py-4">
          <p className="text-gray-700 text-base leading-relaxed max-w-sm mx-auto">
            {defaultMessage}
          </p>
        </div>

        <DialogFooter className="flex gap-4 p-6 bg-gradient-to-r from-teal-50 to-teal-100 border-t border-teal-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border-2 border-teal-300 text-teal-700 hover:bg-teal-100 hover:border-teal-400 font-semibold py-2.5 rounded-xl transition-all duration-200"
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200 font-semibold py-2.5 rounded-xl"
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
