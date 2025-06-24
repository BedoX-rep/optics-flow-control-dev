import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { supabase } from '../integrations/supabase/client';
import { useAuthContext } from './AuthProvider';
import { Company } from '../integrations/supabase/types';
import { DEFAULT_COMPANIES } from './products/CompanyCellEditor';

interface ProductFormProps {
  onSubmit: (productData: any) => void;
  initialData?: any;
  isEditing?: boolean;
}

const ProductForm = ({ onSubmit, initialData, isEditing = false }: ProductFormProps) => {
  const { user } = useAuthContext();
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost_ttc: '',
    stock: '',
    category: '',
    company: '',
    treatment: '',
    index: '',
    gamma: '',
    automated_name: false,
    image: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price?.toString() || '',
        cost_ttc: initialData.cost_ttc?.toString() || '',
        stock: initialData.stock?.toString() || '',
        category: initialData.category || '',
        company: initialData.company || '',
        treatment: initialData.treatment || '',
        index: initialData.index || '',
        gamma: initialData.gamma || '',
        automated_name: initialData.automated_name || false,
        image: initialData.image || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (user?.id) {
      fetchUserCompanies();
    }
  }, [user?.id]);

  const fetchUserCompanies = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', false)
        .order('name');

      if (error) {
        console.error('Error fetching user companies:', error);
        return;
      }

      setUserCompanies(data || []);
    } catch (error) {
      console.error('Error fetching user companies:', error);
    }
  };

  // Combine default companies with user companies
  const getAllCompanies = () => {
    const userCompanyNames = userCompanies.map(company => company.name);
    return [...DEFAULT_COMPANIES, ...userCompanyNames].sort();
  };

  const categories = [
    'Frames',
    'Single Vision',
    'Progressive',
    'Sunglasses',
    'Contact Lens',
    'Accessories',
    'Other'
  ];

  const treatments = [
    'Anti-reflective',
    'Blue Light',
    'Photochromic',
    'Polarized',
    'Scratch Resistant',
    'UV Protection',
    'Anti-fog',
    'Mirror',
    'Gradient',
    'Tinted'
  ];

  const indices = [
    '1.50',
    '1.56',
    '1.59',
    '1.60',
    '1.67',
    '1.70',
    '1.74',
    '1.76'
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      cost_ttc: parseFloat(formData.cost_ttc) || 0,
      stock: parseInt(formData.stock) || 0,
    };

    onSubmit(productData);
  };

  const allCompanies = getAllCompanies();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Select value={formData.company} onValueChange={(value) => handleInputChange('company', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {allCompanies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="treatment">Treatment</Label>
          <Select value={formData.treatment} onValueChange={(value) => handleInputChange('treatment', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select treatment" />
            </SelectTrigger>
            <SelectContent>
              {treatments.map((treatment) => (
                <SelectItem key={treatment} value={treatment}>
                  {treatment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="index">Index</Label>
          <Select value={formData.index} onValueChange={(value) => handleInputChange('index', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select index" />
            </SelectTrigger>
            <SelectContent>
              {indices.map((index) => (
                <SelectItem key={index} value={index}>
                  {index}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gamma">Gamma</Label>
          <Input
            id="gamma"
            value={formData.gamma}
            onChange={(e) => handleInputChange('gamma', e.target.value)}
            placeholder="Enter gamma"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="Enter price"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_ttc">Cost TTC</Label>
          <Input
            id="cost_ttc"
            type="number"
            step="0.01"
            value={formData.cost_ttc}
            onChange={(e) => handleInputChange('cost_ttc', e.target.value)}
            placeholder="Enter cost TTC"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => handleInputChange('stock', e.target.value)}
            placeholder="Enter stock quantity"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            value={formData.image}
            onChange={(e) => handleInputChange('image', e.target.value)}
            placeholder="Enter image URL (optional)"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="automated_name"
          checked={formData.automated_name}
          onCheckedChange={(checked) => handleInputChange('automated_name', checked)}
        />
        <Label htmlFor="automated_name">Use automated naming</Label>
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? 'Update Product' : 'Add Product'}
      </Button>
    </form>
  );
};

export default ProductForm;