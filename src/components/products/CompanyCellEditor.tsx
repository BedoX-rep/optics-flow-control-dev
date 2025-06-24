
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Company } from '../../integrations/supabase/types';
import { useAuth } from '../../components/AuthProvider';

// Default companies that all users can see
export const DEFAULT_COMPANIES = [
  'Essilor',
  'Zeiss',
  'Hoya',
  'Rodenstock',
  'Nikon',
  'Kodak',
  'Seiko',
  'Shamir',
  'Varilux',
  'Crizal',
  'Transitions',
  'Polaroid',
  'Ray-Ban',
  'Oakley',
  'Maui Jim',
  'Persol',
  'Prada',
  'Gucci',
  'Versace',
  'Dolce & Gabbana',
  'Armani',
  'Tom Ford',
  'Bulgari',
  'Chanel',
  'Dior',
  'Fendi',
  'Burberry',
  'Coach',
  'Kate Spade',
  'Marc Jacobs',
  'Michael Kors',
  'Tiffany & Co.',
  'Cartier',
  'Montblanc',
  'Hugo Boss',
  'Lacoste',
  'Nike',
  'Adidas',
  'Under Armour',
  'Polo Ralph Lauren',
  'Tommy Hilfiger',
  'Calvin Klein',
  'Fossil',
  'Guess',
  'Diesel',
  'Carrera',
  'Police',
  'Silhouette',
  'Lindberg',
  'ic! berlin',
  'Mykita',
  'Blackfin',
  'Titanflex',
  'Flexon',
  'Modo',
  'Prodesign',
  'Face a Face',
  'Anne et Valentin',
  'Alain Mikli',
  'Etnia Barcelona',
  'Salt Optics',
  'Moscot',
  'Warby Parker',
  'Oliver Peoples',
  'Barton Perreira',
  'Thom Browne',
  'Garrett Leight',
  'Jacques Marie Mage',
  'Cutler and Gross',
  'Kirk & Kirk',
  'L.A. Eyeworks',
  'Theo',
  'Res/Rei',
  'Bevel',
  'Ill.I Optics',
  'Masunaga',
  'Matsuda',
  'Yellows Plus',
  'Kuboraum',
  'Rigards',
  'Thierry Lasry',
  'Dita',
  'Chrome Hearts',
  'Linda Farrow',
  'Retrosuperfuture',
  'Gentle Monster',
  'Fakbyfak',
  'Ørgreen',
  'Han Kjøbenhavn',
  'Vogue',
  'Emporio Armani',
  'Ralph Lauren',
  'Polo Ralph Lauren',
  'Versace',
  'Dolce & Gabbana',
  'Prada',
  'Miu Miu',
  'Bottega Veneta',
  'Saint Laurent',
  'Celine',
  'Loewe',
  'Balenciaga',
  'Givenchy',
  'Alexander McQueen',
  'Stella McCartney',
  'Marni',
  'Jil Sander',
  'Brunello Cucinelli',
  'Ermenegildo Zegna',
  'Loro Piana'
];

export interface CompanyCellEditorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface CompanyCellEditorRef {
  getValue: () => string;
  focus: () => void;
}

const CompanyCellEditor = forwardRef<CompanyCellEditorRef, CompanyCellEditorProps>(
  ({ value, onValueChange }, ref) => {
    const [currentValue, setCurrentValue] = useState(value || '');
    const [userCompanies, setUserCompanies] = useState<Company[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    // Combine default companies with user companies
    const getAllCompanies = () => {
      const userCompanyNames = userCompanies.map(company => company.name);
      return [...DEFAULT_COMPANIES, ...userCompanyNames];
    };

    useEffect(() => {
      if (user?.id) {
        fetchUserCompanies();
      }
    }, [user?.id]);

    useEffect(() => {
      const allCompanies = getAllCompanies();
      if (currentValue) {
        const filtered = allCompanies.filter(company =>
          company.toLowerCase().includes(currentValue.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(allCompanies);
      }
    }, [currentValue, userCompanies]);

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

    useImperativeHandle(ref, () => ({
      getValue: () => currentValue,
      focus: () => inputRef.current?.focus(),
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onValueChange(newValue);
      setIsOpen(true);
    };

    const handleOptionSelect = (option: string) => {
      setCurrentValue(option);
      onValueChange(option);
      setIsOpen(false);
    };

    const handleBlur = () => {
      setTimeout(() => setIsOpen(false), 200);
    };

    return (
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="Select or type company name"
        />
        
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-b shadow-lg max-h-48 overflow-y-auto">
            {filteredOptions.slice(0, 10).map((option, index) => (
              <div
                key={index}
                className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-900"
                onMouseDown={() => handleOptionSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CompanyCellEditor.displayName = 'CompanyCellEditor';

// Export for backward compatibility
export const COMPANY_OPTIONS = DEFAULT_COMPANIES;

export default CompanyCellEditor;
