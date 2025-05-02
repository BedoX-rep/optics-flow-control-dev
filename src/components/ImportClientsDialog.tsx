
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface ImportClientsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface CSVRow {
  name: string;
  phone?: string;
  gender?: "Mr" | "Mme" | "Enf";
  right_eye_sph?: string;
  right_eye_cyl?: string;
  right_eye_axe?: string;
  left_eye_sph?: string;
  left_eye_cyl?: string;
  left_eye_axe?: string;
  Add?: string;
  notes?: string;
}

export function ImportClientsDialog({ isOpen, onClose, onImportComplete }: ImportClientsDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const rows = results.data as CSVRow[];
          
          if (rows.length > 50) {
            throw new Error('Maximum 50 rows allowed per import');
          }

          const user = (await supabase.auth.getUser()).data.user;
          if (!user) throw new Error('User not authenticated');

          const clientsToInsert = rows.map(row => ({
            name: row.name,
            phone: row.phone || null,
            gender: (row.gender as "Mr" | "Mme" | "Enf" | undefined) || null,
            right_eye_sph: row.right_eye_sph ? parseFloat(row.right_eye_sph) : null,
            right_eye_cyl: row.right_eye_cyl ? parseFloat(row.right_eye_cyl) : null,
            right_eye_axe: row.right_eye_axe ? parseInt(row.right_eye_axe) : null,
            left_eye_sph: row.left_eye_sph ? parseFloat(row.left_eye_sph) : null,
            left_eye_cyl: row.left_eye_cyl ? parseFloat(row.left_eye_cyl) : null,
            left_eye_axe: row.left_eye_axe ? parseInt(row.left_eye_axe) : null,
            Add: row.Add ? parseFloat(row.Add) : null,
            notes: row.notes || null,
            user_id: user.id,
            favorite: false,
            is_deleted: false
          }));

          const { error } = await supabase
            .from('clients')
            .insert(clientsToInsert);

          if (error) throw error;

          toast({
            title: "Success",
            description: `${rows.length} clients imported successfully`,
          });
          
          onImportComplete();
          onClose();
        } catch (error: any) {
          console.error('Import error:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to import clients",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setIsUploading(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Upload a CSV file with the following columns:<br/>
            name*, phone, gender (Mr/Mme/Enf), right_eye_sph, right_eye_cyl, right_eye_axe,<br/>
            left_eye_sph, left_eye_cyl, left_eye_axe, Add, notes<br/>
            <br/>
            * Required field
          </p>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
