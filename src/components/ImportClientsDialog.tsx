
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Download, Upload } from 'lucide-react';

type Client = {
  name: string;
  phone: string;
  right_eye_sph: number;
  right_eye_cyl: number;
  right_eye_axe: number;
  left_eye_sph: number;
  left_eye_cyl: number;
  left_eye_axe: number;
  add?: number;
};

export function ImportClientsDialog({ open, onOpenChange, onSuccess }: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Client[]>([]);
  const { toast } = useToast();

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const clients: Client[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const client: any = {};
      
      headers.forEach((header, index) => {
        if (index < values.length) {
          if (["right_eye_sph", "right_eye_cyl", "left_eye_sph", "left_eye_cyl", "add"].includes(header)) {
            client[header] = parseFloat(values[index]) || 0;
          } else if (["right_eye_axe", "left_eye_axe"].includes(header)) {
            client[header] = parseInt(values[index]) || 0;
          } else {
            client[header] = values[index];
          }
        }
      });

      // Make sure required fields are present
      if (client.name && client.phone) {
        clients.push(client as Client);
      }
    }
    
    return clients;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const clients = parseCSV(text);
      
      if (clients.length === 0) {
        setError('No valid client data found in the CSV');
        return;
      }
      
      setPreview(clients.slice(0, 3)); // Preview first 3 clients
    } catch (err) {
      console.error("Error parsing CSV:", err);
      setError('Failed to parse CSV file. Please check the format.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const clients = parseCSV(text);
      
      if (clients.length === 0) {
        setError('No valid client data found in the CSV');
        setIsUploading(false);
        return;
      }
      
      const { error: supabaseError } = await supabase.from('clients').insert(
        clients.map(client => ({
          ...client,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }))
      );
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      toast({
        title: "Import successful",
        description: `${clients.length} clients imported successfully.`,
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error importing clients:", err);
      setError(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "name,phone,right_eye_sph,right_eye_cyl,right_eye_axe,left_eye_sph,left_eye_cyl,left_eye_axe,add";
    const example1 = "John Doe,+1234567890,1.25,-0.5,180,1.5,-0.75,175,2.0";
    const example2 = "Jane Smith,+0987654321,0.75,-0.25,90,0.5,-0.5,85,1.5";
    
    const content = [headers, example1, example2].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing client information to import multiple clients at once.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h4 className="font-medium mb-2">CSV Format Guide</h4>
              <p className="text-sm text-muted-foreground mb-1">
                Your CSV should include these columns:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5 mb-2">
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">name</span> - Full name (required)</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">phone</span> - Phone number (required)</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">right_eye_sph</span> - Right eye sphere value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">right_eye_cyl</span> - Right eye cylinder value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">right_eye_axe</span> - Right eye axis value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">left_eye_sph</span> - Left eye sphere value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">left_eye_cyl</span> - Left eye cylinder value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">left_eye_axe</span> - Left eye axis value</li>
                <li><span className="font-mono text-xs bg-muted p-0.5 rounded">add</span> - Addition value</li>
              </ul>
              <Button 
                variant="outline" 
                onClick={downloadTemplate} 
                size="sm" 
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" /> Download Template
              </Button>
            </div>

            <div>
              <Label htmlFor="client-csv" className="text-right">
                Select CSV File
              </Label>
              <Input
                id="client-csv"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {preview.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Preview:</h4>
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  {preview.map((client, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-border last:border-0 last:mb-0 last:pb-0">
                      <p><strong>Name:</strong> {client.name}</p>
                      <p><strong>Phone:</strong> {client.phone}</p>
                      {(client.right_eye_sph || client.left_eye_sph) && 
                        <p className="text-xs text-muted-foreground mt-1">Prescription data included</p>
                      }
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-1 italic">Showing first {preview.length} records...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Importing...' : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Import Clients
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
