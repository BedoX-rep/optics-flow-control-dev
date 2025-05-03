
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export interface MarkupRange {
  min: number;
  max: number;
  markup: number;
}

export interface MarkupSettings {
  sph: MarkupRange[];
  cyl: MarkupRange[];
}

interface MarkupSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MarkupSettings;
  onSave: (settings: MarkupSettings) => void;
}

export const defaultMarkupSettings: MarkupSettings = {
  sph: [
    { min: 0, max: 2, markup: 0 },
    { min: 2, max: 4, markup: 15 },
    { min: 4, max: Infinity, markup: 30 },
  ],
  cyl: [
    { min: 0, max: 2, markup: 0 },
    { min: 2, max: 4, markup: 15 },
    { min: 4, max: Infinity, markup: 30 },
  ],
};

const MarkupSettingsDialog: React.FC<MarkupSettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<MarkupSettings>(settings);

  const validateRanges = (ranges: MarkupRange[]) => {
    // Sort ranges by min value
    const sortedRanges = [...ranges].sort((a, b) => a.min - b.min);
    
    // Check for gaps and overlaps
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      if (sortedRanges[i].max !== sortedRanges[i + 1].min) {
        return false;
      }
    }
    
    return true;
  };

  const handleSave = () => {
    // Validate both SPH and CYL ranges
    if (!validateRanges(localSettings.sph) || !validateRanges(localSettings.cyl)) {
      toast({
        title: "Invalid Ranges",
        description: "Ranges must be continuous without gaps or overlaps",
        variant: "destructive"
      });
      return;
    }
    
    onSave(localSettings);
    onClose();
  };

  const updateRange = (type: 'sph' | 'cyl', index: number, field: keyof MarkupRange, value: number) => {
    setLocalSettings(prev => ({
      ...prev,
      [type]: prev[type].map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      ),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Markup Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h3 className="font-medium">SPH Ranges (±)</h3>
            {localSettings.sph.map((range, index) => (
              <div key={`sph-${index}`} className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={range.min}
                    onChange={(e) => updateRange('sph', index, 'min', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={range.max === Infinity ? 999 : range.max}
                    onChange={(e) => updateRange('sph', index, 'max', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    value={range.markup}
                    onChange={(e) => updateRange('sph', index, 'markup', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">CYL Ranges (±)</h3>
            {localSettings.cyl.map((range, index) => (
              <div key={`cyl-${index}`} className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={range.min}
                    onChange={(e) => updateRange('cyl', index, 'min', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={range.max === Infinity ? 999 : range.max}
                    onChange={(e) => updateRange('cyl', index, 'max', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    value={range.markup}
                    onChange={(e) => updateRange('cyl', index, 'markup', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkupSettingsDialog;
