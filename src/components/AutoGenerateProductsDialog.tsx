
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
import { cn } from '@/lib/utils';

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
      <DialogContent className="max-w-4xl p-0 border-none bg-[#E2E2DE] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 max-h-[96vh] overflow-y-auto custom-scrollbar">
        {/* Background Watermark Icons */}
        <div className="absolute top-40 right-10 opacity-[0.03] pointer-events-none rotate-12">
          <Wand2 size={240} strokeWidth={1} />
        </div>
        <div className="absolute bottom-40 left-10 opacity-[0.02] pointer-events-none -rotate-12">
          <Package size={200} strokeWidth={1} />
        </div>

        {/* Top Header Section */}
        <div className="p-10 pb-12 bg-gradient-to-b from-[#063D31] to-[#042F26] text-white relative rounded-b-[3rem] shadow-xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-8 top-8 text-teal-200/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                <Wand2 className="h-5 w-5 text-teal-100" />
              </div>
              <DialogTitle className="text-3xl font-black tracking-[0.15em] uppercase leading-none">
                {t('autoGenerateProducts') || 'Auto Generate Products'}
              </DialogTitle>
              <DialogDescription className="text-teal-50/70 text-sm font-medium tracking-wide">
                Configure parameters to generate multiple products at once.
              </DialogDescription>
            </div>
            <p className="text-teal-50/60 text-sm font-medium tracking-[0.1em] uppercase">
              {t('intelligentProductGeneration') || 'Intelligent Product Generation Suite'}
            </p>
          </div>
        </div>

        <div className="p-10 pt-8 space-y-8 relative z-10 custom-scrollbar flex-1 overflow-y-auto">
          {/* Category Selection */}
          <div className="space-y-4">
            <Label htmlFor="category" className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">
              {t('selectCategory')} *
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-14 rounded-[1.2rem] border-none bg-black/[0.04] focus:bg-white focus:ring-2 focus:ring-[#063D31]/10 text-lg font-bold text-slate-800 shadow-none">
                <SelectValue placeholder={t('selectCategoryPlaceholder') || "Select a category"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {CATEGORY_OPTIONS.map(category => (
                  <SelectItem key={category} value={category} className="rounded-xl focus:bg-[#063D31]/5">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Index Selection */}
          {selectedCategory && ["Single Vision Lenses", "Progressive Lenses", "Sunglasses"].includes(selectedCategory) && (
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">{t('indexOptions') || 'Index Options'}</Label>
              <div className="flex flex-wrap gap-3">
                {INDEX_OPTIONS.map(index => (
                  <div key={index} className="flex items-center space-x-2 bg-white/40 p-4 rounded-2xl border border-white/60 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => handleIndexToggle(index)}>
                    <Checkbox
                      id={`index-${index}`}
                      checked={selectedIndexes.includes(index)}
                      className="rounded-full border-[#063D31] data-[state=checked]:bg-[#063D31] data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`index-${index}`} className="text-sm font-black text-[#5C5C59] cursor-pointer">
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
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">{t('treatmentOptions') || 'Treatment Options'}</Label>
              <div className="flex flex-wrap gap-3">
                {TREATMENT_OPTIONS.map(treatment => (
                  <div key={treatment} className="flex items-center space-x-2 bg-white/40 p-4 rounded-2xl border border-white/60 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => handleTreatmentToggle(treatment)}>
                    <Checkbox
                      id={`treatment-${treatment}`}
                      checked={selectedTreatments.includes(treatment)}
                      className="rounded-full border-[#063D31] data-[state=checked]:bg-[#063D31] data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`treatment-${treatment}`} className="text-sm font-black text-[#5C5C59] cursor-pointer">
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
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">{t('companyOptions') || 'Company Options'}</Label>
              <div className="flex flex-wrap gap-3">
                {allCompanies.map(company => (
                  <div key={company} className="flex items-center space-x-2 bg-white/40 p-4 rounded-2xl border border-white/60 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={() => handleCompanyToggle(company)}>
                    <Checkbox
                      id={`company-${company}`}
                      checked={selectedCompanies.includes(company)}
                      className="rounded-full border-[#063D31] data-[state=checked]:bg-[#063D31] data-[state=checked]:text-white"
                    />
                    <Label htmlFor={`company-${company}`} className="text-sm font-black text-[#5C5C59] cursor-pointer">
                      {company}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewProducts.length > 0 && (
            <div className="space-y-4">
              <Label className="text-[11px] font-black uppercase text-[#8E8E8A] tracking-[0.15em] pl-1 font-sans">
                {t('preview') || 'Preview'} ({previewProducts.length} {t('productsToBeGenerated') || 'products will be generated'})
              </Label>
              <div className="max-h-60 overflow-y-auto rounded-[2rem] p-6 bg-white/40 border border-white/60 shadow-inner backdrop-blur-sm custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewProducts.slice(0, 20).map((product, index) => (
                    <div key={index} className="text-sm p-4 bg-white/60 rounded-2xl border border-white shadow-sm flex flex-col gap-1">
                      <div className="font-black text-[#063D31] text-base">{product.name}</div>
                      <div className="text-[11px] font-bold text-[#8E8E8A] uppercase tracking-wider">
                        {product.category} {product.index && `• ${product.index}`} {product.treatment && `• ${product.treatment}`} {product.company && `• ${product.company}`}
                      </div>
                    </div>
                  ))}
                  {previewProducts.length > 20 && (
                    <div className="text-[11px] font-black text-[#8E8E8A] col-span-full text-center py-4 uppercase tracking-[0.2em] bg-black/5 rounded-xl">
                      + {previewProducts.length - 20} {t('moreItems') || 'more items'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-10 flex items-center justify-between z-20">
          <button
            type="button"
            onClick={handleReset}
            className="px-8 py-3 rounded-xl font-black uppercase text-sm tracking-[0.2em] text-[#063D31] hover:translate-y-[-2px] transition-all border-b-2 border-[#063D31]"
          >
            {t('reset')}
          </button>
          <div className="flex gap-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || previewProducts.length === 0 || !selectedCategory}
              className={cn(
                "px-10 h-16 rounded-[2rem] font-black uppercase text-base tracking-[0.2em] shadow-2xl transition-all duration-500 active:scale-95 flex items-center gap-3 border-none",
                (isGenerating || previewProducts.length === 0 || !selectedCategory)
                  ? "bg-gradient-to-br from-[#8E8E8A] to-[#63635F] text-slate-900 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#063D31] to-[#042F26] text-white hover:shadow-teal-900/40 hover:translate-y-[-2px]"
              )}
            >
              {isGenerating ? (
                <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  {t('generate')} {previewProducts.length} {t('products')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGenerateProductsDialog;
