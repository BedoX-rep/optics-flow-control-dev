
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Wand2, Package, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/hooks/useCompanies';

const CATEGORY_OPTIONS = [
  "Single Vision Lenses",
  "Progressive Lenses",
  "Frames",
  "Sunglasses",
  "Contact Lenses",
  "Accessories",
  "Service",
  "Other"
];

const INDEX_OPTIONS = ["1.50", "1.56", "1.59", "1.6", "1.67", "1.74"];

const TREATMENT_OPTIONS = [
  "White",
  "AR", 
  "Blue",
  "Photochromic",
  "Polarized",
  "UV protection",
  "Tint"
];

interface AutoGenerateProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsGenerated: (count: number) => void;
  existingProducts: any[];
}

const AutoGenerateProductsDialog: React.FC<AutoGenerateProductsDialogProps> = ({
  isOpen,
  onClose,
  onProductsGenerated,
  existingProducts
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { allCompanies } = useCompanies();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);

  const handleIndexToggle = (index: string) => {
    setSelectedIndexes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleTreatmentToggle = (treatment: string) => {
    setSelectedTreatments(prev => 
      prev.includes(treatment) 
        ? prev.filter(t => t !== treatment)
        : [...prev, treatment]
    );
  };

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies(prev => 
      prev.includes(company) 
        ? prev.filter(c => c !== company)
        : [...prev, company]
    );
  };

  const generateProductName = (category: string, index?: string, treatment?: string, company?: string) => {
    const getCategoryAbbr = (cat: string) => {
      switch (cat) {
        case 'Single Vision Lenses': return 'SV';
        case 'Progressive Lenses': return 'PG';
        case 'Frames': return 'FR';
        case 'Sunglasses': return 'SG';
        case 'Contact Lenses': return 'CL';
        case 'Accessories': return 'AC';
        case 'Service': return 'SV';
        case 'Other': return 'OT';
        default: return '';
      }
    };

    let parts = [getCategoryAbbr(category)];
    
    if (["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(category)) {
      if (index) parts.push(index);
      if (treatment) parts.push(treatment.toUpperCase());
    }
    if (company) parts.push(company.toUpperCase());
    
    return parts.filter(Boolean).join(" ");
  };

  const generatePreview = () => {
    if (!selectedCategory) return;

    const products: any[] = [];
    
    // If no specific options selected, create basic product
    if (selectedIndexes.length === 0 && selectedTreatments.length === 0 && selectedCompanies.length === 0) {
      products.push({
        name: generateProductName(selectedCategory),
        category: selectedCategory,
        index: null,
        treatment: null,
        company: null,
        price: 0,
        cost_ttc: 0,
        stock_status: 'Order',
        stock: 0,
        automated_name: true
      });
    } else {
      // Generate all combinations
      const indexes = selectedIndexes.length > 0 ? selectedIndexes : [null];
      const treatments = selectedTreatments.length > 0 ? selectedTreatments : [null];
      const companies = selectedCompanies.length > 0 ? selectedCompanies : [null];

      for (const index of indexes) {
        for (const treatment of treatments) {
          for (const company of companies) {
            const productName = generateProductName(selectedCategory, index || undefined, treatment || undefined, company || undefined);
            
            // Check if product already exists
            const isDuplicate = existingProducts.some(existing => 
              existing.name === productName ||
              (existing.category === selectedCategory &&
               existing.index === index &&
               existing.treatment === treatment &&
               existing.company === company)
            );

            if (!isDuplicate) {
              products.push({
                name: productName,
                category: selectedCategory,
                index,
                treatment,
                company,
                price: 0,
                cost_ttc: 0,
                stock_status: 'Order',
                stock: 0,
                automated_name: true
              });
            }
          }
        }
      }
    }

    setPreviewProducts(products);
  };

  React.useEffect(() => {
    generatePreview();
  }, [selectedCategory, selectedIndexes, selectedTreatments, selectedCompanies, existingProducts]);

  const handleGenerate = async () => {
    if (!user || previewProducts.length === 0) return;

    try {
      setIsGenerating(true);

      const productsToInsert = previewProducts.map(product => ({
        ...product,
        user_id: user.id,
        is_deleted: false,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      onProductsGenerated(productsToInsert.length);
      
      toast({
        title: "Success",
        description: `${productsToInsert.length} product(s) generated successfully`,
      });

      // Reset form
      setSelectedCategory('');
      setSelectedIndexes([]);
      setSelectedTreatments([]);
      setSelectedCompanies([]);
      setPreviewProducts([]);
      onClose();

    } catch (error) {
      console.error('Error generating products:', error);
      toast({
        title: "Error",
        description: "Failed to generate products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedIndexes([]);
    setSelectedTreatments([]);
    setSelectedCompanies([]);
    setPreviewProducts([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Auto Generate Products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Index Selection */}
          {selectedCategory && ["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(selectedCategory) && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Index Options</Label>
              <div className="flex flex-wrap gap-2">
                {INDEX_OPTIONS.map(index => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`index-${index}`}
                      checked={selectedIndexes.includes(index)}
                      onCheckedChange={() => handleIndexToggle(index)}
                    />
                    <Label htmlFor={`index-${index}`} className="text-sm">
                      {index}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedIndexes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedIndexes.map(index => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {index}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleIndexToggle(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Treatment Selection */}
          {selectedCategory && ["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(selectedCategory) && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Treatment Options</Label>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_OPTIONS.map(treatment => (
                  <div key={treatment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`treatment-${treatment}`}
                      checked={selectedTreatments.includes(treatment)}
                      onCheckedChange={() => handleTreatmentToggle(treatment)}
                    />
                    <Label htmlFor={`treatment-${treatment}`} className="text-sm">
                      {treatment}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedTreatments.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTreatments.map(treatment => (
                    <Badge key={treatment} variant="secondary" className="text-xs">
                      {treatment}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleTreatmentToggle(treatment)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Company Selection */}
          {selectedCategory && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Company Options</Label>
              <div className="flex flex-wrap gap-2">
                {allCompanies.map(company => (
                  <div key={company} className="flex items-center space-x-2">
                    <Checkbox
                      id={`company-${company}`}
                      checked={selectedCompanies.includes(company)}
                      onCheckedChange={() => handleCompanyToggle(company)}
                    />
                    <Label htmlFor={`company-${company}`} className="text-sm">
                      {company}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedCompanies.map(company => (
                    <Badge key={company} variant="secondary" className="text-xs">
                      {company}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => handleCompanyToggle(company)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {previewProducts.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Preview ({previewProducts.length} products will be generated)
              </Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {previewProducts.slice(0, 20).map((product, index) => (
                    <div key={index} className="text-sm p-2 bg-white rounded border">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        {product.category} {product.index && `• ${product.index}`} {product.treatment && `• ${product.treatment}`} {product.company && `• ${product.company}`}
                      </div>
                    </div>
                  ))}
                  {previewProducts.length > 20 && (
                    <div className="text-sm text-gray-500 col-span-full text-center">
                      ... and {previewProducts.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || previewProducts.length === 0 || !selectedCategory}
                className="bg-primary text-white"
              >
                {isGenerating ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate {previewProducts.length} Products
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGenerateProductsDialog;
