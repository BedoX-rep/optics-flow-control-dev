import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Company } from '../integrations/supabase/types';
import { useAuth } from './AuthProvider';
import { DEFAULT_COMPANIES } from './products/CompanyCellEditor';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCompany: string;
  onCompanyChange: (value: string) => void;
  selectedTreatment: string;
  onTreatmentChange: (value: string) => void;
  selectedIndex: string;
  onIndexChange: (value: string) => void;
  onClearFilters: () => void;
}

const ProductFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCompany,
  onCompanyChange,
  selectedTreatment,
  onTreatmentChange,
  selectedIndex,
  onIndexChange,
  onClearFilters,
}: ProductFiltersProps) => {
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const { user } = useAuthContext();

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

  const allCompanies = getAllCompanies();

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedCompany} onValueChange={onCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {allCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedTreatment} onValueChange={onTreatmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Treatment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Treatments</SelectItem>
                {treatments.map((treatment) => (
                  <SelectItem key={treatment} value={treatment}>
                    {treatment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedIndex} onValueChange={onIndexChange}>
              <SelectTrigger>
                <SelectValue placeholder="Index" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Indices</SelectItem>
                {indices.map((index) => (
                  <SelectItem key={index} value={index}>
                    {index}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;