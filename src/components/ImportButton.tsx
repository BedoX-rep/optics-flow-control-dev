
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ImportClientsDialog } from '@/components/ImportClientsDialog';
import { FileUp, HelpCircle } from 'lucide-react';

export function ImportButton({ onSuccess }: { onSuccess: () => void }) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        onClick={() => setIsImportDialogOpen(true)}
        className="flex items-center"
      >
        <FileUp className="h-4 w-4 mr-2" /> Import
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Import Guide</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">CSV Import Guide</h4>
            <p className="text-sm text-muted-foreground">
              Create a CSV file with these columns:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>name (required)</li>
              <li>phone (required)</li>
              <li>right_eye_sph</li>
              <li>right_eye_cyl</li>
              <li>right_eye_axe</li>
              <li>left_eye_sph</li>
              <li>left_eye_cyl</li>
              <li>left_eye_axe</li>
              <li>add</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Import" to upload your CSV file.
              A template is available in the import dialog.
            </p>
          </div>
        </PopoverContent>
      </Popover>
      
      <ImportClientsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={onSuccess}
      />
    </div>
  );
}
