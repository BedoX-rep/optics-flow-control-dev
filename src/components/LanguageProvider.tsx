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
  saveButton: {
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
  },
  // Additional client page translations
  saveAllChanges: {
    en: 'Save All Changes',
    fr: 'Enregistrer Toutes les Modifications',
    ar: 'حفظ جميع التغييرات'
  },
  sortBy: {
    en: 'Sort By',
    fr: 'Trier Par',
    ar: 'ترتيب حسب'
  },
  nameAZ: {
    en: 'Name (A-Z)',
    fr: 'Nom (A-Z)',
    ar: 'الاسم (أ-ي)'
  },
  recentlyAdded: {
    en: 'Recently Added',
    fr: 'Ajouté Récemment',
    ar: 'المضاف حديثاً'
  },
  findDuplicates: {
    en: 'Find Duplicates',
    fr: 'Trouver les Doublons',
    ar: 'العثور على التكرارات'
  },
  noClientsMatchSearch: {
    en: 'No clients match your search',
    fr: 'Aucun client ne correspond à votre recherche',
    ar: 'لا يوجد عملاء يطابقون بحثك'
  },
  noClientsYet: {
    en: 'You haven\'t added any clients yet',
    fr: 'Vous n\'avez pas encore ajouté de clients',
    ar: 'لم تقم بإضافة أي عملاء بعد'
  },
  addFirstClient: {
    en: 'Add Your First Client',
    fr: 'Ajouter Votre Premier Client',
    ar: 'أضف عميلك الأول'
  },
  previous: {
    en: 'Previous',
    fr: 'Précédent',
    ar: 'السابق'
  },
  next: {
    en: 'Next',
    fr: 'Suivant',
    ar: 'التالي'
  },
  showingClients: {
    en: 'Showing {start}-{end} of {total} clients',
    fr: 'Affichage de {start}-{end} sur {total} clients',
    ar: 'عرض {start}-{end} من {total} عملاء'
  },
  deleteClient: {
    en: 'Delete Client',
    fr: 'Supprimer le Client',
    ar: 'حذف العميل'
  },
  deleteConfirmation: {
    en: 'Are you sure you want to delete {clientName}? This action cannot be undone.',
    fr: 'Êtes-vous sûr de vouloir supprimer {clientName}? Cette action ne peut pas être annulée.',
    ar: 'هل أنت متأكد من أنك تريد حذف {clientName}؟ لا يمكن التراجع عن هذا الإجراء.'
  },
  duplicateClientsFound: {
    en: 'Duplicate Clients Found',
    fr: 'Clients en Double Trouvés',
    ar: 'تم العثور على عملاء مكررين'
  },
  duplicateExplanation: {
    en: 'Found {count} duplicate clients with the same phone number. Would you like to remove the duplicates?',
    fr: 'Trouvé {count} clients en double avec le même numéro de téléphone. Voulez-vous supprimer les doublons?',
    ar: 'تم العثور على {count} عملاء مكررين بنفس رقم الهاتف. هل تريد إزالة التكرارات؟'
  },
  deleteDuplicates: {
    en: 'Delete Duplicates',
    fr: 'Supprimer les Doublons',
    ar: 'حذف التكرارات'
  },
  enterClientName: {
    en: 'Enter client name',
    fr: 'Entrer le nom du client',
    ar: 'أدخل اسم العميل'
  },
  enterPhoneNumber: {
    en: 'Enter phone number',
    fr: 'Entrer le numéro de téléphone',
    ar: 'أدخل رقم الهاتف'
  },
  assurance: {
    en: 'Assurance',
    fr: 'Assurance',
    ar: 'التأمين'
  },
  notes: {
    en: 'Notes',
    fr: 'Notes',
    ar: 'ملاحظات'
  },
  rightEyeShort: {
    en: 'Right Eye',
    fr: 'Œil Droit',
    ar: 'العين اليمنى'
  },
  leftEyeShort: {
    en: 'Left Eye',
    fr: 'Œil Gauche',
    ar: 'العين اليسرى'
  },
  addedOn: {
    en: 'Added on',
    fr: 'Ajouté le',
    ar: 'أضيف في'
  },
  purchaseHistory: {
    en: 'Purchase History',
    fr: 'Historique d\'Achat',
    ar: 'تاريخ الشراء'
  },
  noPurchaseHistory: {
    en: 'No purchase history available',
    fr: 'Aucun historique d\'achat disponible',
    ar: 'لا يوجد تاريخ شراء متاح'
  }
};

const clientsTranslations: Translations = {
  // Clients page UI
  clients: {
    en: 'Clients',
    fr: 'Clients',
    ar: 'العملاء'
  },
  newClient: {
    en: 'New Client',
    fr: 'Nouveau Client',
    ar: 'عميل جديد'
  },
  addClient: {
    en: 'Add Client',
    fr: 'Ajouter un Client',
    ar: 'إضافة عميل'
  },
  editClient: {
    en: 'Edit Client',
    fr: 'Modifier le Client',
    ar: 'تعديل العميل'
  },
  searchClients: {
    en: 'Search clients...',
    fr: 'Rechercher des clients...',
    ar: 'البحث عن العملاء...'
  },
  noClientsFound: {
    en: 'No clients found',
    fr: 'Aucun client trouvé',
    ar: 'لا يوجد عملاء'
  },
  clientName: {
    en: 'Client Name',
    fr: 'Nom du Client',
    ar: 'اسم العميل'
  },
  firstName: {
    en: 'First Name',
    fr: 'Prénom',
    ar: 'الاسم الأول'
  },
  lastName: {
    en: 'Last Name',
    fr: 'Nom de Famille',
    ar: 'اسم العائلة'
  },
  phoneNumber: {
    en: 'Phone Number',
    fr: 'Numéro de Téléphone',
    ar: 'رقم الهاتف'
  },
  email: {
    en: 'Email',
    fr: 'Email',
    ar: 'البريد الإلكتروني'
  },
  address: {
    en: 'Address',
    fr: 'Adresse',
    ar: 'العنوان'
  },
  dateOfBirth: {
    en: 'Date of Birth',
    fr: 'Date de Naissance',
    ar: 'تاريخ الميلاد'
  },
  gender: {
    en: 'Gender',
    fr: 'Sexe',
    ar: 'الجنس'
  },
  male: {
    en: 'Male',
    fr: 'Masculin',
    ar: 'ذكر'
  },
  female: {
    en: 'Female',
    fr: 'Féminin',
    ar: 'أنثى'
  },
  selectGender: {
    en: 'Select Gender',
    fr: 'Sélectionner le Sexe',
    ar: 'اختر الجنس'
  },
  eyePrescription: {
    en: 'Eye Prescription',
    fr: 'Prescription Oculaire',
    ar: 'وصفة العيون'
  },
  rightEye: {
    en: 'Right Eye (OD)',
    fr: 'Œil Droit (OD)',
    ar: 'العين اليمنى'
  },
  leftEye: {
    en: 'Left Eye (OS)',
    fr: 'Œil Gauche (OS)',
    ar: 'العين اليسرى'
  },
  sphere: {
    en: 'Sphere (SPH)',
    fr: 'Sphère (SPH)',
    ar: 'الكرة'
  },
  cylinder: {
    en: 'Cylinder (CYL)',
    fr: 'Cylindre (CYL)',
    ar: 'الأسطوانة'
  },
  axis: {
    en: 'Axis',
    fr: 'Axe',
    ar: 'المحور'
  },
  pupillaryDistance: {
    en: 'Pupillary Distance (PD)',
    fr: 'Distance Pupillaire (PD)',
    ar: 'المسافة بين الحدقتين'
  },
  totalBalance: {
    en: 'Total Balance',
    fr: 'Solde Total',
    ar: 'الرصيد الإجمالي'
  },
  lastVisit: {
    en: 'Last Visit',
    fr: 'Dernière Visite',
    ar: 'آخر زيارة'
  },
  viewDetails: {
    en: 'View Details',
    fr: 'Voir les Détails',
    ar: 'عرض التفاصيل'
  },
  callClient: {
    en: 'Call Client',
    fr: 'Appeler le Client',
    ar: 'اتصال بالعميل'
  },
  whatsappClient: {
    en: 'WhatsApp Client',
    fr: 'WhatsApp Client',
    ar: 'واتساب العميل'
  },
  clientDetails: {
    en: 'Client Details',
    fr: 'Détails du Client',
    ar: 'تفاصيل العميل'
  },
  receiptHistory: {
    en: 'Receipt History',
    fr: 'Historique des Reçus',
    ar: 'تاريخ الإيصالات'
  },
  noReceiptsFound: {
    en: 'No receipts found for this client',
    fr: 'Aucun reçu trouvé pour ce client',
    ar: 'لا توجد إيصالات لهذا العميل'
  },
  receiptNumber: {
    en: 'Receipt #',
    fr: 'Reçu #',
    ar: 'إيصال #'
  },
  date: {
    en: 'Date',
    fr: 'Date',
    ar: 'التاريخ'
  },
  amount: {
    en: 'Amount',
    fr: 'Montant',
    ar: 'المبلغ'
  },
  status: {
    en: 'Status',
    fr: 'Statut',
    ar: 'الحالة'
  },
  balance: {
    en: 'Balance',
    fr: 'Solde',
    ar: 'الرصيد'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé',
    ar: 'مدفوع'
  },
  pending: {
    en: 'Pending',
    fr: 'En Attente',
    ar: 'في الانتظار'
  },
  partial: {
    en: 'Partial',
    fr: 'Partiel',
    ar: 'جزئي'
  },
  dh: {
    en: 'DH',
    fr: 'DH',
    ar: 'درهم'
  },
  noRecentActivity: {
    en: 'No recent activity',
    fr: 'Aucune activité récente',
    ar: 'لا يوجد نشاط حديث'
  },
  never: {
    en: 'Never',
    fr: 'Jamais',
    ar: 'أبداً'
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
  saveVsMonthly: {
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
  ...clientsTranslations,
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