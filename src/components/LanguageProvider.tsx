import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr' | 'ar';

type Translations = {
  [key: string]: {
    en: string;
    fr: string;
    ar: string;
  };
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: Translations;
  direction: 'ltr' | 'rtl';
}

const homeTranslations: Translations = {
  heroTitle: {
    en: 'Optical Software For All Your Eye Care Needs',
    fr: 'Logiciel Optique Pour Tous Vos Besoins En Soins Oculaires',
    ar: 'برنامج بصري لجميع احتياجات العناية بالعيون'
  },
  heroSubtitle: {
    en: 'Effortlessly manage all your client needs and prepare prescription lenses within seconds. The best eye care management software get your exact data-backed prescription within seconds',
    fr: 'Gérez sans effort tous les besoins de vos clients et préparez des verres de prescription en quelques secondes. Le meilleur logiciel de gestion des soins oculaires vous donne votre prescription exacte en quelques secondes',
    ar: 'إدارة جميع احتياجات عملائك بسهولة وإعداد العدسات الطبية في غضون ثوانٍ. أفضل برنامج لإدارة رعاية العيون يوفر لك وصفة طبية دقيقة مدعومة بالبيانات في غضون ثوان'
  },
  startFreeTrial: {
    en: 'START A FREE TRIAL',
    fr: 'COMMENCER UN ESSAI GRATUIT',
    ar: 'ابدأ نسخة تجريبية مجانية'
  },
  freeTrialCta: {
    en: 'Start Free Trial Today',
    fr: 'Commencez l\'essai gratuit aujourd\'hui',
    ar: 'ابدأ النسخة التجريبية المجانية اليوم'
  },
  signInRegister: {
    en: 'Sign In / Register',
    fr: 'Se connecter / S\'inscrire',
    ar: 'تسجيل الدخول / التسجيل'
  },
  goToDashboard: {
    en: 'Go to Dashboard',
    fr: 'Aller au tableau de bord',
    ar: 'الذهاب إلى لوحة التحكم'
  },
  features: {
    en: 'Features',
    fr: 'Fonctionnalités',
    ar: 'الميزات'
  },
  pricing: {
    en: 'Pricing',
    fr: 'Tarification',
    ar: 'التسعير'
  },
  effortlessTitle: {
    en: 'Effortless, Fast, And Simple!',
    fr: 'Sans effort, rapide et simple!',
    ar: 'سهل وسريع وبسيط!'
  },
  effortlessDesc: {
    en: 'Running an optical salon is a complex task. You need optical software that simplifies your daily operations while enhancing your services — both in quality and quantity. Lensly is incredibly intuitive, helping you find the perfect lenses for every client.',
    fr: 'Gérer un salon d\'optique est une tâche complexe. Vous avez besoin d\'un logiciel optique qui simplifie vos opérations quotidiennes tout en améliorant vos services — en qualité et en quantité. Lensly est incroyablement intuitif, vous aidant à trouver les lentilles parfaites pour chaque client.',
    ar: 'إدارة صالون بصري مهمة معقدة. أنت بحاجة إلى برنامج بصري يبسط عملياتك اليومية مع تعزيز خدماتك - من حيث الجودة والكمية. لينسلي بديهي بشكل لا يصدق، مما يساعدك على العثور على العدسات المثالية لكل عميل.'
  },
  powerfulFeatures: {
    en: 'Powerful Features',
    fr: 'Fonctionnalités Puissantes',
    ar: 'ميزات قوية'
  },
  featuresSubtitle: {
    en: 'Our platform provides everything you need to manage your optical business efficiently',
    fr: 'Notre plateforme fournit tout ce dont vous avez besoin pour gérer efficacement votre entreprise d\'optique',
    ar: 'توفر منصتنا كل ما تحتاجه لإدارة عملك البصري بكفاءة'
  },
  clientManagement: {
    en: 'Client Management',
    fr: 'Gestion des Clients',
    ar: 'إدارة العملاء'
  },
  clientManagementDesc: {
    en: 'Track client histories, appointments, and prescriptions in one place',
    fr: 'Suivez l\'historique des clients, les rendez-vous et les prescriptions en un seul endroit',
    ar: 'تتبع تاريخ العملاء والمواعيد والوصفات الطبية في مكان واحد'
  },
  inventoryControl: {
    en: 'Inventory Control',
    fr: 'Contrôle des Stocks',
    ar: 'إدارة المخزون'
  },
  inventoryControlDesc: {
    en: 'Manage your frames, lenses, and other products with real-time stock updates',
    fr: 'Gérez vos montures, verres et autres produits avec des mises à jour en temps réel',
    ar: 'إدارة الإطارات والعدسات والمنتجات الأخرى مع تحديثات المخزون في الوقت الفعلي'
  },
  ctaTitle: {
    en: 'Join the Leading Optical Management Solution',
    fr: 'Rejoignez la Solution de Gestion Optique de Premier Plan',
    ar: 'انضم إلى الحل الرائد لإدارة البصريات'
  },
  ctaDesc: {
    en: 'Join hundreds of opticians across Morocco and Africa who are streamlining their practice with our comprehensive management system.',
    fr: 'Rejoignez des centaines d\'opticiens à travers le Maroc et l\'Afrique qui rationalisent leur pratique avec notre système de gestion complet.',
    ar: 'انضم إلى مئات أخصائيي البصريات في جميع أنحاء المغرب وأفريقيا الذين يعملون على تبسيط ممارساتهم بنظام إدارتنا الشامل.'
  },
};

const dashboardTranslations: Translations = {
  dashboard: {
    en: 'Dashboard',
    fr: 'Tableau de bord',
    ar: 'لوحة التحكم'
  },
  dashboardSubtitle: {
    en: 'Overview of your optical store performance for',
    fr: 'Aperçu des performances de votre magasin d\'optique pour',
    ar: 'نظرة عامة على أداء متجر البصريات الخاص بك لشهر'
  },
  totalClients: {
    en: 'Total Clients',
    fr: 'Total des Clients',
    ar: 'إجمالي العملاء'
  },
  monthlyRevenue: {
    en: 'Monthly Revenue',
    fr: 'Revenus Mensuels',
    ar: 'الإيرادات الشهرية'
  },
  avgSaleValue: {
    en: 'Avg. Sale Value',
    fr: 'Valeur Moyenne de Vente',
    ar: 'متوسط قيمة البيع'
  },
  outstandingBalance: {
    en: 'Outstanding Balance',
    fr: 'Solde Impayé',
    ar: 'الرصيد المستحق'
  },
  pendingReceipts: {
    en: 'Pending Receipts',
    fr: 'Reçus en Attente',
    ar: 'الإيصالات المعلقة'
  },
  completedReceipts: {
    en: 'Completed Receipts',
    fr: 'Reçus Terminés',
    ar: 'الإيصالات المكتملة'
  },
  montageRevenue: {
    en: 'Montage Revenue',
    fr: 'Revenus de Montage',
    ar: 'إيرادات التركيب'
  },
  productRevenue: {
    en: 'Product Revenue',
    fr: 'Revenus des Produits',
    ar: 'إيرادات المنتجات'
  },
  revenueTrend: {
    en: 'Revenue Trend (Last 7 Days)',
    fr: 'Tendance des Revenus (7 Derniers Jours)',
    ar: 'اتجاه الإيرادات (آخر 7 أيام)'
  },
  revenueByCategory: {
    en: 'Revenue by Category (This Month)',
    fr: 'Revenus par Catégorie (Ce Mois)',
    ar: 'الإيرادات حسب الفئة (هذا الشهر)'
  },
  recentActivity: {
    en: 'Recent Activity',
    fr: 'Activité Récente',
    ar: 'النشاط الأخير'
  },
  loading: {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'جاري التحميل...'
  },
  loadingRecentActivity: {
    en: 'Loading recent activity...',
    fr: 'Chargement de l\'activité récente...',
    ar: 'جاري تحميل النشاط الأخير...'
  },
  noRecentActivity: {
    en: 'No recent activity found.',
    fr: 'Aucune activité récente trouvée.',
    ar: 'لم يتم العثور على نشاط حديث.'
  },
  newClientRegistered: {
    en: 'New client registered',
    fr: 'Nouveau client enregistré',
    ar: 'عميل جديد مسجل'
  },
  newReceiptCreated: {
    en: 'New receipt created',
    fr: 'Nouveau reçu créé',
    ar: 'إيصال جديد تم إنشاؤه'
  },
  newPurchaseRecorded: {
    en: 'New purchase recorded',
    fr: 'Nouvel achat enregistré',
    ar: 'مشتريات جديدة مسجلة'
  },
  unknownClient: {
    en: 'Unknown client',
    fr: 'Client inconnu',
    ar: 'عميل غير معروف'
  },
  unknownSupplier: {
    en: 'Unknown supplier',
    fr: 'Fournisseur inconnu',
    ar: 'مورد غير معروف'
  }
};

const productTranslations: Translations = {
  // Product page UI
  newProduct: {
    en: 'New Product',
    fr: 'Nouveau Produit',
    ar: 'منتج جديد'
  },
  editProduct: {
    en: 'Edit Product',
    fr: 'Modifier le Produit',
    ar: 'تعديل المنتج'
  },
  addProduct: {
    en: 'Add New Product',
    fr: 'Ajouter un Nouveau Produit',
    ar: 'إضافة منتج جديد'
  },
  searchProducts: {
    en: 'Search products...',
    fr: 'Rechercher des produits...',
    ar: 'البحث عن المنتجات...'
  },
  noProductsFound: {
    en: 'No products found',
    fr: 'Aucun produit trouvé',
    ar: 'لا توجد منتجات'
  },
  productName: {
    en: 'Product Name',
    fr: 'Nom du Produit',
    ar: 'اسم المنتج'
  },
  price: {
    en: 'Price',
    fr: 'Prix',
    ar: 'السعر'
  },
  costTTC: {
    en: 'Cost TTC',
    fr: 'Coût TTC',
    ar: 'التكلفة شاملة الضريبة'
  },
  stock: {
    en: 'Stock',
    fr: 'Stock',
    ar: 'المخزون'
  },
  stockStatus: {
    en: 'Stock Status',
    fr: 'État du Stock',
    ar: 'حالة المخزون'
  },
  category: {
    en: 'Category',
    fr: 'Catégorie',
    ar: 'الفئة'
  },
  index: {
    en: 'Index',
    fr: 'Indice',
    ar: 'المؤشر'
  },
  treatment: {
    en: 'Treatment',
    fr: 'Traitement',
    ar: 'المعالجة'
  },
  company: {
    en: 'Company',
    fr: 'Entreprise',
    ar: 'الشركة'
  },
  gamma: {
    en: 'Gamma',
    fr: 'Gamme',
    ar: 'النطاق'
  },
  image: {
    en: 'Image',
    fr: 'Image',
    ar: 'الصورة'
  },
  generateNameAuto: {
    en: 'Generate Name Automatically',
    fr: 'Générer le Nom Automatiquement',
    ar: 'إنشاء الاسم تلقائياً'
  },
  save: {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ'
  },
  cancel: {
    en: 'Cancel',
    fr: 'Annuler',
    ar: 'إلغاء'
  },
  edit: {
    en: 'Edit',
    fr: 'Modifier',
    ar: 'تعديل'
  },
  delete: {
    en: 'Delete',
    fr: 'Supprimer',
    ar: 'حذف'
  },
  import: {
    en: 'Import',
    fr: 'Importer',
    ar: 'استيراد'
  },
  saveAll: {
    en: 'Save All',
    fr: 'Tout Enregistrer',
    ar: 'حفظ الكل'
  },
  auto: {
    en: 'Auto',
    fr: 'Auto',
    ar: 'تلقائي'
  },
  // Category options
  singleVisionLenses: {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple',
    ar: 'عدسات الرؤية المفردة'
  },
  progressiveLenses: {
    en: 'Progressive Lenses',
    fr: 'Verres Progressifs',
    ar: 'العدسات المتقدمة'
  },
  frames: {
    en: 'Frames',
    fr: 'Montures',
    ar: 'الإطارات'
  },
  sunglasses: {
    en: 'Sunglasses',
    fr: 'Lunettes de Soleil',
    ar: 'النظارات الشمسية'
  },
  contactLenses: {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact',
    ar: 'العدسات اللاصقة'
  },
  accessories: {
    en: 'Accessories',
    fr: 'Accessoires',
    ar: 'الإكسسوارات'
  },
  // Treatment options
  white: {
    en: 'White',
    fr: 'Blanc',
    ar: 'أبيض'
  },
  ar: {
    en: 'AR',
    fr: 'AR',
    ar: 'AR'
  },
  blue: {
    en: 'Blue',
    fr: 'Bleu',
    ar: 'أزرق'
  },
  photochromic: {
    en: 'Photochromic',
    fr: 'Photochromique',
    ar: 'فوتوكروميك'
  },
  // Stock status options
  order: {
    en: 'Order',
    fr: 'Commande',
    ar: 'طلب'
  },
  inStock: {
    en: 'In Stock',
    fr: 'En Stock',
    ar: 'متوفر'
  },
  fabrication: {
    en: 'Fabrication',
    fr: 'Fabrication',
    ar: 'تصنيع'
  },
  outOfStock: {
    en: 'Out Of Stock',
    fr: 'Rupture de Stock',
    ar: 'نفد المخزون'
  },
  // Common options
  none: {
    en: 'None',
    fr: 'Aucun',
    ar: 'لا شيء'
  },
  selectCategory: {
    en: 'Select Category',
    fr: 'Sélectionner une Catégorie',
    ar: 'اختر الفئة'
  },
  selectIndex: {
    en: 'Select Index',
    fr: 'Sélectionner un Indice',
    ar: 'اختر المؤشر'
  },
  selectTreatment: {
    en: 'Select Treatment',
    fr: 'Sélectionner un Traitement',
    ar: 'اختر المعالجة'
  },
  selectCompany: {
    en: 'Select Company',
    fr: 'Sélectionner une Entreprise',
    ar: 'اختر الشركة'
  },
  selectStockStatus: {
    en: 'Select Stock Status',
    fr: 'Sélectionner l\'État du Stock',
    ar: 'اختر حالة المخزون'
  },
  enterGamma: {
    en: 'Enter gamma value',
    fr: 'Entrer la valeur de gamme',
    ar: 'أدخل قيمة النطاق'
  },
  uploading: {
    en: 'Uploading...',
    fr: 'Téléchargement...',
    ar: 'جاري الرفع...'
  }
};

const pricingTranslations: Translations = {
  pricingTitle: {
    en: 'Pricing Plans',
    fr: 'Plans Tarifaires',
    ar: 'خطط التسعير'
  },
  pricingSubtitle: {
    en: 'Choose the perfect plan for your optical business needs',
    fr: 'Choisissez le plan parfait pour les besoins de votre entreprise optique',
    ar: 'اختر الخطة المثالية لاحتياجات عملك البصري'
  },
  monthly: {
    en: 'Monthly',
    fr: 'Mensuel',
    ar: 'شهري'
  },
  quarterly: {
    en: 'Quarterly',
    fr: 'Trimestriel',
    ar: 'ربع سنوي'
  },
  lifetime: {
    en: 'Lifetime',
    fr: 'À vie',
    ar: 'مدى الحياة'
  },
  monthlySubscription: {
    en: 'Monthly subscription',
    fr: 'Abonnement mensuel',
    ar: 'اشتراك شهري'
  },
  quarterlySubscription: {
    en: 'Quarterly subscription',
    fr: 'Abonnement trimestriel',
    ar: 'اشتراك ربع سنوي'
  },
  oneTimePayment: {
    en: 'One-time payment',
    fr: 'Paiement unique',
    ar: 'دفعة لمرة واحدة'
  },
  fullAccess: {
    en: 'Full access to all features',
    fr: 'Accès complet à toutes les fonctionnalités',
    ar: 'وصول كامل إلى جميع الميزات'
  },
  monthlyBilling: {
    en: 'Monthly billing',
    fr: 'Facturation mensuelle',
    ar: 'فواتير شهرية'
  },
  quarterlyBilling: {
    en: 'Quarterly billing',
    fr: 'Facturation trimestrielle',
    ar: 'فواتير ربع سنوية'
  },
  prioritySupport: {
    en: 'Priority support',
    fr: 'Support prioritaire',
    ar: 'دعم ذو أولوية'
  },
  unlimitedUpdates: {
    en: 'Unlimited updates',
    fr: 'Mises à jour illimitées',
    ar: 'تحديثات غير محدودة'
  },
  noRecurring: {
    en: 'No recurring payments',
    fr: 'Pas de paiements récurrents',
    ar: 'لا مدفوعات متكررة'
  },
  lifetimeAccess: {
    en: 'Lifetime access',
    fr: 'Accès à vie',
    ar: 'وصول مدى الحياة'
  },
  save: {
    en: 'Save 11% vs monthly',
    fr: 'Économisez 11% par rapport au mensuel',
    ar: 'وفر 11٪ مقارنة بالاشتراك الشهري'
  },
  currentPlan: {
    en: 'Current Plan',
    fr: 'Plan Actuel',
    ar: 'الخطة الحالية'
  },
  startFreeTrial: {
    en: 'Start Free Trial',
    fr: 'Commencer l\'essai gratuit',
    ar: 'بدء النسخة التجريبية المجانية'
  },
  purchaseNow: {
    en: 'Purchase Now',
    fr: 'Acheter maintenant',
    ar: 'اشتر الآن'
  },
};

// Combine all translations
const allTranslations: Translations = {
  ...homeTranslations,
  ...dashboardTranslations,
  ...productTranslations,
  ...pricingTranslations,
  navigation: {
    en: {
      home: 'Home',
      products: 'Products',
      receipts: 'Receipts',
      purchases: 'Purchases',
      dashboard: 'Dashboard',
      subscriptions: 'Subscriptions',
      settings: 'Settings',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
    },
    fr: {
      home: 'Accueil',
      products: 'Produits',
      receipts: 'Reçus',
      purchases: 'Achats',
      dashboard: 'Tableau de bord',
      subscriptions: 'Abonnements',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      login: 'Connexion',
      register: 'S\'inscrire',
    },
    ar: {
      home: 'الرئيسية',
      products: 'منتجات',
      receipts: 'إيصالات',
      purchases: 'المشتريات',
      dashboard: 'لوحة التحكم',
      subscriptions: 'الاشتراكات',
      settings: 'إعدادات',
      logout: 'تسجيل الخروج',
      login: 'تسجيل الدخول',
      register: 'تسجيل',
    },
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  translations: allTranslations,
  direction: 'ltr',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage if available
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);

    // Set document direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

    // Set html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    if (!allTranslations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return allTranslations[key][language];
  };

  const direction = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: allTranslations, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};