import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

type Translations = {
  [key: string]: {
    en: string;
    fr: string;
  };
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translate: (key: string) => string;
  translations: Translations;
  direction: 'ltr';
}

const homeTranslations: Translations = {
  heroTitle: {
    en: 'Optical Software For All Your Eye Care Needs',
    fr: 'Logiciel Optique Pour Tous Vos Besoins En Soins Oculaires'
  },
  heroSubtitle: {
    en: 'Effortlessly manage all your client needs and prepare prescription lenses within seconds. The best eye care management software get your exact data-backed prescription within seconds',
    fr: 'Gérez sans effort tous les besoins de vos clients et préparez des verres de prescription en quelques secondes. Le meilleur logiciel de gestion des soins oculaires vous donne votre prescription exacte en quelques secondes'
  },
  startFreeTrial: {
    en: 'START A FREE TRIAL',
    fr: 'COMMENCER UN ESSAI GRATUIT'
  },
  freeTrialCta: {
    en: 'Start Free Trial Today',
    fr: 'Commencez l\'essai gratuit aujourd\'hui'
  },
  signInRegister: {
    en: 'Sign In / Register',
    fr: 'Se connecter / S\'inscrire'
  },
  goToDashboard: {
    en: 'Go to Dashboard',
    fr: 'Aller au tableau de bord'
  },
  features: {
    en: 'Features',
    fr: 'Fonctionnalités'
  },
  pricing: {
    en: 'Pricing',
    fr: 'Tarification'
  },
  effortlessTitle: {
    en: 'Effortless, Fast, And Simple!',
    fr: 'Sans effort, rapide et simple!'
  },
  effortlessDesc: {
    en: 'Running an optical salon is a complex task. You need optical software that simplifies your daily operations while enhancing your services — both in quality and quantity. Lensly is incredibly intuitive, helping you find the perfect lenses for every client.',
    fr: 'Gérer un salon d\'optique est une tâche complexe. Vous avez besoin d\'un logiciel optique qui simplifie vos opérations quotidiennes tout en améliorant vos services — en qualité et en quantité. Lensly est incroyablement intuitif, vous aidant à trouver les lentilles parfaites pour chaque client.'
  },
  powerfulFeatures: {
    en: 'Powerful Features',
    fr: 'Fonctionnalités Puissantes'
  },
  featuresSubtitle: {
    en: 'Our platform provides everything you need to manage your optical business efficiently',
    fr: 'Notre plateforme fournit tout ce dont vous avez besoin pour gérer efficacement votre entreprise d\'optique'
  },
  clientManagement: {
    en: 'Client Management',
    fr: 'Gestion des Clients'
  },
  clientManagementDesc: {
    en: 'Track client histories, appointments, and prescriptions in one place',
    fr: 'Suivez l\'historique des clients, les rendez-vous et les prescriptions en un seul endroit'
  },
  inventoryControl: {
    en: 'Inventory Control',
    fr: 'Contrôle des Stocks'
  },
  inventoryControlDesc: {
    en: 'Manage your frames, lenses, and other products with real-time stock updates',
    fr: 'Gérez vos montures, verres et autres produits avec des mises à jour en temps réel'
  },
  simplifiedBilling: {
    en: 'Simplified Billing',
    fr: 'Facturation Simplifiée'
  },
  simplifiedBillingDesc: {
    en: 'Create and manage receipts, invoices, and track payments efficiently',
    fr: 'Créez et gérez les reçus, factures et suivez les paiements efficacement'
  },
  prescriptionManagement: {
    en: 'Prescription Management',
    fr: 'Gestion des Prescriptions'
  },
  prescriptionManagementDesc: {
    en: 'Easily record and track patient prescriptions and changes over time',
    fr: 'Enregistrez et suivez facilement les prescriptions des patients et leurs modifications dans le temps'
  },
  statistics: {
    en: 'Statistics',
    fr: 'Statistiques'
  },
  statisticsDesc: {
    en: 'Comprehensive analytics and reporting on your business performance',
    fr: 'Analyses complètes et rapports sur les performances de votre entreprise'
  },
  accessControl: {
    en: 'Access Control',
    fr: 'Contrôle d\'Accès'
  },
  accessControlDesc: {
    en: 'Manage user permissions and control access to sensitive data',
    fr: 'Gérez les autorisations des utilisateurs et contrôlez l\'accès aux données sensibles'
  },
  ctaTitle: {
    en: 'Join the Leading Optical Management Solution',
    fr: 'Rejoignez la Solution de Gestion Optique de Premier Plan'
  },
  ctaDesc: {
    en: 'Join hundreds of opticians across Morocco and Africa who are streamlining their practice with our comprehensive management system.',
    fr: 'Rejoignez des centaines d\'opticiens à travers le Maroc et l\'Afrique qui rationalisent leur pratique avec notre système de gestion complet.'
  },
};

const dashboardTranslations: Translations = {
  dashboard: {
    en: 'Dashboard',
    fr: 'Tableau de bord'
  },
  dashboardSubtitle: {
    en: 'Overview of your optical store performance for',
    fr: 'Aperçu des performances de votre magasin d\'optique pour'
  },
  totalClients: {
    en: 'Total Clients',
    fr: 'Total des Clients'
  },
  monthlyRevenue: {
    en: 'Monthly Revenue',
    fr: 'Revenus Mensuels'
  },
  avgSaleValue: {
    en: 'Avg. Sale Value',
    fr: 'Valeur Moyenne de Vente'
  },
  outstandingBalance: {
    en: 'Outstanding Balance',
    fr: 'Solde Impayé'
  },
  pendingReceipts: {
    en: 'Pending Receipts',
    fr: 'Reçus en Attente'
  },
  completedReceipts: {
    en: 'Completed Receipts',
    fr: 'Reçus Terminés'
  },
  montageRevenue: {
    en: 'Montage Revenue',
    fr: 'Revenus de Montage'
  },
  productRevenue: {
    en: 'Product Revenue',
    fr: 'Revenus des Produits'
  },
  revenueTrend: {
    en: 'Revenue Trend (Last 7 Days)',
    fr: 'Tendance des Revenus (7 Derniers Jours)'
  },
  revenueByCategory: {
    en: 'Revenue by Category (This Month)',
    fr: 'Revenus par Catégorie (Ce Mois)'
  },
  recentActivity: {
    en: 'Recent Activity',
    fr: 'Activité Récente'
  },
  loading: {
    en: 'Loading...',
    fr: 'Chargement...'
  },
  loadingRecentActivity: {
    en: 'Loading recent activity...',
    fr: 'Chargement de l\'activité récente...'
  },
  noRecentActivity: {
    en: 'No recent activity found.',
    fr: 'Aucune activité récente trouvée.'
  },
  newClientRegistered: {
    en: 'New client registered',
    fr: 'Nouveau client enregistré'
  },
  newReceiptCreated: {
    en: 'New receipt created',
    fr: 'Nouveau reçu créé'
  },
  newPurchaseRecorded: {
    en: 'New purchase recorded',
    fr: 'Nouvel achat enregistré'
  },
  unknownClient: {
    en: 'Unknown client',
    fr: 'Client inconnu'
  },
  unknownSupplier: {
    en: 'Unknown supplier',
    fr: 'Fournisseur inconnu'
  }
};

const productTranslations: Translations = {
  // Product page UI
  newProduct: {
    en: 'New Product',
    fr: 'Nouveau Produit'
  },
  editProduct: {
    en: 'Edit Product',
    fr: 'Modifier le Produit'
  },
  addProduct: {
    en: 'Add New Product',
    fr: 'Ajouter un Nouveau Produit'
  },
  searchProducts: {
    en: 'Search products...',
    fr: 'Rechercher des produits...'
  },
  noProductsFound: {
    en: 'No products found',
    fr: 'Aucun produit trouvé'
  },
  productName: {
    en: 'Product Name',
    fr: 'Nom du Produit'
  },
  price: {
    en: 'Price',
    fr: 'Prix'
  },
  costTTC: {
    en: 'Cost TTC',
    fr: 'Coût TTC'
  },
  stock: {
    en: 'Stock',
    fr: 'Stock'
  },
  stockStatus: {
    en: 'Stock Status',
    fr: 'État du Stock'
  },
  category: {
    en: 'Category',
    fr: 'Catégorie'
  },
  index: {
    en: 'Index',
    fr: 'Indice'
  },
  treatment: {
    en: 'Treatment',
    fr: 'Traitement'
  },
  company: {
    en: 'Company',
    fr: 'Entreprise'
  },
  gamma: {
    en: 'Gamma',
    fr: 'Gamme'
  },
  image: {
    en: 'Image',
    fr: 'Image'
  },
  generateNameAuto: {
    en: 'Generate Name Automatically',
    fr: 'Générer le Nom Automatiquement'
  },
  save: {
    en: 'Save',
    fr: 'Enregistrer'
  },
  saveButton: {
    en: 'Save',
    fr: 'Enregistrer'
  },
  cancel: {
    en: 'Cancel',
    fr: 'Annuler'
  },
  edit: {
    en: 'Edit',
    fr: 'Modifier'
  },
  delete: {
    en: 'Delete',
    fr: 'Supprimer'
  },
  import: {
    en: 'Import',
    fr: 'Importer'
  },
  saveAll: {
    en: 'Save All',
    fr: 'Tout Enregistrer'
  },
  auto: {
    en: 'Auto',
    fr: 'Auto'
  },
  // Category options
  singlevisionlenses: {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple'
  },
  progressivelenses: {
    en: 'Progressive Lenses',
    fr: 'Verres Progressifs'
  },
  frames: {
    en: 'Frames',
    fr: 'Montures'
  },
  sunglasses: {
    en: 'Sunglasses',
    fr: 'Lunettes de Soleil'
  },
  contactlenses: {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  'Contact Lenses': {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  accessories: {
    en: 'Accessories',
    fr: 'Accessoires'
  },
  // Category filter options
  allCategories: {
    en: 'All Categories',
    fr: 'Toutes les Catégories'
  },
  singleVisionLenses: {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple'
  },
  progressiveLenses: {
    en: 'Progressive Lenses',
    fr: 'Verres Progressifs'
  },
  // Additional category variations
  'Single Vision Lenses': {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple'
  },
  'Progressive Lenses': {
    en: 'Progressive Lenses',
    fr: 'Verres Progressifs'
  },
  'Frames': {
    en: 'Frames',
    fr: 'Montures'
  },
  'Sunglasses': {
    en: 'Sunglasses',
    fr: 'Lunettes de Soleil'
  },
  'Contact Lenses': {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  'Accessories': {
    en: 'Accessories',
    fr: 'Accessoires'
  },
  'Service': {
    en: 'Service',
    fr: 'Service'
  },
  'Other': {
    en: 'Other',
    fr: 'Autre'
  },
  // ProductFilters translation keys
  filterCategory: {
    en: 'Category',
    fr: 'Catégorie'
  },
  filterIndex: {
    en: 'Index',
    fr: 'Indice'
  },
  filterTreatment: {
    en: 'Treatment',
    fr: 'Traitement'
  },
  filterCompany: {
    en: 'Company',
    fr: 'Entreprise'
  },
  filterStock: {
    en: 'Stock',
    fr: 'Stock'
  },
  // Category translations for filters
  singlevisionlenses: {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple'
  },
  progressivelenses: {
    en: 'Progressive Lenses',
    fr: 'Verres Progressifs'
  },
  frames: {
    en: 'Frames',
    fr: 'Montures'
  },
  sunglasses: {
    en: 'Sunglasses',
    fr: 'Lunettes de Soleil'
  },
  contactlenses: {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  accessories: {
    en: 'Accessories',
    fr: 'Accessoires'
  },
  service: {
    en: 'Service',
    fr: 'Service'
  },
  other: {
    en: 'Other',
    fr: 'Autre'
  },
  // Treatment translations for filters
  white: {
    en: 'White',
    fr: 'Blanc'
  },
  ar: {
    en: 'AR',
    fr: 'AR'
  },
  blue: {
    en: 'Blue',
    fr: 'Bleu'
  },
  photochromic: {
    en: 'Photochromic',
    fr: 'Photochromique'
  },
  polarized: {
    en: 'Polarized',
    fr: 'Polarisé'
  },
  'uv protection': {
    en: 'UV Protection',
    fr: 'Protection UV'
  },
  uvprotection: {
    en: 'UV Protection',
    fr: 'Protection UV'
  },
  tint: {
    en: 'Tint',
    fr: 'Teinte'
  },
  // Index filter options
  allIndexes: {
    en: 'All Indexes',
    fr: 'Tous les Indices'
  },
  '1.56': {
    en: '1.56',
    fr: '1.56'
  },
  '1.6': {
    en: '1.6',
    fr: '1.6'
  },
  '1.67': {
    en: '1.67',
    fr: '1.67'
  },
  '1.74': {
    en: '1.74',
    fr: '1.74'
  },
  // Treatment filter options
  allTreatments: {
    en: 'All Treatments',
    fr: 'Tous les Traitements'
  },
  'White': {
    en: 'White',
    fr: 'Blanc'
  },
  'AR': {
    en: 'AR',
    fr: 'AR'
  },
  'Blue': {
    en: 'Blue',
    fr: 'Bleu'
  },
  'Photochromic': {
    en: 'Photochromic',
    fr: 'Photochromique'
  },
  // Company filter options
  allCompanies: {
    en: 'All Companies',
    fr: 'Toutes les Entreprises'
  },
  'Indo': {
    en: 'Indo',
    fr: 'Indo'
  },
  'ABlens': {
    en: 'ABlens',
    fr: 'ABlens'
  },
  'Essilor': {
    en: 'Essilor',
    fr: 'Essilor'
  },
  'GLASSANDLENS': {
    en: 'GLASSANDLENS',
    fr: 'GLASSANDLENS'
  },
  'Optifak': {
    en: 'Optifak',
    fr: 'Optifak'
  },
  // Stock status filter options
  allStockStatuses: {
    en: 'All Stock Statuses',
    fr: 'Tous les États de Stock'
  },
  'Order': {
    en: 'Order',
    fr: 'Commande'
  },
  'inStock': {
    en: 'In Stock',
    fr: 'En Stock'
  },
  'Fabrication': {
    en: 'Fabrication',
    fr: 'Fabrication'
  },
  'Out Of Stock': {
    en: 'Out Of Stock',
    fr: 'Rupture de Stock'
  },
  category: {
    en: 'Category',
    fr: 'Catégorie'
  },
  purchaseType: {
    en: 'Purchase Type',
    fr: 'Type d\'Achat'
  },
  // Treatment options
  white: {
    en: 'White',
    fr: 'Blanc'
  },
  ar: {
    en: 'AR',
    fr: 'AR'
  },
  blue: {
    en: 'Blue',
    fr: 'Bleu'
  },
  photochromic: {
    en: 'Photochromic',
    fr: 'Photochromique'
  },
  polarized: {
    en: 'Polarized',
    fr: 'Polarisé'
  },
  uvProtection: {
    en: 'UV Protection',
    fr: 'Protection UV'
  },
  tint: {
    en: 'Tint',
    fr: 'Teinte'
  },
  // Stock status options
  order: {
    en: 'Order',
    fr: 'Commande'
  },
  inStock: {
    en: 'In Stock',
    fr: 'En Stock'
  },
  fabrication: {
    en: 'Fabrication',
    fr: 'Fabrication'
  },
  outOfStock: {
    en: 'Out Of Stock',
    fr: 'Rupture de Stock'
  },
  // Common options
  none: {
    en: 'None',
    fr: 'Aucun'
  },
  selectCategory: {
    en: 'Select Category',
    fr: 'Sélectionner une Catégorie'
  },
  selectIndex: {
    en: 'Select Index',
    fr: 'Sélectionner un Indice'
  },
  selectTreatment: {
    en: 'Select Treatment',
    fr: 'Sélectionner un Traitement'
  },
  selectCompany: {
    en: 'Select Company',
    fr: 'Sélectionner une Entreprise'
  },
  selectStockStatus: {
    en: 'Select Stock Status',
    fr: 'Sélectionner l\'État du Stock'
  },
  enterGamma: {
    en: 'Enter gamma value',
    fr: 'Entrer la valeur de gamme'
  },
  uploading: {
    en: 'Uploading...',
    fr: 'Téléchargement...'
  },
  // Receipt Edit Dialog translations
  editReceipt: {
    en: 'Edit Receipt',
    fr: 'Modifier le Reçu'
  },
  clientInformation: {
    en: 'Client Information',
    fr: 'Informations du Client'
  },
  prescriptionDetails: {
    en: 'Prescription Details',
    fr: 'Détails de la Prescription'
  },
  rightEye: {
    en: 'Right Eye',
    fr: 'Œil Droit'
  },
  leftEye: {
    en: 'Left Eye',
    fr: 'Œil Gauche'
  },
  orderStatus: {
    en: 'Order Status',
    fr: 'Statut de la Commande'
  },
  deliveryStatus: {
    en: 'Delivery Status',
    fr: 'Statut de Livraison'
  },
  orderType: {
    en: 'Order Type',
    fr: 'Type de Commande'
  },
  montageStatus: {
    en: 'Montage Status',
    fr: 'Statut de Montage'
  },
  financialDetails: {
    en: 'Financial Details',
    fr: 'Détails Financiers'
  },
  montageCosts: {
    en: 'Montage Costs',
    fr: 'Coûts de Montage'
  },
  totalDiscount: {
    en: 'Total Discount',
    fr: 'Remise Totale'
  },
  tax: {
    en: 'Tax',
    fr: 'Taxe'
  },
  advancePayment: {
    en: 'Advance Payment',
    fr: 'Paiement d\'Avance'
  },
  items: {
    en: 'Items',
    fr: 'Articles'
  },
  productLink: {
    en: 'Product Link',
    fr: 'Lien Produit'
  },
  unknownProduct: {
    en: 'Unknown Product',
    fr: 'Produit Inconnu'
  },
  unlink: {
    en: 'Unlink',
    fr: 'Délier'
  },
  linkToProduct: {
    en: 'Link to a product...',
    fr: 'Lier à un produit...'
  },
  searchProducts: {
    en: 'Search products...',
    fr: 'Rechercher des produits...'
  },
  noProductsFound: {
    en: 'No products found',
    fr: 'Aucun produit trouvé'
  },
  itemName: {
    en: 'Item Name',
    fr: 'Nom de l\'Article'
  },
  enterItemName: {
    en: 'Enter item name',
    fr: 'Entrer le nom de l\'article'
  },
  quantity: {
    en: 'Quantity',
    fr: 'Quantité'
  },
  price: {
    en: 'Price (DH)',
    fr: 'Prix (DH)'
  },
  cost: {
    en: 'Cost (DH)',
    fr: 'Coût (DH)'
  },
  total: {
    en: 'Total',
    fr: 'Total'
  },
  paidAtDelivery: {
    en: 'Paid at Delivery',
    fr: 'Payé à la Livraison'
  },
  eye: {
    en: 'Eye:',
    fr: 'Œil:'
  },
  none: {
    en: 'None',
    fr: 'Aucun'
  },
  profit: {
    en: 'Profit:',
    fr: 'Bénéfice:'
  },
  cancel: {
    en: 'Cancel',
    fr: 'Annuler'
  },
  updating: {
    en: 'Updating...',
    fr: 'Mise à jour...'
  },
  updateReceipt: {
    en: 'Update Receipt',
    fr: 'Mettre à Jour le Reçu'
  },
  receiptUpdatedSuccessfully: {
    en: 'Receipt updated successfully',
    fr: 'Reçu mis à jour avec succès'
  },
  failedToUpdateReceipt: {
    en: 'Failed to update receipt',
    fr: 'Échec de la mise à jour du reçu'
  },
  selectStatus: {
    en: 'Select status',
    fr: 'Sélectionner le statut'
  },
  selectOrderType: {
    en: 'Select order type',
    fr: 'Sélectionner le type de commande'
  },
  // Receipt Details Mini Dialog translations
  paymentStatus: {
    en: 'Payment:',
    fr: 'Paiement:'
  },
  deliveryLabel: {
    en: 'Delivery:',
    fr: 'Livraison:'
  },
  montageLabel: {
    en: 'Montage:',
    fr: 'Montage:'
  },
  prescription: {
    en: 'Prescription',
    fr: 'Prescription'
  },
  rightEyeLabel: {
    en: 'Right Eye',
    fr: 'Œil Droit'
  },
  leftEyeLabel: {
    en: 'Left Eye',
    fr: 'Œil Gauche'
  },
  sph: {
    en: 'SPH:',
    fr: 'SPH:'
  },
  cyl: {
    en: 'CYL:',
    fr: 'CYL:'
  },
  axe: {
    en: 'AXE:',
    fr: 'AXE:'
  },
  subtotal: {
    en: 'Subtotal:',
    fr: 'Sous-total:'
  },
  taxBaseAmount: {
    en: 'Tax Base Amount:',
    fr: 'Montant de Base Taxable:'
  },
  totalDiscountLabel: {
    en: 'Total Discount',
    fr: 'Remise Totale'
  },
  productsCost: {
    en: 'Products Cost:',
    fr: 'Coût des Produits:'
  },
  totalCostTTC: {
    en: 'Total Cost (TTC):',
    fr: 'Coût Total (TTC):'
  },
  profitLabel: {
    en: 'Profit:',
    fr: 'Bénéfice:'
  },
  balanceLabel: {
    en: 'Balance:',
    fr: 'Solde:'
  },
  managePersonalPreferences: {
    en: 'Manage your personal preferences and settings',
    fr: 'Gérez vos préférences personnelles et paramètres'
  },
  manualAdditionalCosts: {
    en: 'Manual Additional Costs',
    fr: 'Coûts Supplémentaires Manuels'
  },
  additionalCostsSettings: {
    en: 'Additional Costs Settings',
    fr: 'Paramètres des Coûts Supplémentaires'
  },
  currentSettings: {
    en: 'Current Settings',
    fr: 'Paramètres Actuels'
  },
  singleVisionLensCost: {
    en: 'Single Vision Lens Cost',
    fr: 'Coût Verres Simple Vision'
  },
  svLensCostDesc: {
    en: 'Cost per SV lens for Montage orders',
    fr: 'Coût par verre SV pour commandes Montage'
  },
  progressiveLensCost: {
    en: 'Progressive Lens Cost', 
    fr: 'Coût Verres Progressifs'
  },
  progressiveCostDesc: {
    en: 'Cost per progressive lens for Montage orders',
    fr: 'Coût par verre progressif pour commandes Montage'
  },
  framesCost: {
    en: 'Frames Cost',
    fr: 'Coût Montures'
  },
  framesCostDesc: {
    en: 'Cost per frame for Retoyage orders',  
    fr: 'Coût par monture pour commandes Retoyage'
  },
  saving: {
    en: 'Saving...',
    fr: 'Enregistrement...'
  },
  saveChanges: {
    en: 'Save Changes',
    fr: 'Enregistrer les Modifications'
  },
  item: {
    en: 'Item',
    fr: 'Article'
  },
  qty: {
    en: 'Qty',
    fr: 'Qté'
  },
  // Receipt Statistics translations
  businessAnalytics: {
    en: 'Business Analytics',
    fr: 'Analyses Commerciales'
  },
  startDate: {
    en: 'Start Date',
    fr: 'Date de Début'
  },
  endDate: {
    en: 'End Date',
    fr: 'Date de Fin'
  },
  financialOverview: {
    en: 'Financial Overview',
    fr: 'Aperçu Financier'
  },
  totalRevenue: {
    en: 'Total Revenue',
    fr: 'Chiffre d\'Affaires Total'
  },
  totalProductsCost: {
    en: 'Total Products Cost',
    fr: 'Coût Total des Produits'
  },
  totalAdditionalCosts: {
    en: 'Total Additional Costs',
    fr: 'Coûts Supplémentaires Totaux'
  },
  additionalCosts: {
    en: 'Additional Costs',
    fr: 'Coûts Supplémentaires'
  },
  montageCosts: {
    en: 'Additional Costs',
    fr: 'Coûts Supplémentaires'
  },
  personalisation: {
    en: 'Personalisation',
    fr: 'Personnalisation'
  },
  autoAdditionalCosts: {
    en: 'Automatic Additional Costs',
    fr: 'Coûts Supplémentaires Automatiques'
  },
  autoAdditionalCostsDesc: {
    en: 'Enable automatic calculation of additional costs based on order type',
    fr: 'Activer le calcul automatique des coûts supplémentaires selon le type de commande'
  },
  settingsUpdated: {
    en: 'Settings Updated',
    fr: 'Paramètres Mis à Jour'
  },
  totalMontageCosts: {
    en: 'Total Additional Costs',
    fr: 'Coûts Supplémentaires Totaux Montage'
  },
  totalCosts: {
    en: 'Total Costs',
    fr: 'Coûts Totaux'
  },
  totalProfit: {
    en: 'Total Profit',
    fr: 'Bénéfice Total'
  },
  averageMetrics: {
    en: 'Average Metrics',
    fr: 'Métriques Moyennes'
  },
  averageTicket: {
    en: 'Average Ticket',
    fr: 'Ticket Moyen'
  },
  averageProfit: {
    en: 'Average Profit',
    fr: 'Bénéfice Moyen'
  },
  collectionRate: {
    en: 'Collection Rate',
    fr: 'Taux de Collecte'
  },
  operationalMetrics: {
    en: 'Operational Metrics',
    fr: 'Métriques Opérationnelles'
  },
  totalOrders: {
    en: 'Total Orders',
    fr: 'Total des Commandes'
  },
  deliveryRate: {
    en: 'Delivery Rate',
    fr: 'Taux de Livraison'
  },
  outstandingBalance: {
    en: 'Outstanding Balance',
    fr: 'Solde Impayé'
  },
  unpaidMontageCosts: {
    en: 'Unpaid Montage Costs',
    fr: 'Coûts de Montage Impayés'
  },
  productCategories: {
    en: 'Product Categories',
    fr: 'Catégories de Produits'
  },
  singleVision: {
    en: 'Single Vision',
    fr: 'Vision Simple'
  },
  progressive: {
    en: 'Progressive',
    fr: 'Progressif'
  },
  frames: {
    en: 'Frames',
    fr: 'Montures'
  },
  sunglasses: {
    en: 'Sunglasses',
    fr: 'Lunettes de Soleil'
  },
  accessories: {
    en: 'Accessories',
    fr: 'Accessoires'
  },
  service: {
    en: 'Service',
    fr: 'Service'
  },
  other: {
    en: 'Other',
    fr: 'Autre'
  },
  units: {
    en: 'units',
    fr: 'unités'
  },
  revenue: {
    en: 'Revenue',
    fr: 'Revenus'
  },
  // Company management translations
  companyManagement: {
    en: 'Company Management',
    fr: 'Gestion des Entreprises'
  },
  companiesManagement: {
    en: 'Companies Management',
    fr: 'Gestion des Entreprises'
  },
  contactLenses: {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  defaultCompaniesDesk: {
    en: 'Default companies are always available across all features',
    fr: 'Les entreprises par défaut sont toujours disponibles dans toutes les fonctionnalités'
  },
  addNewCompany: {
    en: 'Add New Company',
    fr: 'Ajouter une Nouvelle Entreprise'
  },
  customCompanies: {
    en: 'Custom Companies',
    fr: 'Entreprises Personnalisées'
  },
  noCustomCompanies: {
    en: 'No custom companies added yet. Create your first company to get started.',
    fr: 'Aucune entreprise personnalisée ajoutée. Créez votre première entreprise pour commencer.'
  },
  companyName: {
    en: 'Company Name',
    fr: 'Nom de l\'Entreprise'
  },
  enterCompanyName: {
    en: 'Enter company name',
    fr: 'Entrer le nom de l\'entreprise'
  },
  createCompany: {
    en: 'Create Company',
    fr: 'Créer l\'Entreprise'
  },
  creating: {
    en: 'Creating...',
    fr: 'Création...'
  },
  companyCreated: {
    en: 'Company Created',
    fr: 'Entreprise Créée'
  },
  companyCreatedSuccess: {
    en: 'Company has been created successfully',
    fr: 'L\'entreprise a été créée avec succès'
  },
  companyUpdated: {
    en: 'Company Updated',
    fr: 'Entreprise Mise à Jour'
  },
  companyUpdatedSuccess: {
    en: 'Company has been updated successfully',
    fr: 'L\'entreprise a été mise à jour avec succès'
  },
  companyDeleted: {
    en: 'Company Deleted',
    fr: 'Entreprise Supprimée'
  },
  companyDeletedSuccess: {
    en: 'Company has been deleted successfully',
    fr: 'L\'entreprise a été supprimée avec succès'
  },
  failedToCreateCompany: {
    en: 'Failed to create company',
    fr: 'Échec de la création de l\'entreprise'
  },
  failedToUpdateCompany: {
    en: 'Failed to update company',
    fr: 'Échec de la mise à jour de l\'entreprise'
  },
  failedToDeleteCompany: {
    en: 'Failed to delete company',
    fr: 'Échec de la suppression de l\'entreprise'
  },
  confirmDeleteCompany: {
    en: 'Are you sure you want to delete this company?',
    fr: 'Êtes-vous sûr de vouloir supprimer cette entreprise?'
  },
  manageCustomCompanies: {
    en: 'Manage your custom companies in addition to the default ones',
    fr: 'Gérez vos entreprises personnalisées en plus de celles par défaut'
  },
  defaultCompanies: {
    en: 'Default Companies',
    fr: 'Entreprises par Défaut'
  },
  theseCompaniesAlwaysAvailable: {
    en: 'These companies are always available across all features',
    fr: 'Ces entreprises sont toujours disponibles dans toutes les fonctionnalités'
  },
  // Additional client page translations
  saveAllChanges: {
    en: 'Save All Changes',
    fr: 'Enregistrer Toutes les Modifications'
  },
  sortBy: {
    en: 'Sort By',
    fr: 'Trier Par'
  },
  nameAZ: {
    en: 'Name (A-Z)',
    fr: 'Nom (A-Z)'
  },
  recentlyAdded: {
    en: 'Recently Added',
    fr: 'Ajouté Récemment'
  },
  findDuplicates: {
    en: 'Find Duplicates',
    fr: 'Trouver les Doublons'
  },
  noClientsMatchSearch: {
    en: 'No clients match your search',
    fr: 'Aucun client ne correspond à votre recherche'
  },
  noClientsYet: {
    en: 'You haven\'t added any clients yet',
    fr: 'Vous n\'avez pas encore ajouté de clients'
  },
  addFirstClient: {
    en: 'Add Your First Client',
    fr: 'Ajouter Votre Premier Client'
  },
  previous: {
    en: 'Previous',
    fr: 'Précédent'
  },
  next: {
    en: 'Next',
    fr: 'Suivant'
  },
  showingClients: {
    en: 'Showing {start}-{end} of {total} clients',
    fr: 'Affichage de {start}-{end} sur {total} clients'
  },
  deleteClient: {
    en: 'Delete Client',
    fr: 'Supprimer le Client'
  },
  deleteConfirmation: {
    en: 'Are you sure you want to delete {clientName}? This action cannot be undone.',
    fr: 'Êtes-vous sûr de vouloir supprimer {clientName}? Cette action ne peut pas être annulée.'
  },
  duplicateClientsFound: {
    en: 'Duplicate Clients Found',
    fr: 'Clients en Double Trouvés'
  },
  duplicateExplanation: {
    en: 'Found {count} duplicate clients with the same phone number. Would you like to remove the duplicates?',
    fr: 'Trouvé {count} clients en double avec le même numéro de téléphone. Voulez-vous supprimer les doublons?'
  },
  deleteDuplicates: {
    en: 'Delete Duplicates',
    fr: 'Supprimer les Doublons'
  },
  enterClientName: {
    en: 'Enter client name',
    fr: 'Entrer le nom du client'
  },
  enterPhoneNumber: {
    en: 'Enter phone number',
    fr: 'Entrer le numéro de téléphone'
  },
  assurance: {
    en: 'Assurance',
    fr: 'Assurance'
  },
  notes: {
    en: 'Notes',
    fr: 'Notes'
  },
  rightEyeShort: {
    en: 'Right Eye',
    fr: 'Œil Droit'
  },
  leftEyeShort: {
    en: 'Left Eye',
    fr: 'Œil Gauche'
  },
  addedOn: {
    en: 'Added on',
    fr: 'Ajouté le'
  },
  purchaseHistory: {
    en: 'Purchase History',
    fr: 'Historique d\'Achat'
  },
  noPurchaseHistory: {
    en: 'No purchase history available',
    fr: 'Aucun historique d\'achat disponible'
  },
  // Invoice translations
  invoices: {
    en: 'Invoices',
    fr: 'Factures'
  },
  addInvoice: {
    en: 'Add Invoice',
    fr: 'Ajouter Facture'
  },
  searchInvoices: {
    en: 'Search invoices...',
    fr: 'Rechercher factures...'
  },
  noInvoicesFound: {
    en: 'No invoices found',
    fr: 'Aucune facture trouvée'
  },
  invoiceNumber: {
    en: 'Invoice Number',
    fr: 'Numéro de Facture'
  },
  invoiceDate: {
    en: 'Invoice Date',
    fr: 'Date de Facture'
  },
  dueDate: {
    en: 'Due Date',
    fr: 'Date d\'Échéance'
  },
  clientInformation: {
    en: 'Client Information',
    fr: 'Informations Client'
  },
  clientAddress: {
    en: 'Client Address',
    fr: 'Adresse Client'
  },
  invoiceInformation: {
    en: 'Invoice Information',
    fr: 'Informations Facture'
  },
  linkToReceipt: {
    en: 'Link to Receipt',
    fr: 'Lier au Reçu'
  },
  selectReceipt: {
    en: 'Select Receipt',
    fr: 'Sélectionner Reçu'
  },
  noReceipt: {
    en: 'No Receipt',
    fr: 'Aucun Reçu'
  },
  linkedReceipt: {
    en: 'Linked Receipt',
    fr: 'Reçu Lié'
  },
  taxPercentage: {
    en: 'Tax Percentage',
    fr: 'Pourcentage Taxe'
  },
  unitPrice: {
    en: 'Unit Price',
    fr: 'Prix Unitaire'
  },
  createInvoice: {
    en: 'Create Invoice',
    fr: 'Créer Facture'
  },
  allStatuses: {
    en: 'All Statuses',
    fr: 'Tous les Statuts'
  },
  draft: {
    en: 'Draft',
    fr: 'Brouillon'
  },
  pending: {
    en: 'Pending',
    fr: 'En Attente'
  },
  overdue: {
    en: 'Overdue',
    fr: 'En Retard'
  },
  saving: {
    en: 'Saving...',
    fr: 'Enregistrement...'
  },
  optional: {
    en: 'Optional',
    fr: 'Optionnel'
  },
  invoiceDeletedSuccessfully: {
    en: 'Invoice deleted successfully',
    fr: 'Facture supprimée avec succès'
  },
  confirmDeleteInvoice: {
    en: 'Are you sure you want to delete this invoice?',
    fr: 'Êtes-vous sûr de vouloir supprimer cette facture?'
  },
  failedToDeleteInvoice: {
    en: 'Failed to delete invoice',
    fr: 'Échec de la suppression de la facture'
  },
  loadingInvoices: {
    en: 'Loading invoices...',
    fr: 'Chargement des factures...'
  },
  invoicesCount: {
    en: 'invoices',
    fr: 'factures'
  },
  created: {
    en: 'Created',
    fr: 'Créé'
  },
  active: {
    en: 'Active',
    fr: 'Actif'
  },
  thisWeek: {
    en: 'This Week',
    fr: 'Cette Semaine'
  },
  thisMonth: {
    en: 'This Month',
    fr: 'Ce Mois'
  },
  thisYear: {
    en: 'This Year',
    fr: 'Cette Année'
  },
  totalRevenue: {
    en: 'Total Revenue',
    fr: 'Revenus Totaux'
  },
  tax: {
    en: 'Tax',
    fr: 'Taxe'
  },
  enterProductName: {
    en: 'Enter product name',
    fr: 'Entrer le nom du produit'
  },
  auto: {
    en: 'Auto',
    fr: 'Auto'
  },
  autoGenerated: {
    en: 'Auto-generated',
    fr: 'Généré automatiquement'
  },
  nameAutoGenerated: {
    en: 'Name is automatically generated based on specifications',
    fr: 'Le nom est généré automatiquement selon les spécifications'
  },
  autoGenerateProductName: {
    en: 'Automatically generate product name based on specifications',
    fr: 'Générer automatiquement le nom du produit selon les spécifications'
  },
  generateNameAuto: {
    en: 'Generate Name Automatically',
    fr: 'Générer le Nom Automatiquement'
  },
  fillProductDetails: {
    en: 'Fill in the product details below',
    fr: 'Remplissez les détails du produit ci-dessous'
  },
  quantity: {
    en: 'Quantity',
    fr: 'Quantité'
  },
  profitMargin: {
    en: 'Profit Margin',
    fr: 'Marge Bénéficiaire'
  },
  productImage: {
    en: 'Product Image',
    fr: 'Image du Produit'
  },
  imageUploadHint: {
    en: 'Recommended: PNG or JPG format, max 2MB',
    fr: 'Recommandé: Format PNG ou JPG, max 2MB'
  },
  // New missing translations
  productClassification: {
    en: 'Product Classification',
    fr: 'Classification du Produit'
  },
  lensSpecifications: {
    en: 'Lens Specifications',
    fr: 'Spécifications des Verres'
  },
  pricingFinancial: {
    en: 'Pricing & Financial',
    fr: 'Prix et Finances'
  },
  stockManagement: {
    en: 'Stock Management',
    fr: 'Gestion du Stock'
  },
  productDetails: {
    en: 'Product Details',
    fr: 'Détails du Produit'
  }
};

const receiptTranslations: Translations = {
  // Receipts page UI
  receipts: {
    en: 'Receipts',
    fr: 'Reçus'
  },
  searchReceipts: {
    en: 'Search receipts...',
    fr: 'Rechercher des reçus...'
  },
  statistics: {
    en: 'Statistics',
    fr: 'Statistiques'
  },
  allDates: {
    en: 'All Dates',
    fr: 'Toutes les Dates'
  },
  today: {
    en: 'Today',
    fr: 'Aujourd\'hui'
  },
  thisWeek: {
    en: 'This Week',
    fr: 'Cette Semaine'
  },
  thisMonth: {
    en: 'This Month',
    fr: 'Ce Mois'
  },
  thisYear: {
    en: 'This Year',
    fr: 'Cette Année'
  },
  allPayments: {
    en: 'All Payments',
    fr: 'Tous les Paiements'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé'
  },
  partial: {
    en: 'Partial',
    fr: 'Partiel'
  },
  unpaid: {
    en: 'Unpaid',
    fr: 'Impayé'
  },
  allDeliveries: {
    en: 'All Deliveries',
    fr: 'Toutes les Livraisons'
  },
  delivered: {
    en: 'Delivered',
    fr: 'Livré'
  },
  undelivered: {
    en: 'Undelivered',
    fr: 'Non Livré'
  },
  completed: {
    en: 'Completed',
    fr: 'Terminé'
  },
  notCalled: {
    en: 'Not Called',
    fr: 'Non Appelé'
  },
  called: {
    en: 'Called',
    fr: 'Appelé'
  },
  unresponsive: {
    en: 'Unresponsive',
    fr: 'Sans Réponse'
  },
  date: {
    en: 'Date',
    fr: 'Date'
  },
  payment: {
    en: 'Payment',
    fr: 'Paiement'
  },
  delivered: {
    en: 'Delivered',
    fr: 'Livré'
  },
  total: {
    en: 'Total',
    fr: 'Total'
  },
  advance: {
    en: 'Advance',
    fr: 'Avance'
  },
  balance: {
    en: 'Balance',
    fr: 'Solde'
  },
  cost: {
    en: 'Cost',
    fr: 'Coût'
  },
  profit: {
    en: 'Profit',
    fr: 'Bénéfice'
  },
  minutesAgo: {
    en: 'minutes ago',
    fr: 'il y a quelques minutes'
  },
  hoursAgo: {
    en: 'hours ago',
    fr: 'il y a quelques heures'
  },
  minutesAgoShort: {
    en: 'minutes ago',
    fr: 'min'
  },
  hoursAgoShort: {
    en: 'hours ago',
    fr: 'h'
  },
  unOrdered: {
    en: 'UnOrdered',
    fr: 'N-Commandé'
  },
  ordered: {
    en: 'Ordered',
    fr: 'Commandé'
  },
  inStore: {
    en: 'InStore',
    fr: 'En Magasin'
  },
  inCutting: {
    en: 'InCutting',
    fr: 'En Taille'
  },
  ready: {
    en: 'Ready',
    fr: 'Prêt'
  },
  paidCosts: {
    en: 'Paid costs',
    fr: 'Coûts payés'
  },
  noReceiptsFound: {
    en: 'No receipts found',
    fr: 'Aucun reçu trouvé'
  },
  receiptUpdated: {
    en: 'Receipt Updated',
    fr: 'Reçu Mis à Jour'
  },
  receiptMarkedAsPaid: {
    en: 'Receipt has been marked as paid.',
    fr: 'Le reçu a été marqué comme payé.'
  },
  receiptMarkedAsDelivered: {
    en: 'Receipt has been marked as delivered.',
    fr: 'Le reçu a été marqué comme livré.'
  },
  receiptMarkedAsUndelivered: {
    en: 'Receipt has been marked as undelivered.',
    fr: 'Le reçu a été marqué comme non livré.'
  },
  montageStatusUpdated: {
    en: 'Montage status has been updated to',
    fr: 'Le statut de montage a été mis à jour vers'
  },
  callStatusUpdated: {
    en: 'Call Status Updated',
    fr: 'Statut d\'Appel Mis à Jour'
  },
  callStatusUpdatedTo: {
    en: 'Call status has been updated to',
    fr: 'Le statut d\'appel a été mis à jour vers'
  },
  receiptDeleted: {
    en: 'ReceiptDeleted',
    fr: 'Reçu Supprimé'
  },
  receiptDeletedSuccessfully: {
    en: 'Receipt has been successfully deleted.',
    fr: 'Le reçu a été supprimé avec succès.'
  },
  errorUpdatingReceipt: {
    en: 'Failed to update receipt. Please try again.',
    fr: 'Échec de la mise à jour du reçu. Veuillez réessayer.'
  },
  errorDeletingReceipt: {
    en: 'Failed to delete receipt. Please try again.',
    fr: 'Échec de la suppression du reçu. Veuillez réessayer.'
  },
  errorUpdatingCallStatus: {
    en: 'Failed to update call status. Please try again.',
    fr: 'Échec de la mise à jour du statut d\'appel. Veuillez réessayer.'
  },
  errorUpdatingMontageStatus: {
    en: 'Failed to update montage status. Please try again.',
    fr: 'Échec de la mise à jour du statut de montage. Veuillez réessayer.'
  },
  pending: {
    en: 'Pending',
    fr: 'En Attente'
  },
  receiptsLabel: {
    en: 'receipts',
    fr: 'reçus'
  },
  edit: {
    en: 'Edit',
    fr: 'Modifier'
  },
  delete: {
    en: 'Delete',
    fr: 'Supprimer'
  },
  print: {
    en: 'Print',
    fr: 'Imprimer'
  },
  // New Receipt page UI
  newReceipt: {
    en: 'New Receipt',
    fr: 'Nouveau Reçu'
  },
  step: {
    en: 'Step',
    fr: 'Étape'
  },
  of: {
    en: 'of',
    fr: 'de'
  },
  continue: {
    en: 'Continue',
    fr: 'Continuer'
  },
  back: {
    en: 'Back',
    fr: 'Retour'
  },
  finish: {
    en: 'Finish',
    fr: 'Terminer'
  },
  createReceipt: {
    en: 'Create Receipt',
    fr: 'Créer le Reçu'
  },
  saveReceipt: {
    en: 'Save Receipt',
    fr: 'Enregistrer le Reçu'
  },
  clientSelection: {
    en: 'Client Selection',
    fr: 'Sélection du Client'
  },
  orderDetails: {
    en: 'Order Details',
    fr: 'Détails de la Commande'
  },
  finalize: {
    en: 'Finalize',
    fr: 'Finaliser'
  },
  selectClient: {
    en: 'Select Client',
    fr: 'Sélectionner un Client'
  },
  chooseExistingClient: {
    en: 'Choose an existing client or create a new one',
    fr: 'Choisissez un client existant ou créez-en un nouveau'
  },
  searchByNameOrPhone: {
    en: 'Search by name or phone...',
    fr: 'Rechercher par nom ou téléphone...'
  },
  prescriptionDetails: {
    en: 'Prescription Details',
    fr: 'Détails de la Prescription'
  },
  enterUpdatePrescription: {
    en: 'Enter or update client\'s prescription',
    fr: 'Saisir ou mettre à jour la prescription du client'
  },
  rightEye: {
    en: 'Right Eye',
    fr: 'Œil Droit'
  },
  leftEye: {
    en: 'Left Eye',
    fr: 'Œil Gauche'
  },
  sph: {
    en: 'SPH',
    fr: 'SPH'
  },
  cyl: {
    en: 'CYL',
    fr: 'CYL'
  },
  axe: {
    en: 'AXE',
    fr: 'AXE'
  },
  add: {
    en: 'ADD',
    fr: 'ADD'
  },
  enterAddValue: {
    en: 'Enter ADD value',
    fr: 'Entrer la valeur ADD'
  },
  orderType: {
    en: 'Order Type',
    fr: 'Type de Commande'
  },
  selectOrderType: {
    en: 'Select Order Type',
    fr: 'Sélectionner le Type de Commande'
  },
  montage: {
    en: 'Montage',
    fr: 'Montage'
  },
  retoyage: {
    en: 'Retoyage',
    fr: 'Retoyage'
  },
  sell: {
    en: 'Sell',
    fr: 'Vendre'
  },
  unspecified: {
    en: 'Unspecified',
    fr: 'Non spécifié'
  },
  addCustomItem: {
    en: 'Add Custom Item',
    fr: 'Ajouter un Article Personnalisé'
  },
  customItemName: {
    en: 'Custom Item Name',
    fr: 'Nom de l\'Article Personnalisé'
  },
  quantity: {
    en: 'Quantity',
    fr: 'Quantité'
  },
  unitPrice: {
    en: 'Unit Price',
    fr: 'Prix Unitaire'
  },
  unitCost: {
    en: 'Unit Cost',
    fr: 'Coût Unitaire'
  },
  linkedEye: {
    en: 'Linked Eye',
    fr: 'Œil Lié'
  },
  paidAtDelivery: {
    en: 'Paid at Delivery',
    fr: 'Payé à la Livraison'
  },
  paymentDetails: {
    en: 'Payment Details',
    fr: 'Détails du Paiement'
  },
  subtotal: {
    en: 'Subtotal',
    fr: 'Sous-total'
  },
  tax: {
    en: 'Tax',
    fr: 'Taxe'
  },
  discount: {
    en: 'Discount',
    fr: 'Remise'
  },
  total: {
    en: 'Total',
    fr: 'Total'
  },
  advancePayment: {
    en: 'Advance Payment',
    fr: 'Paiement d\'Avance'
  },
  balance: {
    en: 'Balance',
    fr: 'Solde'
  },
  percentageDiscount: {
    en: 'Percentage Discount (%)',
    fr: 'Remise en Pourcentage (%)'
  },
  fixedDiscount: {
    en: 'Fixed Discount (DH)',
    fr: 'Remise Fixe (DH)'
  },
  taxBase: {
    en: 'Tax Base (DH)',
    fr: 'Base de Taxe (DH)'
  },
  receiptSummary: {
    en: 'Receipt Summary',
    fr: 'Résumé du Reçu'
  },
  clientInformation: {
    en: 'Client Information',
    fr: 'Informations du Client'
  },
  name: {
    en: 'Name',
    fr: 'Nom'
  },
  phone: {
    en: 'Phone',
    fr: 'Téléphone'
  },
  prescription: {
    en: 'Prescription',
    fr: 'Prescription'
  },
  orderSummary: {
    en: 'Order Summary',
    fr: 'Résumé de la Commande'
  },
  totalItems: {
    en: 'Total Items',
    fr: 'Articles Totaux'
  },
  status: {
    en: 'Status',
    fr: 'Statut'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé'
  },
  partiallyPaid: {
    en: 'Partially Paid',
    fr: 'Partiellement Payé'
  },
  unpaid: {
    en: 'Unpaid',
    fr: 'Non Payé'
  },
  dh: {
    en: 'DH',
    fr: 'DH'
  },
  selectProduct: {
    en: 'Select a product',
    fr: 'Sélectionner un produit'
  },
  cost: {
    en: 'Cost',
    fr: 'Coût'
  },
  linkToEye: {
    en: 'Link to Eye',
    fr: 'Lier à l\'Œil'
  },
  noEyeLink: {
    en: 'No Eye Link',
    fr: 'Aucun Lien d\'Œil'
  },
  productsItems: {
    en: 'Products/Items',
    fr: 'Produits/Articles'
  },
  productsCost: {
    en: 'Products Cost',
    fr: 'Coût des Produits'
  },
  montageCosts: {
    en: 'Montage Costs',
    fr: 'Coûts de Montage'
  },
  totalCostTTC: {
    en: 'Total Cost (TTC)',
    fr: 'Coût Total (TTC)'
  },
  profit: {
    en: 'Profit',
    fr: 'Bénéfice'
  },
  balanceDue: {
    en: 'Balance Due',
    fr: 'Solde Dû'
  },
  taxIndicator: {
    en: 'Tax Indicator',
    fr: 'Indicateur de Taxe'
  },
  orderTypeRequired: {
    en: 'Order Type Required',
    fr: 'Type de Commande Requis'
  },
  orderTypeRequiredDesc: {
    en: 'Please select an order type before proceeding.',
    fr: 'Veuillez sélectionner un type de commande avant de continuer.'
  },
  outOfStockWarning: {
    en: 'Out of Stock Warning',
    fr: 'Avertissement de Rupture de Stock'
  },
  outOfStockDesc: {
    en: 'The following items are out of stock:',
    fr: 'Les articles suivants sont en rupture de stock:'
  },
  unknownProduct: {
    en: 'Unknown Product',
    fr: 'Produit Inconnu'
  },
  canStillProceed: {
    en: 'You can still proceed with the order.',
    fr: 'Vous pouvez tout de même procéder à la commande.'
  },
  noItems: {
    en: 'No Items Added',
    fr: 'Aucun Article Ajouté'
  },
  pleaseAddItems: {
    en: 'Please add at least one item to the order.',
    fr: 'Veuillez ajouter au moins un article à la commande.'
  },
  noClient: {
    en: 'No Client Selected',
    fr: 'Aucun Client Sélectionné'
  },
  pleaseSelectClient: {
    en: 'Please select a client for this order.',
    fr: 'Veuillez sélectionner un client pour cette commande.'
  },
  authenticationRequired: {
    en: 'Authentication Required',
    fr: 'Authentification Requise'
  },
  mustBeLoggedIn: {
    en: 'You must be logged in to save a receipt.',
    fr: 'Vous devez être connecté pour enregistrer un reçu.'
  },
  missingInformation: {
    en: 'Missing Information',
    fr: 'Informations Manquantes'
  },
  selectClientBeforeSaving: {
    en: 'Please select a client before saving the receipt.',
    fr: 'Veuillez sélectionner un client avant d\'enregistrer le reçu.'
  },
  missingItems: {
    en: 'Missing Items',
    fr: 'Articles Manquants'
  },
  addItemsBeforeSaving: {
    en: 'Please add at least one item before saving the receipt.',
    fr: 'Veuillez ajouter au moins un article avant d\'enregistrer le reçu.'
  },
  selectOrderTypeBeforeSaving: {
    en: 'Please select an order type before saving the receipt.',
    fr: 'Veuillez sélectionner un type de commande avant d\'enregistrer le reçu.'
  },
  success: {
    en: 'Success',
    fr: 'Succès'
  },
  receiptSavedSuccessfully: {
    en: 'Receipt saved successfully!',
    fr: 'Reçu enregistré avec succès!'
  },
  error: {
    en: 'Error',
    fr: 'Erreur'
  },
  failedToSaveReceipt: {
    en: 'Failed to save receipt. Please try again.',
    fr: 'Échec de l\'enregistrement du reçu. Veuillez réessayer.'
  },
  itemsRequired: {
    en: 'Items Required',
    fr: 'Articles Requis'
  },
  addItemsBeforeProceeding: {
    en: 'Please add at least one item before proceeding to the next step.',
    fr: 'Veuillez ajouter au moins un article avant de passer à l\'étape suivante.'
  },
  noItemsInOrder: {
    en: 'No items in order yet',
    fr: 'Aucun article dans la commande pour le moment'
  },
  addFirstItem: {
    en: 'Click "Add Product" or "Add Custom Item" to get started',
    fr: 'Cliquez sur "Ajouter un Produit" ou "Ajouter un Article Personnalisé" pour commencer'
  },
  markup: {
    en: 'markup',
    fr: 'majoration'
  },
  paymentStatus: {
    en: 'Payment Status',
    fr: 'Statut de Paiement'
  },
  newClient: {
    en: 'New Client',
    fr: 'Nouveau Client'
  }
};

const clientsTranslations: Translations = {
  // Clients page UI
  clients: {
    en: 'Clients',
    fr: 'Clients'
  },
  newClient: {
    en: 'New Client',
    fr: 'Nouveau Client'
  },
  addClient: {
    en: 'Add Client',
    fr: 'Ajouter un Client'
  },
  editClient: {
    en: 'Edit Client',
    fr: 'Modifier le Client'
  },
  searchClients: {
    en: 'Search clients...',
    fr: 'Rechercher des clients...'
  },
  noClientsFound: {
    en: 'No clients found',
    fr: 'Aucun client trouvé'
  },
  clientName: {
    en: 'Client Name',
    fr: 'Nom du Client'
  },
  firstName: {
    en: 'First Name',
    fr: 'Prénom'
  },
  lastName: {
    en: 'Last Name',
    fr: 'Nom de Famille'
  },
  phoneNumber: {
    en: 'Phone Number',
    fr: 'Numéro de Téléphone'
  },
  email: {
    en: 'Email',
    fr: 'Email'
  },
  address: {
    en: 'Address',
    fr: 'Adresse'
  },
  dateOfBirth: {
    en: 'Date of Birth',
    fr: 'Date de Naissance'
  },
  gender: {
    en: 'Gender',
    fr: 'Sexe'
  },
  male: {
    en: 'Male',
    fr: 'Masculin'
  },
  female: {
    en: 'Female',
    fr: 'Féminin'
  },
  selectGender: {
    en: 'Select Gender',
    fr: 'Sélectionner le Sexe'
  },
  eyePrescription: {
    en: 'Eye Prescription',
    fr: 'Prescription Oculaire'
  },
  rightEye: {
    en: 'Right Eye (OD)',
    fr: 'Œil Droit (OD)'
  },
  leftEye: {
    en: 'Left Eye (OS)',
    fr: 'Œil Gauche (OS)'
  },
  sphere: {
    en: 'Sphere (SPH)',
    fr: 'Sphère (SPH)'
  },
  cylinder: {
    en: 'Cylinder (CYL)',
    fr: 'Cylindre (CYL)'
  },
  axis: {
    en: 'Axis',
    fr: 'Axe'
  },
  sph: {
    en: 'Sph',
    fr: 'Sph'
  },
  cyl: {
    en: 'Cyl',
    fr: 'Cyl'
  },
  axe: {
    en: 'Axe',
    fr: 'Axe'
  },
  pupillaryDistance: {
    en: 'Pupillary Distance (PD)',
    fr: 'Distance Pupillaire (PD)'
  },
  totalBalance: {
    en: 'Total Balance',
    fr: 'Solde Total'
  },
  lastVisit: {
    en: 'Last Visit',
    fr: 'Dernière Visite'
  },
  viewDetails: {
    en: 'View Details',
    fr: 'Voir les Détails'
  },
  callClient: {
    en: 'Call Client',
    fr: 'Appeler le Client'
  },
  whatsappClient: {
    en: 'WhatsApp Client',
    fr: 'WhatsApp Client'
  },
  clientDetails: {
    en: 'Client Details',
    fr: 'Détails du Client'
  },
  receiptHistory: {
    en: 'Receipt History',
    fr: 'Historique des Reçus'
  },
  noReceiptsFound: {
    en: 'No receipts found for this client',
    fr: 'Aucun reçu trouvé pour ce client'
  },
  receiptNumber: {
    en: 'Receipt #'
  },
  date: {
    en: 'Date',
    fr: 'Date'
  },
  amount: {
    en: 'Amount',
    fr: 'Montant'
  },
  status: {
    en: 'Status',
    fr: 'Statut'
  },
  balance: {
    en: 'Balance',
    fr: 'Solde'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé'
  },
  pending: {
    en: 'Pending',
    fr: 'En Attente'
  },
  partial: {
    en: 'Partial',
    fr: 'Partiel'
  },
  dh: {
    en: 'DH',
    fr: 'DH'
  },
  noRecentActivity: {
    en: 'No recent activity',
    fr: 'Aucune activité récente'
  },
  never: {
    en: 'Never',
    fr: 'Jamais'
  }
};

const pricingTranslations: Translations = {
  pricingTitle: {
    en: 'Pricing Plans',
    fr: 'Plans Tarifaires'
  },
  pricingSubtitle: {
    en: 'Choose the perfect plan for your optical business needs',
    fr: 'Choisissez le plan parfait pour les besoins de votre entreprise optique'
  },
  monthly: {
    en: 'Monthly',
    fr: 'Mensuel'
  },
  quarterly: {
    en: 'Quarterly',
    fr: 'Trimestriel'
  },
  lifetime: {
    en: 'Lifetime',
    fr: 'À Vie'
  },
  monthlySubscription: {
    en: 'Monthly subscription',
    fr: 'Abonnement mensuel'
  },
  quarterlySubscription: {
    en: 'Quarterly subscription',
    fr: 'Abonnement trimestriel'
  },
  oneTimePayment: {
    en: 'One-time payment',
    fr: 'Paiement unique'
  },
  fullAccess: {
    en: 'Full access to all features',
    fr: 'Accès complet à toutes les fonctionnalités'
  },
  monthlyBilling: {
    en: 'Monthly billing',
    fr: 'Facturation mensuelle'
  },
  quarterlyBilling: {
    en: 'Quarterly billing',
    fr: 'Facturation trimestrielle'
  },
  prioritySupport: {
    en: 'Priority support',
    fr: 'Support prioritaire'
  },
  unlimitedUpdates: {
    en: 'Unlimited updates',
    fr: 'Mises à jour illimitées'
  },
  noRecurring: {
    en: 'No recurring payments',
    fr: 'Pas de paiements récurrents'
  },
  lifetimeAccess: {
    en: 'Lifetime access',
    fr: 'Accès à vie'
  },
  howToUse: {
    en: 'How to Use',
    fr: 'Comment Utiliser'
  },
  howToUseTitle: {
    en: 'How to Use Lensly',
    fr: 'Comment Utiliser Lensly'
  },
  howToUseSubtitle: {
    en: 'Learn how to make the most of your optical management system with our comprehensive guide',
    fr: 'Apprenez à tirer le meilleur parti de votre système de gestion optique avec notre guide complet'
  },
  gettingStarted: {
    en: 'Getting Started with Lensly',
    fr: 'Commencer avec Lensly'
  },
  howToUseIntro: {
    en: 'Lensly is designed to streamline your optical business operations. This guide will walk you through each feature and show you how to maximize your productivity.',
    fr: 'Lensly est conçu pour rationaliser les opérations de votre entreprise optique. Ce guide vous guidera à travers chaque fonctionnalité et vous montrera comment maximiser votre productivité.'
  },
  quickSetup: {
    en: 'Quick Setup',
    fr: 'Configuration Rapide'
  },
  quickSetupDesc: {
    en: 'Get started in minutes with our intuitive setup process',
    fr: 'Commencez en quelques minutes avec notre processus de configuration intuitif'
  },
  easyManagement: {
    en: 'Easy Management',
    fr: 'Gestion Facile'
  },
  easyManagementDesc: {
    en: 'Manage products, clients, and transactions with ease',
    fr: 'Gérez les produits, clients et transactions en toute simplicité'
  },
  powerfulAnalytics: {
    en: 'Powerful Analytics',
    fr: 'Analyses Puissantes'
  },
  powerfulAnalyticsDesc: {
    en: 'Track your business performance with detailed reports',
    fr: 'Suivez les performances de votre entreprise avec des rapports détaillés'
  },
  stepByStepGuide: {
    en: 'Step-by-Step Guide',
    fr: 'Guide Étape par Étape'
  },
  stepsToFollow: {
    en: 'Steps to Follow',
    fr: 'Étapes à Suivre'
  },
  howToUseStep1Title: {
    en: 'Initial Setup & Configuration',
    fr: 'Configuration et Installation Initiales'
  },
  howToUseStep1Desc: {
    en: 'Set up your optical business profile and configure basic settings',
    fr: 'Configurez le profil de votre entreprise optique et les paramètres de base'
  },
  howToUseStep1Sub1: {
    en: 'Create your account and verify your email address',
    fr: 'Créez votre compte et vérifiez votre adresse e-mail'
  },
  howToUseStep1Sub2: {
    en: 'Complete your business information in Optician Settings',
    fr: 'Complétez les informations de votre entreprise dans les Paramètres Opticien'
  },
  howToUseStep1Sub3: {
    en: 'Set up your markup percentages for different product categories',
    fr: 'Configurez vos pourcentages de majoration pour différentes catégories de produits'
  },
  howToUseStep1Sub4: {
    en: 'Configure user access permissions if you have multiple staff members',
    fr: 'Configurez les autorisations d\'accès utilisateur si vous avez plusieurs membres du personnel'
  },
  howToUseStep2Title: {
    en: 'Product Management',
    fr: 'Gestion des Produits'
  },
  howToUseStep2Desc: {
    en: 'Add and organize your inventory of frames, lenses, and accessories',
    fr: 'Ajoutez et organisez votre inventaire de montures, verres et accessoires'
  },
  howToUseStep2Sub1: {
    en: 'Navigate to Products page and click "Add Product" to create new items',
    fr: 'Naviguez vers la page Produits et cliquez sur "Ajouter un Produit" pour créer de nouveaux articles'
  },
  howToUseStep2Sub2: {
    en: 'Use the import feature to bulk upload products from Excel/CSV files',
    fr: 'Utilisez la fonction d\'importation pour télécharger en masse des produits depuis des fichiers Excel/CSV'
  },
  howToUseStep2Sub3: {
    en: 'Organize products by categories: Frames, Single Vision, Progressive, Sunglasses, Contact Lenses, Accessories',
    fr: 'Organisez les produits par catégories : Montures, Vision Simple, Progressif, Lunettes de Soleil, Lentilles de Contact, Accessoires'
  },
  howToUseStep2Sub4: {
    en: 'Set stock levels and enable low-stock alerts for inventory management',
    fr: 'Définissez les niveaux de stock et activez les alertes de stock faible pour la gestion des stocks'
  },
  howToUseStep3Title: {
    en: 'Client Management',
    fr: 'Gestion des Clients'
  },
  howToUseStep3Desc: {
    en: 'Create detailed client profiles with prescription history and contact information',
    fr: 'Créez des profils clients détaillés avec l\'historique des prescriptions et les informations de contact'
  },
  howToUseStep3Sub1: {
    en: 'Add new clients with complete contact information and personal details',
    fr: 'Ajoutez de nouveaux clients avec des informations de contact complètes et des détails personnels'
  },
  howToUseStep3Sub2: {
    en: 'Record detailed eye prescriptions including sphere, cylinder, axis, and addition values',
    fr: 'Enregistrez des prescriptions oculaires détaillées incluant les valeurs de sphère, cylindre, axe et addition'
  },
  howToUseStep3Sub3: {
    en: 'Track prescription history and changes over time for better patient care',
    fr: 'Suivez l\'historique des prescriptions et les changements au fil du temps pour de meilleurs soins aux patients'
  },
  howToUseStep3Sub4: {
    en: 'Use the search function to quickly find clients by name, phone, or email',
    fr: 'Utilisez la fonction de recherche pour trouver rapidement des clients par nom, téléphone ou e-mail'
  },
  howToUseStep4Title: {
    en: 'Sales & Receipt Management',
    fr: 'Gestion des Ventes et Reçus'
  },
  howToUseStep4Desc: {
    en: 'Process sales transactions and generate professional receipts and invoices',
    fr: 'Traitez les transactions de vente et générez des reçus et factures professionnels'
  },
  howToUseStep4Sub1: {
    en: 'Create new receipts by selecting client and adding products to the order',
    fr: 'Créez de nouveaux reçus en sélectionnant le client et en ajoutant des produits à la commande'
  },
  howToUseStep4Sub2: {
    en: 'Apply automatic markup calculations and discounts as needed',
    fr: 'Appliquez des calculs de majoration automatiques et des remises selon les besoins'
  },
  howToUseStep4Sub3: {
    en: 'Process payments with multiple payment methods (cash, card, transfer)',
    fr: 'Traitez les paiements avec plusieurs méthodes de paiement (espèces, carte, virement)'
  },
  howToUseStep4Sub4: {
    en: 'Print or email receipts directly to clients for their records',
    fr: 'Imprimez ou envoyez par e-mail les reçus directement aux clients pour leurs dossiers'
  },
  howToUseStep5Title: {
    en: 'Purchase & Supplier Management',
    fr: 'Gestion des Achats et Fournisseurs'
  },
  howToUseStep5Desc: {
    en: 'Track purchases from suppliers and manage your business expenses',
    fr: 'Suivez les achats auprès des fournisseurs et gérez les dépenses de votre entreprise'
  },
  howToUseStep5Sub1: {
    en: 'Add suppliers with complete contact and payment information',
    fr: 'Ajoutez des fournisseurs avec des informations de contact et de paiement complètes'
  },
  howToUseStep5Sub2: {
    en: 'Record purchases and track what you owe to each supplier',
    fr: 'Enregistrez les achats et suivez ce que vous devez à chaque fournisseur'
  },
  howToUseStep5Sub3: {
    en: 'Monitor supplier balances and payment schedules',
    fr: 'Surveillez les soldes des fournisseurs et les calendriers de paiement'
  },
  howToUseStep5Sub4: {
    en: 'Generate purchase reports for expense tracking and tax purposes',
    fr: 'Générez des rapports d\'achat pour le suivi des dépenses et les fins fiscales'
  },
  howToUseStep6Title: {
    en: 'Analytics & Reporting',
    fr: 'Analyses et Rapports'
  },
  howToUseStep6Desc: {
    en: 'Monitor your business performance with comprehensive analytics and reports',
    fr: 'Surveillez les performances de votre entreprise avec des analyses et rapports complets'
  },
  howToUseStep6Sub1: {
    en: 'View dashboard for daily, weekly, and monthly sales summaries',
    fr: 'Consultez le tableau de bord pour des résumés de ventes quotidiens, hebdomadaires et mensuels'
  },
  howToUseStep6Sub2: {
    en: 'Analyze financial metrics including revenue, costs, and profit margins',
    fr: 'Analysez les métriques financières incluant les revenus, coûts et marges bénéficiaires'
  },
  howToUseStep6Sub3: {
    en: 'Track inventory turnover and identify best-selling products',
    fr: 'Suivez la rotation des stocks et identifiez les produits les plus vendus'
  },
  howToUseStep6Sub4: {
    en: 'Export reports for accounting and business planning purposes',
    fr: 'Exportez des rapports pour la comptabilité et la planification d\'entreprise'
  },
  proTips: {
    en: 'Pro Tips for Maximum Efficiency',
    fr: 'Conseils Pro pour une Efficacité Maximale'
  },
  tip1Title: {
    en: 'Use Quick Search',
    fr: 'Utilisez la Recherche Rapide'
  },
  tip1Desc: {
    en: 'Save time by using the search functionality to quickly find products, clients, or transactions',
    fr: 'Économisez du temps en utilisant la fonctionnalité de recherche pour trouver rapidement des produits, clients ou transactions'
  },
  tip2Title: {
    en: 'Bulk Import Products',
    fr: 'Importation en Masse de Produits'
  },
  tip2Desc: {
    en: 'Use the import feature to quickly add multiple products from your supplier catalogs',
    fr: 'Utilisez la fonction d\'importation pour ajouter rapidement plusieurs produits de vos catalogues fournisseurs'
  },
  tip3Title: {
    en: 'Customize Receipts',
    fr: 'Personnalisez les Reçus'
  },
  tip3Desc: {
    en: 'Set up your business logo and information in settings for professional-looking receipts',
    fr: 'Configurez le logo et les informations de votre entreprise dans les paramètres pour des reçus d\'aspect professionnel'
  },
  tip4Title: {
    en: 'Track Prescriptions',
    fr: 'Suivez les Prescriptions'
  },
  tip4Desc: {
    en: 'Always record complete prescription details for better customer service and compliance',
    fr: 'Enregistrez toujours les détails complets des prescriptions pour un meilleur service client et la conformité'
  },
  tip5Title: {
    en: 'Regular Backups',
    fr: 'Sauvegardes Régulières'
  },
  tip5Desc: {
    en: 'Export your data regularly to ensure you never lose important business information',
    fr: 'Exportez vos données régulièrement pour vous assurer de ne jamais perdre d\'informations commerciales importantes'
  },
  tip6Title: {
    en: 'Monitor Financial Health',
    fr: 'Surveillez la Santé Financière'
  },
  tip6Desc: {
    en: 'Check your financial dashboard regularly to track profit margins and business growth',
    fr: 'Vérifiez régulièrement votre tableau de bord financier pour suivre les marges bénéficiaires et la croissance de l\'entreprise'
  },
  readyToStart: {
    en: 'Ready to Transform Your Optical Business?',
    fr: 'Prêt à Transformer Votre Entreprise Optique ?'
  },
  readyToStartDesc: {
    en: 'Start your free trial today and see how Lensly can streamline your operations and boost your productivity.',
    fr: 'Commencez votre essai gratuit aujourd\'hui et voyez comment Lensly peut rationaliser vos opérations et augmenter votre productivité.'
  },
  viewPricing: {
    en: 'View Pricing',
    fr: 'Voir les Tarifs'
  },
  saveVsMonthly: {
    en: 'Save 11% vs monthly',
    fr: 'Économisez 11% par rapport au mensuel'
  },
  currentPlan: {
    en: 'Current Plan',
    fr: 'Plan Actuel'
  },
  startFreeTrial: {
    en: 'Start Free Trial',
    fr: 'Commencer l\'essai gratuit'
  },
  purchaseNow: {
    en: 'Purchase Now',
    fr: 'Acheter maintenant'
  },
};

// Combine all translations
const purchasesTranslations: Translations = {
  // Purchases page UI
  purchases: {
    en: 'Purchases',
    fr: 'Achats'
  },
  recordPurchase: {
    en: 'Record Purchase',
    fr: 'Enregistrer un Achat'
  },
  addSupplier: {
    en: 'Add Supplier',
    fr: 'Ajouter un Fournisseur'
  },
  searchPurchasesSuppliers: {
    en: 'Search purchases or suppliers...',
    fr: 'Rechercher des achats ou fournisseurs...'
  },
  supplier: {
    en: 'Supplier',
    fr: 'Fournisseur'
  },
  allSuppliers: {
    en: 'All Suppliers',
    fr: 'Tous les Fournisseurs'
  },
  type: {
    en: 'Type',
    fr: 'Type'
  },
  allTypes: {
    en: 'All Types',
    fr: 'Tous les Types'
  },
  allCategories: {
    en: 'All Categories',
    fr: 'Toutes les Catégories'
  },
  today: {
    en: 'Today',
    fr: 'Aujourd\'hui'
  },
  week: {
    en: 'Week',
    fr: 'Semaine'
  },
  month: {
    en: 'Month',
    fr: 'Mois'
  },
  year: {
    en: 'Year',
    fr: 'Année'
  },
  all: {
    en: 'All',
    fr: 'Tout'
  },
  purchasesCount: {
    en: 'purchases',
    fr: 'achats'
  },
  thisMonth: {
    en: 'This month:',
    fr: 'Ce mois:'
  },
  suppliers: {
    en: 'Suppliers',
    fr: 'Fournisseurs'
  },
  totalAmount: {
    en: 'Total Amount',
    fr: 'Montant Total'
  },
  totalAmountTTC: {
    en: 'Total Amount (TTC)',
    fr: 'Montant Total (TTC)'
  },
  advance: {
    en: 'Advance',
    fr: 'Avance'
  },
  linkToReceipts: {
    en: 'Link to Receipts',
    fr: 'Lier aux Reçus'
  },
  viewBalanceHistory: {
    en: 'View Balance History',
    fr: 'Voir l\'Historique du Solde'
  },
  noSupplier: {
    en: 'No Supplier',
    fr: 'Aucun Fournisseur'
  },
  due: {
    en: 'Due:',
    fr: 'Échéance:'
  },
  next: {
    en: 'Next:',
    fr: 'Suivant:'
  },
  renewNow: {
    en: 'Renew Now',
    fr: 'Renouveler Maintenant'
  },
  receipts: {
    en: 'receipts',
    fr: 'reçus'
  },
  totalPurchases: {
    en: 'Total Purchases',
    fr: 'Total des Achats'
  },
  contactPerson: {
    en: 'Contact Person',
    fr: 'Personne de Contact'
  },
  supplierName: {
    en: 'Supplier Name',
    fr: 'Nom du Fournisseur'
  },
  description: {
    en: 'Description',
    fr: 'Description'
  },
  amountHT: {
    en: 'Amount HT',
    fr: 'Montant HT'
  },
  amountTTC: {
    en: 'Amount TTC',
    fr: 'Montant TTC'
  },
  purchaseDate: {
    en: 'Purchase Date',
    fr: 'Date d\'Achat'
  },
  paymentMethod: {
    en: 'Payment Method',
    fr: 'Méthode de Paiement'
  },
  paymentStatus: {
    en: 'Payment Status',
    fr: 'Statut de Paiement'
  },
  paymentUrgency: {
    en: 'Payment Urgency',
    fr: 'Urgence de Paiement'
  },
  recurringType: {
    en: 'Recurring Type',
    fr: 'Type de Récurrence'
  },
  purchaseType: {
    en: 'Purchase Type',
    fr: 'Type d\'Achat'
  },
  operationalExpenses: {
    en: 'Operational Expenses',
    fr: 'Dépenses Opérationnelles'
  },
  capitalExpenditure: {
    en: 'Capital Expenditure',
    fr: 'Dépenses d\'Investissement'
  },
  selectSupplier: {
    en: 'Select Supplier',
    fr: 'Sélectionner un Fournisseur'
  },
  selectCategory: {
    en: 'Select Category',
    fr: 'Sélectionner une Catégorie'
  },
  selectPaymentMethod: {
    en: 'Select Payment Method',
    fr: 'Sélectionner une Méthode de Paiement'
  },
  selectPaymentStatus: {
    en: 'Select Payment Status',
    fr: 'Sélectionner un Statut de Paiement'
  },
  selectRecurringType: {
    en: 'Select Recurring Type',
    fr: 'Sélectionner un Type de Récurrence'
  },
  selectPurchaseType: {
    en: 'Select Purchase Type',
    fr: 'Sélectionner un Type d\'Achat'
  },
  cash: {
    en: 'Cash',
    fr: 'Espèces'
  },
  creditCard: {
    en: 'Credit Card',
    fr: 'Carte de Crédit'
  },
  debitCard: {
    en: 'Debit Card',
    fr: 'Carte de Débit'
  },
  bankTransfer: {
    en: 'Bank Transfer',
    fr: 'Virement Bancaire'
  },
  check: {
    en: 'Check',
    fr: 'Chèque'
  },
  digitalWallet: {
    en: 'Digital Wallet',
    fr: 'Portefeuille Numérique'
  },
  partiallyPaid: {
    en: 'Partially Paid',
    fr: 'Partiellement Payé'
  },
  oneMonth: {
    en: '1 Month',
    fr: '1 Mois'
  },
  threeMonths: {
    en: '3 Months',
    fr: '3 Mois'
  },
  sixMonths: {
    en: '6 Months',
    fr: '6 Mois'
  },
  oneYear: {
    en: '1 Year',
    fr: '1 An'
  },
  officeSupplies: {
    en: 'Office Supplies',
    fr: 'Fournitures de Bureau'
  },
  equipment: {
    en: 'Equipment',
    fr: 'Équipement'
  },
  software: {
    en: 'Software',
    fr: 'Logiciel'
  },
  marketing: {
    en: 'Marketing',
    fr: 'Marketing'
  },
  travel: {
    en: 'Travel',
    fr: 'Voyage'
  },
  utilities: {
    en: 'Utilities',
    fr: 'Services Publics'
  },
  rent: {
    en: 'Rent',
    fr: 'Loyer'
  },
  professionalServices: {
    en: 'Professional Services',
    fr: 'Services Professionnels'
  },
  inventory: {
    en: 'Inventory',
    fr: 'Inventaire'
  },
  maintenance: {
    en: 'Maintenance',
    fr: 'Maintenance'
  },
  insurance: {
    en: 'Insurance',
    fr: 'Assurance'
  },
  loan: {
    en: 'Loan',
    fr: 'Prêt'
  },
  other: {
    en: 'Other',
    fr: 'Autre'
  },
  balanceHistory: {
    en: 'Balance History',
    fr: 'Historique du Solde'
  },
  linkReceiptsToPurchase: {
    en: 'Link Receipts to Purchase',
    fr: 'Lier les Reçus à l\'Achat'
  },
  editPurchase: {
    en: 'Edit Purchase',
    fr: 'Modifier l\'Achat'
  },
  selectDateRange: {
    en: 'Select Date Range',
    fr: 'Sélectionner une Plage de Dates'
  },
  fromDate: {
    en: 'From Date',
    fr: 'Date de Début'
  },
  toDate: {
    en: 'To Date',
    fr: 'Date de Fin'
  },
  montageCostSummary: {
    en: 'Montage Cost Summary',
    fr: 'Résumé des Coûts de Montage'
  },
  totalReceipts: {
    en: 'Total Receipts',
    fr: 'Total des Reçus'
  },
  totalMontage: {
    en: 'Total Montage',
    fr: 'Montage Total'
  },
  paidMontage: {
    en: 'Paid Montage',
    fr: 'Montage Payé'
  },
  unpaidBalance: {
    en: 'Unpaid Balance',
    fr: 'Solde Impayé'
  },
  filteredReceipts: {
    en: 'Filtered Receipts',
    fr: 'Reçus Filtrés'
  },
  noReceiptsInDateRange: {
    en: 'No receipts found in selected date range',
    fr: 'Aucun reçu trouvé dans la plage de dates sélectionnée'
  },
  linkToPurchase: {
    en: 'Link to Purchase',
    fr: 'Lier à l\'Achat'
  },
  linking: {
    en: 'Linking...',
    fr: 'Liaison en cours...'
  },
  noPurchasesFound: {
    en: 'No purchases found',
    fr: 'Aucun achat trouvé'
  },
  noSuppliersFound: {
    en: 'No suppliers found',
    fr: 'Aucun fournisseur trouvé'
  },
  loadingPurchases: {
    en: 'Loading purchases...',
    fr: 'Chargement des achats...'
  },
  recurringPurchasesRenewed: {
    en: 'Recurring Purchases Renewed',
    fr: 'Achats Récurrents Renouvelés'
  },
  recurringPurchasesRenewedDesc: {
    en: 'recurring purchase(s) have been automatically renewed.',
    fr: 'achat(s) récurrent(s) ont été automatiquement renouvelés.'
  },
  recurringPurchaseRenewed: {
    en: 'Recurring purchase renewed successfully',
    fr: 'Achat récurrent renouvelé avec succès'
  },
  failedToRenew: {
    en: 'Failed to renew recurring purchase',
    fr: 'Échec du renouvellement de l\'achat récurrent'
  },
  purchaseRecorded: {
    en: 'Purchase recorded successfully',
    fr: 'Achat enregistré avec succès'
  },
  purchaseUpdated: {
    en: 'Purchase updated successfully',
    fr: 'Achat mis à jour avec succès'
  },
  purchaseDeleted: {
    en: 'Purchase deleted successfully',
    fr: 'Achat supprimé avec succès'
  },
  supplierAdded: {
    en: 'Supplier added successfully',
    fr: 'Fournisseur ajouté avec succès'
  },
  supplierUpdated: {
    en: 'Supplier updated successfully',
    fr: 'Fournisseur mis à jour avec succès'
  },
  supplierDeleted: {
    en: 'Supplier deleted successfully',
    fr: 'Fournisseur supprimé avec succès'
  },
  failedToSavePurchase: {
    en: 'Failed to save purchase',
    fr: 'Échec de l\'enregistrement de l\'achat'
  },
  failedToUpdatePurchase: {
    en: 'Failed to update purchase',
    fr: 'Échec de la mise à jour de l\'achat'
  },
  failedToDeletePurchase: {
    en: 'Failed to delete purchase',
    fr: 'Échec de la suppression de l\'achat'
  },
  failedToSaveSupplier: {
    en: 'Failed to save supplier',
    fr: 'Échec de l\'enregistrement du fournisseur'
  },
  failedToDeleteSupplier: {
    en: 'Failed to delete supplier',
    fr: 'Échec de la suppression du fournisseur'
  },
  fillAllRequiredFields: {
    en: 'Please fill in all required fields',
    fr: 'Veuillez remplir tous les champs obligatoires'
  },
  ttcCannotBeLessHt: {
    en: 'TTC amount cannot be less than HT amount',
    fr: 'Le montant TTC ne peut pas être inférieur au montant HT'
  },
  advanceCannotExceedTtc: {
    en: 'Advance payment cannot be more than TTC amount',
    fr: 'Le paiement d\'avance ne peut pas dépasser le montant TTC'
  },
  confirmDeletePurchase: {
    en: 'Are you sure you want to delete this purchase?',
    fr: 'Êtes-vous sûr de vouloir supprimer cet achat?'
  },
  confirmDeleteSupplier: {
    en: 'Are you sure you want to delete this supplier?',
    fr: 'Êtes-vous sûr de vouloir supprimer ce fournisseur?'
  },
  linkedReceiptsSuccess: {
    en: 'current receipts',
    fr: 'reçus actuels'
  },
  linkedReceiptsSuccessDesc: {
    en: 'Future receipts in this date range will be automatically included.',
    fr: 'Les futurs reçus dans cette plage de dates seront automatiquement inclus.'
  },
  failedToLinkReceipts: {
    en: 'Failed to link receipts to purchase',
    fr: 'Échec de la liaison des reçus à l\'achat'
  },
  enterDescription: {
    en: 'Enter description',
    fr: 'Entrer la description'
  },
  enterAmount: {
    en: 'Enter amount',
    fr: 'Entrer le montant'
  },
  enterSupplierName: {
    en: 'Enter supplier name',
    fr: 'Entrer le nom du fournisseur'
  },
  enterContactPerson: {
    en: 'Enter contact person',
    fr: 'Entrer la personne de contact'
  },
  enterAddress: {
    en: 'Enter address',
    fr: 'Entrer l\'adresse'
  },
  enterNotes: {
    en: 'Enter notes',
    fr: 'Entrer des notes'
  },
  saveAndClose: {
    en: 'Save and Close',
    fr: 'Enregistrer et Fermer'
  },
  saving: {
    en: 'Saving...',
    fr: 'Enregistrement...'
  },
  updating: {
    en: 'Updating...',
    fr: 'Mise à jour...'
  },
  addNote: {
    en: 'Add Note',
    fr: 'Ajouter une Note'
  },
  enterNote: {
    en: 'Enter your note here...',
    fr: 'Entrez votre note ici...'
  },
  close: {
    en: 'Close',
    fr: 'Fermer'
  },
  viewNote: {
    en: 'View Note',
    fr: 'Voir la Note'
  }
};

const subscriptionsTranslations: Translations = {
  // Subscriptions page UI
  currentPlan: {
    en: 'Current Plan',
    fr: 'Plan Actuel'
  },
  startDate: {
    en: 'Start Date',
    fr: 'Date de Début'
  },
  expirationDate: {
    en: 'Expiration Date',
    fr: 'Date d\'Expiration'
  },
  notStarted: {
    en: 'Not Started',
    fr: 'Non Commencé'
  },
  notSet: {
    en: 'Not Set',
    fr: 'Non Défini'
  },
  never: {
    en: 'Never',
    fr: 'Jamais'
  },
  oneTimePayment: {
    en: 'One-time payment',
    fr: 'Paiement unique'
  },
  billedMonthly: {
    en: 'Billed monthly',
    fr: 'Facturé mensuellement'
  },
  billedQuarterly: {
    en: 'Billed quarterly',
    fr: 'Facturé trimestriellement'
  },
  popular: {
    en: 'Popular',
    fr: 'Populaire'
  },
  clientManagementSystem: {
    en: 'Client Management System',
    fr: 'Système de Gestion des Clients'
  },
  receiptGeneration: {
    en: 'Receipt Generation',
    fr: 'Génération de Reçus'
  },
  productInventory: {
    en: 'Product Inventory',
    fr: 'Inventaire des Produits'
  },
  salesAnalytics: {
    en: 'Sales Analytics',
    fr: 'Analyses des Ventes'
  },
  prescriptionManagement: {
    en: 'Prescription Management',
    fr: 'Gestion des Prescriptions'
  },
  prioritySupport: {
    en: 'Priority support',
    fr: 'Support prioritaire'
  },
  lifetimeUpdates: {
    en: 'Lifetime updates',
    fr: 'Mises à jour à vie'
  },
  noRecurringPayments: {
    en: 'No recurring payments',
    fr: 'Pas de paiements récurrents'
  },
  payViaBankTransfer: {
    en: 'Pay via Bank Transfer',
    fr: 'Payer par Virement Bancaire'
  },
  payWithCardPayPal: {
    en: 'Pay with Card/PayPal',
    fr: 'Payer par Carte/PayPal'
  },
  contactRequestSent: {
    en: 'Contact Request Sent',
    fr: 'Demande de Contact Envoyée'
  },
  adminWillContact: {
    en: 'An administrator will contact you shortly about your subscription.',
    fr: 'Un administrateur vous contactera bientôt au sujet de votre abonnement.'
  },
  subscriptionUpdated: {
    en: 'Subscription Updated',
    fr: 'Abonnement Mis à Jour'
  },
  nowSubscribedTo: {
    en: 'You are now subscribed to the',
    fr: 'Vous êtes maintenant abonné au plan'
  },
  plan: {
    en: 'plan.',
    fr: '.'
  },
  failedToUpdateSubscription: {
    en: 'Failed to update subscription. Please try again.',
    fr: 'Échec de la mise à jour de l\'abonnement. Veuillez réessayer.'
  },
  failedToLoadSubscription: {
    en: 'Failed to load subscription data. Please try again.',
    fr: 'Échec du chargement des données d\'abonnement. Veuillez réessayer.'
  },
  limitedOffer: {
    en: 'Limited Offer!',
    fr: 'Offre Limitée!'
  }
};

const settingsTranslations: Translations = {
  // Settings page UI
  opticianSettings: {
    en: 'Optician Settings',
    fr: 'Paramètres de l\'Opticien'
  },
  manageBusinessInfo: {
    en: 'Manage your business information and settings',
    fr: 'Gérez vos informations d\'entreprise et paramètres'
  },
  businessInformation: {
    en: 'Business Information',
    fr: 'Informations de l\'Entreprise'
  },
  storeName: {
    en: 'Store Name',
    fr: 'Nom du Magasin'
  },
  displayName: {
    en: 'Display Name',
    fr: 'Nom d\'Affichage'
  },
  businessAddress: {
    en: 'Business Address',
    fr: 'Adresse de l\'Entreprise'
  },
  companyLegalStatus: {
    en: 'Company Legal Status',
    fr: 'Statut Juridique de l\'Entreprise'
  },
  selectLegalStatus: {
    en: 'Select legal status',
    fr: 'Sélectionner le statut juridique'
  },
  taxLegalInformation: {
    en: 'Tax & Legal Information',
    fr: 'Informations Fiscales et Juridiques'
  },
  vatNumber: {
    en: 'VAT Number',
    fr: 'Numéro de TVA'
  },
  iceNumber: {
    en: 'ICE Number',
    fr: 'Numéro ICE'
  },
  inpeNumber: {
    en: 'INPE Number',
    fr: 'Numéro INPE'
  },
  contactInformation: {
    en: 'Contact Information',
    fr: 'Informations de Contact'
  },
  phoneNumber: {
    en: 'Phone Number',
    fr: 'Numéro de Téléphone'
  },
  emailAddress: {
    en: 'Email Address',
    fr: 'Adresse Email'
  },
  website: {
    en: 'Website',
    fr: 'Site Web'
  },
  businessLogo: {
    en: 'Business Logo',
    fr: 'Logo de l\'Entreprise'
  },
  uploadLogo: {
    en: 'Upload Logo',
    fr: 'Télécharger le Logo'
  },
  logoRecommendation: {
    en: 'Recommended: PNG or JPG format, max 2MB',
    fr: 'Recommandé: format PNG ou JPG, max 2MB'
  },
  saveChanges: {
    en: 'Save Changes',
    fr: 'Enregistrer les Modifications'
  },
  settingsSaved: {
    en: 'Settings Saved',
    fr: 'Paramètres Enregistrés'
  },
  eyesLinkingMarkupSettings: {
    en: 'Eyes Linking Markup Settings',
    fr: 'Paramètres de Majoration de Liaison des Yeux'
  },
  markupRangesConfiguration: {
    en: 'Markup Ranges Configuration',
    fr: 'Configuration des Plages de Majoration'
  },
  sphRanges: {
    en: 'SPH (Sphere) Ranges',
    fr: 'Plages SPH (Sphère)'
  },
  cylRanges: {
    en: 'CYL (Cylinder) Ranges',
    fr: 'Plages CYL (Cylindre)'
  },
  range1: {
    en: 'Range 1',
    fr: 'Plage 1'
  },
  range2: {
    en: 'Range 2',
    fr: 'Plage 2'
  },
  range3: {
    en: 'Range 3',
    fr: 'Plage 3'
  },
  min: {
    en: 'Min',
    fr: 'Min'
  },
  max: {
    en: 'Max',
    fr: 'Max'
  },
  markupPercent: {
    en: 'Markup %',
    fr: 'Marge %'
  },
  opticianInfoUpdated: {
    en: 'Your optician information has been successfully updated.',
    fr: 'Vos informations d\'opticien ont été mises à jour avec succès.'
  },
  failedToSaveInfo: {
    en: 'Failed to save your information. Please try again.',
    fr: 'Échec de l\'enregistrement de vos informations. Veuillez réessayer.'
  },
  logoUploaded: {
    en: 'Logo Uploaded',
    fr: 'Logo Téléchargé'
  },
  logoUploadedSuccess: {
    en: 'Your logo has been uploaded successfully.',
    fr: 'Votre logo a été téléchargé avec succès.'
  },
  uploadError: {
    en: 'Upload Error',
    fr: 'Erreur de Téléchargement'
  },
  failedToUploadLogo: {
    en: 'Failed to upload logo. Please try again.',
    fr: 'Échec du téléchargement du logo. Veuillez réessayer.'
  },
  enterStoreName: {
    en: 'Enter your store name',
    fr: 'Entrer le nom de votre magasin'
  },
  enterDisplayName: {
    en: 'Enter your display name',
    fr: 'Entrer votre nom d\'affichage'
  },
  enterCompleteAddress: {
    en: 'Enter your complete business address',
    fr: 'Entrer votre adresse d\'entreprise complète'
  },
  enterVatNumber: {
    en: 'Enter VAT number',
    fr: 'Entrer le numéro de TVA'
  },
  enterIceNumber: {
    en: 'Enter ICE number',
    fr: 'Entrer le numéro ICE'
  },
  enterInpeNumber: {
    en: 'Enter INPE number',
    fr: 'Entrer le numéro INPE'
  },
  enterPhoneNumber: {
    en: 'Enter phone number',
    fr: 'Entrer le numéro de téléphone'
  },
  enterEmailAddress: {
    en: 'Enter email address',
    fr: 'Entrer l\'adresse email'
  },
  enterWebsiteUrl: {
    en: 'Enter website URL',
    fr: 'Entrer l\'URL du site web'
  }
};

const navigationTranslations: Translations = {
  // Navigation menu items
  dashboard: {
    en: 'Dashboard',
    fr: 'Tableau de Bord'
  },
  products: {
    en: 'Products',
    fr: 'Produits'
  },
  clients: {
    en: 'Clients',
    fr: 'Clients'
  },
  receipts: {
    en: 'Receipts',
    fr: 'Reçus'
  },
  newReceipt: {
    en: 'New Receipt',
    fr: 'Nouveau Reçu'
  },
  subscriptions: {
    en: 'Subscriptions',
    fr: 'Abonnements'
  },
  purchases: {
    en: 'Purchases',
    fr: 'Achats'
  },
  financial: {
    en: 'Financial',
    fr: 'Financier'
  },
  access: {
    en: 'Access',
    fr: 'Accès'
  },
  settings: {
    en: 'Settings',
    fr: 'Paramètres'
  },
  administration: {
    en: 'Administration',
    fr: 'Administration'
  },
  welcomeBack: {
    en: 'Welcome back',
    fr: 'Bon retour'
  },
  accessAsAdmin: {
    en: 'Access as Admin',
    fr: 'Accès Admin'
  },
  admin: {
    en: 'Admin',
    fr: 'Admin'
  },
  enterAccessCodeToElevate: {
    en: 'Enter your access code to elevate to Admin privileges for this session.',
    fr: 'Entrez votre code d\'accès pour élever vos privilèges Admin pour cette session.'
  },
  accessCode: {
    en: 'Access Code',
    fr: 'Code d\'Accès'
  },
  enterAccessCodePlaceholder: {
    en: 'Enter 5-character access code',
    fr: 'Entrez le code d\'accès à 5 caractères'
  },
  cancel: {
    en: 'Cancel',
    fr: 'Annuler'
  },
  elevateAccess: {
    en: 'Elevate Access',
    fr: 'Élever l\'Accès'
  }
};

const accessTranslations: Translations = {
  // Access page UI
  accessManagement: {
    en: 'Access Management',
    fr: 'Gestion des Accès'
  },
  yourAccessInformation: {
    en: 'Your Access Information',
    fr: 'Vos Informations d\'Accès'
  },
  currentSessionRole: {
    en: 'Current Session Role',
    fr: 'Rôle de Session Actuel'
  },
  sessionElevated: {
    en: 'Session Elevated',
    fr: 'Session Élevée'
  },
  accessCode: {
    en: 'Access Code',
    fr: 'Code d\'Accès'
  },
  yourPermissions: {
    en: 'Your Permissions',
    fr: 'Vos Autorisations'
  },
  manageOwnPermissions: {
    en: 'Manage your own access permissions',
    fr: 'Gérez vos propres autorisations d\'accès'
  },
  manageProducts: {
    en: 'Manage Products',
    fr: 'Gérer les Produits'
  },
  manageClients: {
    en: 'Manage Clients',
    fr: 'Gérer les Clients'
  },
  manageReceipts: {
    en: 'Manage Receipts',
    fr: 'Gérer les Reçus'
  },
  viewFinancial: {
    en: 'View Financial',
    fr: 'Voir les Finances'
  },
  managePurchases: {
    en: 'Manage Purchases',
    fr: 'Gérer les Achats'
  },
  accessDashboard: {
    en: 'Access Dashboard',
    fr: 'Accéder au Tableau de Bord'
  },
  manageInvoices: {
    en: 'Manage Invoices',
    fr: 'Gérer les Factures'
  },
  loadingPermissions: {
    en: 'Loading your permissions...',
    fr: 'Chargement de vos autorisations...'
  },
  noPermissionsFound: {
    en: 'No permissions found',
    fr: 'Aucune autorisation trouvée'
  },
  yourPermissionsUpdated: {
    en: 'Your permissions updated successfully',
    fr: 'Vos autorisations ont été mises à jour avec succès'
  },
  staffPermissionsUpdated: {
    en: 'Staff permissions updated successfully',
    fr: 'Les autorisations du personnel ont été mises à jour avec succès'
  },
  failedToUpdatePermissions: {
    en: 'Failed to update permissions',
    fr: 'Échec de la mise à jour des autorisations'
  },
  pleaseEnterAccessCode: {
    en: 'Please enter an access code',
    fr: 'Veuillez entrer un code d\'accès'
  },
  pleaseLoginToAccess: {
    en: 'Please log in to access this page.',
    fr: 'Veuillez vous connecter pour accéder à cette page.'
  },
  admin: {
    en: 'Admin',
    fr: 'Administrateur'
  },
  storeStaff: {
    en: 'Store Staff',
    fr: 'Personnel du Magasin'
  }
};

const financialTranslations: Translations = {
  // Financial page UI
  financial: {
    en: 'Financial',
    fr: 'Financier'
  },
  financialOverview: {
    en: 'Financial Overview',
    fr: 'Aperçu Financier'
  },
  comprehensiveBusinessAnalytics: {
    en: 'Comprehensive business financial analytics & profitability tracking',
    fr: 'Analyses financières complètes de l\'entreprise et suivi de rentabilité'
  },
  viewCalculation: {
    en: 'View Calculation',
    fr: 'Voir le Calcul'
  },
  paidAtDeliveryCosts: {
    en: 'Paid at Delivery Costs',
    fr: 'Coûts Payés à la Livraison'
  },
  paidOperationalExpenses: {
    en: 'Paid Operational Expenses',
    fr: 'Dépenses Opérationnelles Payées'
  },
  paidMontageExpenses: {
    en: 'Paid Montage Expenses',
    fr: 'Dépenses de Montage Payées'
  },
  totalOperationalExpenses: {
    en: 'Total Operational Expenses',
    fr: 'Total des Dépenses Opérationnelles'
  },
  totalMontageExpenses: {
    en: 'Total Montage Expenses',
    fr: 'Total des Dépenses de Montage'
  },
  includesUnpaidBalance: {
    en: 'Includes unpaid balance',
    fr: 'Inclut le solde impayé'
  },
  collectionValue: {
    en: 'Collection Value',
    fr: 'Valeur de Collection'
  },
  comprehensiveBreakdownOfAllBusinessExpenses: {
    en: 'Comprehensive breakdown of all business expenses',
    fr: 'Répartition complète de toutes les dépenses commerciales'
  },
  productCostsByCategory: {
    en: 'Product Costs by Category',
    fr: 'Coûts des Produits par Catégorie'
  },
  analysisOfCapitalExpenditureAndOperationalExpenses: {
    en: 'Analysis of capital expenditure and operational expenses',
    fr: 'Analyse des dépenses d\'investissement et des dépenses opérationnelles'
  },
  totalPaid: {
    en: 'Total Paid',
    fr: 'Total Payé'
  },
  totalUnpaid: {
    en: 'Total Unpaid',
    fr: 'Total Impayé'
  },
  expenseTypeFilter: {
    en: 'Expense Type Filter',
    fr: 'Filtre de Type de Dépense'
  },
  allExpenseTypes: {
    en: 'All Expense Types',
    fr: 'Tous les Types de Dépenses'
  },
  paymentStatusFilter: {
    en: 'Payment Status Filter',
    fr: 'Filtre de Statut de Paiement'
  },
  allPaymentStatus: {
    en: 'All Payment Status',
    fr: 'Tous les Statuts de Paiement'
  },
  partiallyPaid: {
    en: 'Partially Paid',
    fr: 'Partiellement Payé'
  },
  supplierFilter: {
    en: 'Supplier Filter',
    fr: 'Filtre de Fournisseur'
  },
  allSuppliers: {
    en: 'All Suppliers',
    fr: 'Tous les Fournisseurs'
  },
  fullyPaid: {
    en: 'Fully Paid',
    fr: 'Entièrement Payé'
  },
  noExpensesFoundMatchingFilters: {
    en: 'No expenses found matching the selected filters',
    fr: 'Aucune dépense trouvée correspondant aux filtres sélectionnés'
  },
  dateRangeFilter: {
    en: 'Date Range Filter',
    fr: 'Filtre de Plage de Dates'
  },
  fromDate: {
    en: 'From Date',
    fr: 'Date de Début'
  },
  toDate: {
    en: 'To Date',
    fr: 'Date de Fin'
  },
  thisMonth: {
    en: 'This Month',
    fr: 'Ce Mois'
  },
  lastMonth: {
    en: 'Last Month',
    fr: 'Le Mois Dernier'
  },
  thisYear: {
    en: 'This Year',
    fr: 'Cette Année'
  },
  last7Days: {
    en: 'Last 7 Days',
    fr: '7 Derniers Jours'
  },
  availableCash: {
    en: 'Available Cash',
    fr: 'Liquidités Disponibles'
  },
  netFlow: {
    en: 'Net Flow',
    fr: 'Flux Net'
  },
  totalRevenue: {
    en: 'Total Revenue',
    fr: 'Chiffre d\'Affaires Total'
  },
  collected: {
    en: 'Collected',
    fr: 'Collecté'
  },
  netProfitPaid: {
    en: 'Net Profit (Paid)',
    fr: 'Bénéfice Net (Payé)'
  },
  margin: {
    en: 'Margin',
    fr: 'Marge'
  },
  netProfitTotal: {
    en: 'Net Profit (Total)',
    fr: 'Bénéfice Net (Total)'
  },
  unpaidExpenses: {
    en: 'Unpaid Expenses',
    fr: 'Dépenses Impayées'
  },
  outstandingLiabilities: {
    en: 'Outstanding Liabilities',
    fr: 'Passifs Impayés'
  },
  productCosts: {
    en: 'Product Costs',
    fr: 'Coûts des Produits'
  },
  totalCOGS: {
    en: 'Total COGS',
    fr: 'Coût Total des Marchandises Vendues'
  },
  comprehensiveReceiptItemsAnalysis: {
    en: 'Comprehensive Receipt Items Analysis',
    fr: 'Analyse Complète des Articles de Reçus'
  },
  detailedAnalysisAllSoldItems: {
    en: 'Detailed analysis of all sold items with advanced filtering capabilities',
    fr: 'Analyse détaillée de tous les articles vendus avec des capacités de filtrage avancées'
  },
  includePaidAtDeliveryItems: {
    en: 'Include Paid at Delivery Items',
    fr: 'Inclure les Articles Payés à la Livraison'
  },
  currentlyIncluding: {
    en: 'Currently including',
    fr: 'Inclut actuellement'
  },
  currentlyExcluding: {
    en: 'Currently excluding',
    fr: 'Exclut actuellement'
  },
  paidAtDeliveryItems: {
    en: 'paid at delivery items',
    fr: 'les articles payés à la livraison'
  },
  categoryFilter: {
    en: 'Category Filter',
    fr: 'Filtre par Catégorie'
  },
  allCategories: {
    en: 'All Categories',
    fr: 'Toutes les Catégories'
  },
  companyFilter: {
    en: 'Company Filter',
    fr: 'Filtre par Entreprise'
  },
  allCompanies: {
    en: 'All Companies',
    fr: 'Toutes les Entreprises'
  },
  stockStatusFilter: {
    en: 'Stock Status Filter',
    fr: 'Filtre par État du Stock'
  },
  allStockStatus: {
    en: 'All Stock Status',
    fr: 'Tous les États de Stock'
  },
  inStock: {
    en: 'In Stock',
    fr: 'En Stock'
  },
  fabrication: {
    en: 'Fabrication',
    fr: 'Fabrication'
  },
  order: {
    en: 'Order',
    fr: 'Commande'
  },
  paidAtDeliveryFilter: {
    en: 'Paid at Delivery Filter',
    fr: 'Filtre Payé à la Livraison'
  },
  allItems: {
    en: 'All Items',
    fr: 'Tous les Articles'
  },
  paidAtDelivery: {
    en: 'Paid at Delivery',
    fr: 'Payé à la Livraison'
  },
  notPaidAtDelivery: {
    en: 'Not Paid at Delivery',
    fr: 'Non Payé à la Livraison'
  },
  totalItems: {
    en: 'Total Items',
    fr: 'Total des Articles'
  },
  totalCost: {
    en: 'Total Cost',
    fr: 'Coût Total'
  },
  totalProfit: {
    en: 'Total Profit',
    fr: 'Bénéfice Total'
  },
  qty: {
    en: 'Qty',
    fr: 'Qté'
  },
  unitCost: {
    en: 'Unit Cost',
    fr: 'Coût Unitaire'
  },
  profit: {
    en: 'Profit',
    fr: 'Bénéfice'
  },
  noItemsFoundMatchingFilters: {
    en: 'No items found matching the selected filters.',
    fr: 'Aucun article trouvé correspondant aux filtres sélectionnés.'
  },
  comprehensiveFinancialAnalysis: {
    en: 'Comprehensive Financial Analysis & Profit Breakdown',
    fr: 'Analyse Financière Complète et Répartition des Bénéfices'
  },
  completeProfitAnalysisDescription: {
    en: 'Complete profit analysis including all costs, expenses, and unclaimed balance scenarios',
    fr: 'Analyse complète des bénéfices incluant tous les coûts, dépenses et scénarios de soldes non réclamés'
  },
  revenueAnalysis: {
    en: 'Revenue Analysis',
    fr: 'Analyse des Revenus'
  },
  totalRevenueInvoiced: {
    en: 'Total Revenue (Invoiced)',
    fr: 'Chiffre d\'Affaires Total (Facturé)'
  },
  revenueReceived: {
    en: 'Revenue Received',
    fr: 'Revenus Reçus'
  },
  unclaimedBalance: {
    en: 'Unclaimed Balance',
    fr: 'Solde Non Réclamé'
  },
  costBreakdown: {
    en: 'Cost Breakdown',
    fr: 'Répartition des Coûts'
  },
  productCostsCOGS: {
    en: 'Product Costs (COGS)',
    fr: 'Coûts des Produits (COGS)'
  },
  operationalExpenses: {
    en: 'Operational Expenses',
    fr: 'Dépenses Opérationnelles'
  },
  montageCosts: {
    en: 'Montage Costs',
    fr: 'Coûts de Montage'
  },
  detailedExpenseAnalysis: {
    en: 'Detailed Expense Analysis',
    fr: 'Analyse Détaillée des Dépenses'
  },
  total: {
    en: 'Total',
    fr: 'Total'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé'
  },
  unpaid: {
    en: 'Unpaid',
    fr: 'Impayé'
  },
  operational: {
    en: 'Operational',
    fr: 'Opérationnel'
  },
  payment: {
    en: 'Paiement',
    fr: 'Paiement'
  },
  directMaterialCosts: {
    en: 'Direct Material Costs',
    fr: 'Coûts Directs des Matériaux'
  },
  costOfGoodsSoldFromReceiptItems: {
    en: 'Cost of goods sold from receipt items',
    fr: 'Coût des marchandises vendues à partir des articles de reçus'
  },
  profitAnalysisRevenueScenarios: {
    en: 'Profit Analysis & Revenue Scenarios',
    fr: 'Analyse des Bénéfices et Scénarios de Revenus'
  },
  currentPositionReceivedRevenue: {
    en: 'Current Position (Received Revenue)',
    fr: 'Position Actuelle (Revenus Reçus)'
  },
  actualCashReceivedFromCustomers: {
    en: 'Actual cash received from customers',
    fr: 'Liquidités réellement reçues des clients'
  },
  lessProductCostsIncludingPaidAtDelivery: {
    en: 'Less: Product Costs (Including Paid at Delivery)',
    fr: 'Moins: Coûts des Produits (Y compris Payé à la Livraison)'
  },
  productCostsBreakdown: {
    en: 'Product costs breakdown:',
    fr: 'Répartition des coûts des produits:'
  },
  directMaterialCostsBreakdown: {
    en: '• Direct material costs',
    fr: '• Coûts directs des matériaux'
  },
  paidAtDeliveryCostsBreakdown: {
    en: '• Paid at delivery costs',
    fr: '• Coûts payés à la livraison'
  },
  lessPaidOpExpenses: {
    en: 'Less: Paid Op. Expenses',
    fr: 'Moins: Dépenses Op. Payées'
  },
  lessPaidMontage: {
    en: 'Less: Paid Montage',
    fr: 'Moins: Montage Payé'
  },
  currentNetPosition: {
    en: 'Current Net Position',
    fr: 'Position Nette Actuelle'
  },
  currentCashPositionAfterAllPaidCosts: {
    en: 'This is your current cash position after all paid costs',
    fr: 'Ceci est votre position de liquidités actuelle après tous les coûts payés'
  },
  pendingLiabilities: {
    en: 'Pending Liabilities',
    fr: 'Passifs en Attente'
  },
  unpaidExpensesFutureCashFlow: {
    en: 'Unpaid expenses that will impact future cash flow',
    fr: 'Dépenses impayées qui impacteront les flux de trésorerie futurs'
  },
  fullPotentialIfAllRevenueCollected: {
    en: 'Full Potential (If All Revenue Collected)',
    fr: 'Potentiel Complet (Si Tous les Revenus Sont Collectés)'
  },
  totalInvoicedRevenue: {
    en: 'Total Invoiced Revenue',
    fr: 'Chiffre d\'Affaires Total Facturé'
  },
  includingUnclaimedBalance: {
    en: 'Including unclaimed balance:',
    fr: 'Y compris le solde non réclamé:'
  },
  lessAllOpExpenses: {
    en: 'Less: All Op. Expenses',
    fr: 'Moins: Toutes les Dépenses Op.'
  },
  lessAllMontage: {
    en: 'Less: All Montage',
    fr: 'Moins: Tout le Montage'
  },
  totalNetProfit: {
    en: 'Total Net Profit',
    fr: 'Bénéfice Net Total'
  },
  maximumPotentialProfitIfAllRevenueCollected: {
    en: 'Maximum potential profit if all revenue collected',
    fr: 'Bénéfice potentiel maximum si tous les revenus sont collectés'
  },
  collectionImpact: {
    en: 'Collection Impact',
    fr: 'Impact de la Collecte'
  },
  additionalProfitFromCollectingBalance: {
    en: 'Additional profit from collecting outstanding balance and paying remaining expenses',
    fr: 'Bénéfice supplémentaire en collectant le solde impayé et en payant les dépenses restantes'
  },
  financialPerformanceMetrics: {
    en: 'Financial Performance Metrics',
    fr: 'Indicateurs de Performance Financière'
  },
  grossMargin: {
    en: 'Gross Margin',
    fr: 'Marge Brute'
  },
  netMarginCurrent: {
    en: 'Net Margin (Current)',
    fr: 'Marge Nette (Actuelle)'
  },
  netMarginFull: {
    en: 'Net Margin (Full)',
    fr: 'Marge Nette (Complète)'
  },
  collectionRate: {
    en: 'Collection Rate',
    fr: 'Taux de Collecte'
  },
  comprehensiveFinancialAnalysisProfit: {
    en: 'Comprehensive Financial Analysis & Profit Breakdown',
    fr: 'Analyse Financière Complète et Répartition des Bénéfices'
  },
  completeProfitAnalysisDescription: {
    en: 'Complete profit analysis including all costs, expenses, and unclaimed balance scenarios',
    fr: 'Analyse complète des bénéfices incluant tous les coûts, dépenses et scénarios de soldes non réclamés'
  },
  revenueAnalysis: {
    en: 'Revenue Analysis',
    fr: 'Analyse des Revenus'
  },
  totalRevenueInvoiced: {
    en: 'Total Revenue (Invoiced)',
    fr: 'Chiffre d\'Affaires Total (Facturé)'
  },
  revenueReceived: {
    en: 'Revenue Received',
    fr: 'Revenus Reçus'
  },
  unclaimedBalance: {
    en: 'Unclaimed Balance',
    fr: 'Solde Non Réclamé'
  },
  costBreakdown: {
    en: 'Cost Breakdown',
    fr: 'Répartition des Coûts'
  },
  productCostsCOGS: {
    en: 'Product Costs (COGS)',
    fr: 'Coûts des Produits (COGS)'
  },
  detailedExpenseAnalysis: {
    en: 'Detailed Expense Analysis',
    fr: 'Analyse Détaillée des Dépenses'
  },
  operational: {
    en: 'Operational',
    fr: 'Opérationnel'
  },
  payment: {
    en: 'Paiement',
    fr: 'Paiement'
  },
  directMaterialCosts: {
    en: 'Direct Material Costs',
    fr: 'Coûts Directs des Matériaux'
  },
  costOfGoodsSoldFromReceiptItems: {
    en: 'Cost of goods sold from receipt items',
    fr: 'Coût des marchandises vendues à partir des articles de reçus'
  },
  profitAnalysisRevenueScenarios: {
    en: 'Profit Analysis & Revenue Scenarios',
    fr: 'Analyse des Bénéfices et Scénarios de Revenus'
  },
  currentPositionReceivedRevenue: {
    en: 'Current Position (Received Revenue)',
    fr: 'Position Actuelle (Revenus Reçus)'
  },
  actualCashReceivedFromCustomers: {
    en: 'Actual cash received from customers',
    fr: 'Liquidités réellement reçues des clients'
  },
  lessProductCostsIncludingPaidAtDelivery: {
    en: 'Less: Product Costs (Including Paid at Delivery)',
    fr: 'Moins: Coûts des Produits (Y compris Payé à la Livraison)'
  },
  productCostsBreakdown: {
    en: 'Product costs breakdown:',
    fr: 'Répartition des coûts des produits:'
  },
  directMaterialCostsBreakdown: {
    en: '• Direct material costs',
    fr: '• Coûts directs des matériaux'
  },
  paidAtDeliveryCostsBreakdown: {
    en: '• Paid at delivery costs',
    fr: '• Coûts payés à la livraison'
  },
  lessPaidOpExpenses: {
    en: 'Less: Paid Op. Expenses',
    fr: 'Moins: Dépenses Op. Payées'
  },
  lessPaidMontage: {
    en: 'Less: Paid Montage',
    fr: 'Moins: Montage Payé'
  },
  currentNetPosition: {
    en: 'Current Net Position',
    fr: 'Position Nette Actuelle'
  },
  currentCashPositionAfterAllPaidCosts: {
    en: 'This is your current cash position after all paid costs',
    fr: 'Ceci est votre position de liquidités actuelle après tous les coûts payés'
  },
  pendingLiabilities: {
    en: 'Pending Liabilities',
    fr: 'Passifs en Attente'
  },
  unpaidExpensesFutureCashFlow: {
    en: 'Unpaid expenses that will impact future cash flow',
    fr: 'Dépenses impayées qui impacteront les flux de trésorerie futurs'
  },
  fullPotentialIfAllRevenueCollected: {
    en: 'Full Potential (If All Revenue Collected)',
    fr: 'Potentiel Complet (Si Tous les Revenus Sont Collectés)'
  },
  totalInvoicedRevenue: {
    en: 'Total Invoiced Revenue',
    fr: 'Chiffre d\'Affaires Total Facturé'
  },
  includingUnclaimedBalance: {
    en: 'Including unclaimed balance:',
    fr: 'Y compris le solde non réclamé:'
  },
  lessAllOpExpenses: {
    en: 'Less: All Op. Expenses',
    fr: 'Moins: Toutes les Dépenses Op.'
  },
  lessAllMontage: {
    en: 'Less: All Montage',
    fr: 'Moins: Tout le Montage'
  },
  totalNetProfit: {
    en: 'Total Net Profit',
    fr: 'Bénéfice Net Total'
  },
  maximumPotentialProfitIfAllRevenueCollected: {
    en: 'Maximum potential profit if all revenue collected',
    fr: 'Bénéfice potentiel maximum si tous les revenus sont collectés'
  },
  collectionImpact: {
    en: 'Collection Impact',
    fr: 'Impact de la Collecte'
  },
  additionalProfitFromCollectingBalance: {
    en: 'Additional profit from collecting outstanding balance and paying remaining expenses',
    fr: 'Bénéfice supplémentaire en collectant le solde impayé et en payant les dépenses restantes'
  },
  financialPerformanceMetrics: {
    en: 'Financial Performance Metrics',
    fr: 'Indicateurs de Performance Financière'
  },
  grossMargin: {
    en: 'Gross Margin',
    fr: 'Marge Brute'
  },
  netMarginCurrent: {
    en: 'Net Margin (Current)',
    fr: 'Marge Nette (Actuelle)'
  },
  netMarginFull: {
    en: 'Net Margin (Full)',
    fr: 'Marge Nette (Complète)'
  },
  collectionRate: {
    en: 'Collection Rate',
    fr: 'Taux de Collecte'
  },
  detailedExpenditureAnalysis: {
    en: 'Detailed Expenditure Analysis',
    fr: 'Analyse Détaillée des Dépenses'
  },
  
  totalCapitalExpenditure: {
    en: 'Total Capital Expenditure',
    fr: 'Total des Dépenses d\'Investissement'
  },
  amountPaid: {
    en: 'Amount Paid',
    fr: 'Montant Payé'
  },
  outstandingBalance: {
    en: 'Outstanding Balance',
    fr: 'Solde Impayé'
  },
  paymentProgress: {
    en: 'Payment Progress',
    fr: 'Progression du Paiement'
  },
  capitalExpenditureBreakdown: {
    en: 'Capital Expenditure Breakdown',
    fr: 'Répartition des Dépenses d\'Investissement'
  },
  supplier: {
    en: 'Supplier',
    fr: 'Fournisseur'
  },
  date: {
    en: 'Date',
    fr: 'Date'
  },
  outstanding: {
    en: 'Outstanding',
    fr: 'Impayé'
  },
  paidPercentage: {
    en: 'paid',
    fr: 'payé'
  },
  performanceSummary: {
    en: 'Performance Summary',
    fr: 'Résumé de Performance'
  },
  totalOrders: {
    en: 'Total Orders',
    fr: 'Total des Commandes'
  },
  capitalPurchases: {
    en: 'Capital Purchases',
    fr: 'Achats d\'Investissement'
  },
  averageOrderValue: {
    en: 'Average Order Value',
    fr: 'Valeur Moyenne de Commande'
  },
  currentlyIncluding: {
    en: 'Currently including',
    fr: 'Inclut actuellement'
  },
  currentlyExcluding: {
    en: 'Currently excluding',
    fr: 'Exclut actuellement'
  },
  paidAtDeliveryItems: {
    en: 'paid at delivery items',
    fr: 'les articles payés à la livraison'
  },
  categoryFilter: {
    en: 'Category Filter',
    fr: 'Filtre par Catégorie'
  },
  companyFilter: {
    en: 'Company Filter',
    fr: 'Filtre par Entreprise'
  },
  stockStatusFilter: {
    en: 'Stock Status Filter',
    fr: 'Filtre par État du Stock'
  },
  allStockStatus: {
    en: 'All Stock Status',
    fr: 'Tous les États de Stock'
  },
  paidAtDeliveryFilter: {
    en: 'Paid at Delivery Filter',
    fr: 'Filtre Payé à la Livraison'
  },
  totalItems: {
    en: 'Total Items',
    fr: 'Total des Articles'
  },
  totalRevenue: {
    en: 'Total Revenue',
    fr: 'Chiffre d\'Affaires Total'
  },
  noItemsFoundMatchingFilters: {
    en: 'No items found matching the selected filters.',
    fr: 'Aucun article trouvé correspondant aux filtres sélectionnés.'
  },
  comprehensiveFinancialAnalysisProfit: {
    en: 'Comprehensive Financial Analysis & Profit Breakdown',
    fr: 'Analyse Financière Complète et Répartition des Bénéfices'
  },
  completeProfitAnalysisDescription: {
    en: 'Complete profit analysis including all costs, expenses, and unclaimed balance scenarios',
    fr: 'Analyse complète des bénéfices incluant tous les coûts, dépenses et scénarios de soldes non réclamés'
  },
  revenueAnalysis: {
    en: 'Revenue Analysis',
    fr: 'Analyse des Revenus'
  },
  totalRevenueInvoiced: {
    en: 'Total Revenue (Invoiced)',
    fr: 'Chiffre d\'Affaires Total (Facturé)'
  },
  revenueReceived: {
    en: 'Revenue Received',
    fr: 'Revenus Reçus'
  },
  unclaimedBalance: {
    en: 'Unclaimed Balance',
    fr: 'Solde Non Réclamé'
  },
  costBreakdown: {
    en: 'Cost Breakdown',
    fr: 'Répartition des Coûts'
  },
  productCostsCOGS: {
    en: 'Product Costs (COGS)',
    fr: 'Coûts des Produits (COGS)'
  },
  detailedExpenseAnalysis: {
    en: 'Detailed Expense Analysis',
    fr: 'Analyse Détaillée des Dépenses'
  },
  directMaterialCosts: {
    en: 'Direct Material Costs',
    fr: 'Coûts Directs des Matériaux'
  },
  costOfGoodsSoldFromReceiptItems: {
    en: 'Cost of goods sold from receipt items',
    fr: 'Coût des marchandises vendues à partir des articles de reçus'
  },
  profitAnalysisRevenueScenarios: {
    en: 'Profit Analysis & Revenue Scenarios',
    fr: 'Analyse des Bénéfices et Scénarios de Revenus'
  },
  currentPositionReceivedRevenue: {
    en: 'Current Position (Received Revenue)',
    fr: 'Position Actuelle (Revenus Reçus)'
  },
  actualCashReceivedFromCustomers: {
    en: 'Actual cash received from customers',
    fr: 'Liquidités réellement reçues des clients'
  },
  lessProductCostsIncludingPaidAtDelivery: {
    en: 'Less: Product Costs (Including Paid at Delivery)',
    fr: 'Moins: Coûts des Produits (Y compris Payé à la Livraison)'
  },
  productCostsBreakdown: {
    en: 'Product costs breakdown:',
    fr: 'Répartition des coûts des produits:'
  },
  directMaterialCostsBreakdown: {
    en: '• Direct material costs',
    fr: '• Coûts directs des matériaux'
  },
  paidAtDeliveryCostsBreakdown: {
    en: '• Paid at delivery costs',
    fr: '• Coûts payés à la livraison'
  },
  lessPaidOpExpenses: {
    en: 'Less: Paid Op. Expenses',
    fr: 'Moins: Dépenses Op. Payées'
  },
  lessPaidMontage: {
    en: 'Less: Paid Montage',
    fr: 'Moins: Montage Payé'
  },
  currentNetPosition: {
    en: 'Current Net Position',
    fr: 'Position Nette Actuelle'
  },
  currentCashPositionAfterAllPaidCosts: {
    en: 'This is your current cash position after all paid costs',
    fr: 'Ceci est votre position de liquidités actuelle après tous les coûts payés'
  },
  pendingLiabilities: {
    en: 'Pending Liabilities',
    fr: 'Passifs en Attente'
  },
  unpaidExpensesFutureCashFlow: {
    en: 'Unpaid expenses that will impact future cash flow',
    fr: 'Dépenses impayées qui impacteront les flux de trésorerie futurs'
  },
  fullPotentialIfAllRevenueCollected: {
    en: 'Full Potential (If All Revenue Collected)',
    fr: 'Potentiel Complet (Si Tous les Revenus Sont Collectés)'
  },
  includingUnclaimedBalance: {
    en: 'Including unclaimed balance:',
    fr: 'Y compris le solde non réclamé:'
  },
  lessAllOpExpenses: {
    en: 'Less: All Op. Expenses',
    fr: 'Moins: Toutes les Dépenses Op.'
  },
  lessAllMontage: {
    en: 'Less: All Montage',
    fr: 'Moins: Tout le Montage'
  },
  totalNetProfit: {
    en: 'Total Net Profit',
    fr: 'Bénéfice Net Total'
  },
  maximumPotentialProfitIfAllRevenueCollected: {
    en: 'Maximum potential profit if all revenue collected',
    fr: 'Bénéfice potentiel maximum si tous les revenus sont collectés'
  },
  collectionImpact: {
    en: 'Collection Impact',
    fr: 'Impact de la Collecte'
  },
  additionalProfitFromCollectingBalance: {
    en: 'Additional profit from collecting outstanding balance and paying remaining expenses',
    fr: 'Bénéfice supplémentaire en collectant le solde impayé et en payant les dépenses restantes'
  },
  financialPerformanceMetrics: {
    en: 'Financial Performance Metrics',
    fr: 'Indicateurs de Performance Financière'
  },
  grossMargin: {
    en: 'Gross Margin',
    fr: 'Marge Brute'
  },
  netMarginCurrent: {
    en: 'Net Margin (Current)',
    fr: 'Marge Nette (Actuelle)'
  },
  netMarginFull: {
    en: 'Net Margin (Full)',
    fr: 'Marge Nette (Complète)'
  },
  totalFilteredExpenses: {
    en: 'Total Filtered Expenses',
    fr: 'Total des Dépenses Filtrées'
  }
};

const authTranslations: Translations = {
  // Auth page UI
  welcomeBack: {
    en: 'Welcome back',
    fr: 'Bienvenue'
  },
  createAccount: {
    en: 'Create account',
    fr: 'Créer un compte'
  },
  signInToAccessDashboard: {
    en: 'Sign in to access your optical store dashboard',
    fr: 'Connectez-vous pour accéder au tableau de bord de votre magasin d\'optique'
  },
  startManagingOpticalStore: {
    en: 'Start managing your optical store today',
    fr: 'Commencez à gérer votre magasin d\'optique aujourd\'hui'
  },
  signIn: {
    en: 'Sign In',
    fr: 'Se connecter'
  },
  signUp: {
    en: 'Sign Up',
    fr: 'S\'inscrire'
  },
  emailAddress: {
    en: 'Email Address',
    fr: 'Adresse e-mail'
  },
  enterEmailPlaceholder: {
    en: 'name@company.com',
    fr: 'nom@entreprise.com'
  },
  password: {
    en: 'Password',
    fr: 'Mot de passe'
  },
  enterPasswordPlaceholder: {
    en: 'Enter your password',
    fr: 'Entrez votre mot de passe'
  },
  forgotPassword: {
    en: 'Forgot password?',
    fr: 'Mot de passe oublié ?'
  },
  signingYouIn: {
    en: 'Signing you in...',
    fr: 'Connexion en cours...'
  },
  signInToDashboard: {
    en: 'Sign in to Dashboard',
    fr: 'Se connecter au tableau de bord'
  },
  personalInformation: {
    en: 'Personal Information',
    fr: 'Informations personnelles'
  },
  basicDetailsAboutYou: {
    en: 'Basic details about you and your store',
    fr: 'Informations de base sur vous et votre magasin'
  },
  fullName: {
    en: 'Full Name',
    fr: 'Nom complet'
  },
  fullNamePlaceholder: {
    en: 'John Doe',
    fr: 'Jean Dupont'
  },
  storeName: {
    en: 'Store Name',
    fr: 'Nom du magasin'
  },
  storeNamePlaceholder: {
    en: 'My Optical Store',
    fr: 'Mon Magasin d\'Optique'
  },
  storeNameDescription: {
    en: 'This will appear on your receipts and invoices',
    fr: 'Ceci apparaîtra sur vos reçus et factures'
  },
  accessAndReferral: {
    en: 'Access & Referral',
    fr: 'Accès et parrainage'
  },
  requiredCodesVerification: {
    en: 'Required codes for account verification',
    fr: 'Codes requis pour la vérification du compte'
  },
  accessCode: {
    en: 'Access Code',
    fr: 'Code d\'accès'
  },
  accessCodePlaceholder: {
    en: 'ABCDE',
    fr: 'ABCDE'
  },
  accessCodeRequired: {
    en: 'Required: This is your unique 5-character access code which will give admin access to any user with access to it.',
    fr: 'Requis : Il s\'agit de votre code d\'accès unique à 5 caractères qui donnera un accès administrateur à tout utilisateur y ayant accès.'
  },
  referralCode: {
    en: 'Referral Code',
    fr: 'Code de parrainage'
  },
  referralCodeOptional: {
    en: '(Optional)',
    fr: '(Optionnel)'
  },
  referralCodePlaceholder: {
    en: 'ABCD',
    fr: 'ABCD'
  },
  referralCodeOptionalDesc: {
    en: 'Optional: Enter a referral code from an existing user to get special benefits. Leave blank if you don\'t have one.',
    fr: 'Optionnel : Entrez un code de parrainage d\'un utilisateur existant pour obtenir des avantages spéciaux. Laissez vide si vous n\'en avez pas.'
  },
  security: {
    en: 'Security',
    fr: 'Sécurité'
  },
  createSecurePassword: {
    en: 'Create a secure password for your account',
    fr: 'Créez un mot de passe sécurisé pour votre compte'
  },
  passwordRequired: {
    en: 'Password*',
    fr: 'Mot de passe*'
  },
  createStrongPasswordPlaceholder: {
    en: 'Create a strong password',
    fr: 'Créez un mot de passe fort'
  },
  confirmPassword: {
    en: 'Confirm Password*',
    fr: 'Confirmer le mot de passe*'
  },
  confirmPasswordPlaceholder: {
    en: 'Confirm your password',
    fr: 'Confirmez votre mot de passe'
  },
  creatingAccount: {
    en: 'Creating your account...',
    fr: 'Création de votre compte...'
  },
  createMyAccount: {
    en: 'Create My Account',
    fr: 'Créer mon compte'
  },
  byContinuing: {
    en: 'By continuing, you agree to our',
    fr: 'En continuant, vous acceptez nos'
  },
  termsOfService: {
    en: 'Terms of Service',
    fr: 'Conditions d\'utilisation'
  },
  and: {
    en: 'and',
    fr: 'et'
  },
  privacyPolicy: {
    en: 'Privacy Policy',
    fr: 'Politique de confidentialité'
  },
  needHelp: {
    en: 'Need help?',
    fr: 'Besoin d\'aide ?'
  },
  contactSupport: {
    en: 'Contact Support',
    fr: 'Contacter le support'
  },
  opticalStoreManagement: {
    en: 'Optical Store Management',
    fr: 'Gestion de Magasin d\'Optique'
  },
  modernOpticalDescription: {
    en: 'Modern optical store management system designed for efficiency and growth',
    fr: 'Système de gestion moderne pour magasins d\'optique conçu pour l\'efficacité et la croissance'
  },
  lightningFast: {
    en: 'Lightning Fast',
    fr: 'Ultra Rapide'
  },
  lightningFastDesc: {
    en: 'Optimized for speed and performance',
    fr: 'Optimisé pour la vitesse et la performance'
  },
  secureReliable: {
    en: 'Secure & Reliable',
    fr: 'Sécurisé et Fiable'
  },
  secureReliableDesc: {
    en: 'Enterprise-grade security',
    fr: 'Sécurité de niveau entreprise'
  },
  multiUserReady: {
    en: 'Multi-User Ready',
    fr: 'Multi-utilisateurs'
  },
  multiUserReadyDesc: {
    en: 'Perfect for teams of any size',
    fr: 'Parfait pour les équipes de toute taille'
  },
  // Toast messages
  error: {
    en: 'Error',
    fr: 'Erreur'
  },
  enterBothEmailPassword: {
    en: 'Please enter both email and password.',
    fr: 'Veuillez saisir l\'e-mail et le mot de passe.'
  },
  success: {
    en: 'Success',
    fr: 'Succès'
  },
  loggedInSuccessfully: {
    en: 'Logged in successfully.',
    fr: 'Connexion réussie.'
  },
  loginFailed: {
    en: 'Login Failed',
    fr: 'Échec de la connexion'
  },
  loginError: {
    en: 'An error occurred during login.',
    fr: 'Une erreur s\'est produite lors de la connexion.'
  },
  fillAllRequiredFields: {
    en: 'Please fill in all required fields including access code.',
    fr: 'Veuillez remplir tous les champs requis, y compris le code d\'accès.'
  },
  passwordsDoNotMatch: {
    en: 'Passwords do not match.',
    fr: 'Les mots de passe ne correspondent pas.'
  },
  accountCreatedSuccessfully: {
    en: 'Account created successfully. You may need to verify your email before logging in.',
    fr: 'Compte créé avec succès. Vous devrez peut-être vérifier votre e-mail avant de vous connecter.'
  },
  signupFailed: {
    en: 'Signup Failed',
    fr: 'Échec de l\'inscription'
  },
  signupError: {
    en: 'An error occurred during signup.',
    fr: 'Une erreur s\'est produite lors de l\'inscription.'
  }
};

const allTranslations: Translations = {
  ...homeTranslations,
  ...dashboardTranslations,
  ...productTranslations,
  ...pricingTranslations,
  ...receiptTranslations,
  ...clientsTranslations,
  ...purchasesTranslations,
  ...navigationTranslations,
  ...subscriptionsTranslations,
  ...settingsTranslations,
  ...accessTranslations,
  ...financialTranslations,
  ...authTranslations,
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
  },
  // Invoice translations
  addInvoice: {
    en: 'Add Invoice',
    fr: 'Ajouter Facture',
    ar: 'إضافة فاتورة'
  },
  invoices: {
    en: 'Invoices',
    fr: 'Factures',
    ar: 'الفواتير'
  },
  copyFromReceipt: {
    en: 'Copy from Receipt',
    fr: 'Copier du Reçu',
    ar: 'نسخ من الوصل'
  },
  optional: {
    en: 'Optional',
    fr: 'Optionnel',
    ar: 'اختياري'
  },
  selectReceipt: {
    en: 'Select Receipt',
    fr: 'Sélectionner Reçu',
    ar: 'اختر وصل'
  },
  noReceipt: {
    en: 'No Receipt',
    fr: 'Aucun Reçu',
    ar: 'لا يوجد وصل'
  },
  invoiceNumber: {
    en: 'Invoice Number',
    fr: 'Numéro de Facture',
    ar: 'رقم الفاتورة'
  },
  clientPhone: {
    en: 'Client Phone',
    fr: 'Téléphone Client',
    ar: 'هاتف العميل'
  },
  clientAddress: {
    en: 'Client Address',
    fr: 'Adresse Client',
    ar: 'عنوان العميل'
  },
  invoiceDate: {
    en: 'Invoice Date',
    fr: 'Date de Facture',
    ar: 'تاريخ الفاتورة'
  },
  dueDate: {
    en: 'Due Date',
    fr: 'Date d\'Échéance',
    ar: 'تاريخ الاستحقاق'
  },
  items: {
    en: 'Items',
    fr: 'Articles',
    ar: 'العناصر'
  },
  addItem: {
    en: 'Add Item',
    fr: 'Ajouter Article',
    ar: 'إضافة عنصر'
  },
  productName: {
    en: 'Product Name',
    fr: 'Nom du Produit',
    ar: 'اسم المنتج'
  },
  description: {
    en: 'Description',
    fr: 'Description',
    ar: 'الوصف'
  },
  quantity: {
    en: 'Quantity',
    fr: 'Quantité',
    ar: 'الكمية'
  },
  unitPrice: {
    en: 'Unit Price',
    fr: 'Prix Unitaire',
    ar: 'السعر للوحدة'
  },
  subtotal: {
    en: 'Subtotal',
    fr: 'Sous-total',
    ar: 'المجموع الفرعي'
  },
  tax: {
    en: 'Tax',
    fr: 'TVA',
    ar: 'الضريبة'
  },
  notes: {
    en: 'Notes',
    fr: 'Notes',
    ar: 'ملاحظات'
  },
  createInvoice: {
    en: 'Create Invoice',
    fr: 'Créer Facture',
    ar: 'إنشاء فاتورة'
  },
  saving: {
    en: 'Saving',
    fr: 'Sauvegarde...',
    ar: 'جاري الحفظ'
  },
  advancePayment: {
    en: 'Advance Payment',
    fr: 'Acompte',
    ar: 'دفعة مقدمة'
  },
  balance: {
    en: 'Balance',
    fr: 'Solde',
    ar: 'الرصيد'
  },
  draft: {
    en: 'Draft',
    fr: 'Brouillon',
    ar: 'مسودة'
  },
  pending: {
    en: 'Pending',
    fr: 'En Attente',
    ar: 'في الانتظار'
  },
  paid: {
    en: 'Paid',
    fr: 'Payé',
    ar: 'مدفوع'
  },
  overdue: {
    en: 'Overdue',
    fr: 'En Retard',
    ar: 'متأخر'
  },
  totalInvoices: {
    en: 'Total Invoices',
    fr: 'Total Factures'
  },
  paidInvoices: {
    en: 'Paid Invoices',
    fr: 'Factures Payées'
  },
  pendingInvoices: {
    en: 'Pending Invoices',
    fr: 'Factures En Attente'
  },
  totalAmount: {
    en: 'Total Amount',
    fr: 'Montant Total'
  },
  invoiceDetails: {
    en: 'Invoice Details',
    fr: 'Détails de la Facture'
  },
  invoiceAndClientDetails: {
    en: 'Invoice & Client Details',
    fr: 'Détails Facture & Client'
  },
  paymentAndAssuranceDetails: {
    en: 'Payment & Assurance Details',
    fr: 'Détails Paiement & Assurance'
  },
  paymentSummary: {
    en: 'Payment Summary',
    fr: 'Résumé de Paiement'
  },
  itemsTotal: {
    en: 'Items Total',
    fr: 'Total Articles'
  },
  assuranceTotal: {
    en: 'Assurance Total',
    fr: 'Total Assurance'
  },
  balanceDue: {
    en: 'Balance Due',
    fr: 'Solde Dû'
  },
  editInvoice: {
    en: 'Edit Invoice',
    fr: 'Modifier Facture'
  },
  updateInvoice: {
    en: 'Update Invoice',
    fr: 'Mettre à Jour Facture'
  },
  clientAssurance: {
    en: 'Client Assurance',
    fr: 'Assurance Client'
  },
  prescription: {
    en: 'Prescription',
    fr: 'Prescription'
  },
  add: {
    en: 'ADD',
    fr: 'ADD'
  },
   noItemsAdded: {
    en: 'No items added yet',
    fr: 'Aucun article ajouté'
  }
};

const useTranslations = () => {
  const { language } = useLanguage();

  return React.useMemo(
    () => ({
      // Products
      newProduct: language === 'fr' ? 'Nouveau produit' : 'New product',
      editProduct: language === 'fr' ? 'Modifier le produit' : 'Edit product',
      addProduct: language === 'fr' ? 'Ajouter un nouveau produit' : 'Add new product',
      searchProducts: language === 'fr' ? 'Rechercher des produits...' : 'Search products...',
      noProductsFound: language === 'fr' ? 'Aucun produit trouvé' : 'No products found',
      productName: language === 'fr' ? 'Nom du produit' : 'Product Name',
      price: language === 'fr' ? 'Prix' : 'Price',
      costTTC: language === 'fr' ? 'Coût TTC' : 'Cost TTC',
      stock: language === 'fr' ? 'Stock' : 'Stock',
      stockStatus: language === 'fr' ? 'État du stock' : 'Stock Status',
      category: language === 'fr' ? 'Catégorie' : 'Category',
      index: language === 'fr' ? 'Indice' : 'Index',
      treatment: language === 'fr' ? 'Traitement' : 'Treatment',
      company: language === 'fr' ? 'Entreprise' : 'Company',
      gamma: language === 'fr' ? 'Gamme' : 'Gamma',
      image: language === 'fr' ? 'Image' : 'Image',
      generateNameAuto: language === 'fr' ? 'Générer automatiquement le nom' : 'Auto-generate name',
      autoGenerateName: language === 'fr' ? 'Générer nom automatiquement' : 'Auto Generate Name',
      save: language === 'fr' ? 'Enregistrer' : 'Save',
      cancel: language === 'fr' ? 'Annuler' : 'Cancel',
      edit: language === 'fr' ? 'Modifier' : 'Edit',
      delete: language === 'fr' ? 'Supprimer' : 'Delete',
      import: language === 'fr' ? 'Importer' : 'Import',
      saveAll: language === 'fr' ? 'Tout enregistrer' : 'Save All',
      auto: language === 'fr' ? 'Auto' : 'Auto',
      // Categories
      singleVisionLenses: language === 'fr' ? 'Verres unifocaux' : 'Single Vision Lenses',
      progressiveLenses: language === 'fr' ? 'Verres progressifs' : 'Progressive Lenses',
      frames: language === 'fr' ? 'Montures' : 'Frames',
      sunglasses: language === 'fr' ? 'Lunettes de soleil' : 'Sunglasses',
      contactLenses: language === 'fr' ? 'Lentilles de contact' : 'Contact Lenses',
      accessories: language === 'fr' ? 'Accessoires' : 'Accessories',
      service: language === 'fr' ? 'Service' : 'Service',
      other: language === 'fr' ? 'Autre' : 'Other',

      // Indexes
      index56: language === 'fr' ? '1.56' : '1.56',
      index6: language === 'fr' ? '1.6' : '1.6',
      index67: language === 'fr' ? '1.67' : '1.67',
      index74: language === 'fr' ? '1.74' : '1.74',
      index50: language === 'fr' ? '1.50' : '1.50',
      index59: language === 'fr' ? '1.59' : '1.59',

      // Treatments
      ar: language === 'fr' ? 'Anti-reflet' : 'AR',
      blue: language === 'fr' ? 'Bleu' : 'Blue',
      white: language === 'fr' ? 'Blanc' : 'White',
      photochromic: language === 'fr' ? 'Photochromique' : 'Photochromic',
      polarized: language === 'fr' ? 'Polarisé' : 'Polarized',
      uvProtection: language === 'fr' ? 'Protection UV' : 'UV Protection',
      tint: language === 'fr' ? 'Teinte' : 'Tint',

      // Companies
      indo: language === 'fr' ? 'Indo' : 'Indo',
      abLens: language === 'fr' ? 'ABlens' : 'ABlens',
      essilor: language === 'fr' ? 'Essilor' : 'Essilor',
      glassAndLens: language === 'fr' ? 'GLASSANDLENS' : 'GLASSANDLENS',
      optifak: language === 'fr' ? 'Optifak' : 'Optifak',
    }),
    [language]
  );
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
  translate: () => '',
  translations: allTranslations,
  direction: 'ltr',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage if available
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'fr';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);

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

  const translate = (key: string): string => {
    return t(key);
  };

  const direction = 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translate, translations: allTranslations, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};