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
  singleVisionLenses: {
    en: 'Single Vision Lenses',
    fr: 'Verres de Vision Simple'
  },
  progressiveLenses: {
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
  contactLenses: {
    en: 'Contact Lenses',
    fr: 'Lentilles de Contact'
  },
  accessories: {
    en: 'Accessories',
    fr: 'Accessoires'
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
  }
};

const receiptTranslations: Translations = {
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
    fr: 'À vie'
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
const allTranslations: Translations = {
  ...homeTranslations,
  ...dashboardTranslations,
  ...productTranslations,
  ...pricingTranslations,
  ...receiptTranslations,
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
  },
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
    return (savedLanguage as Language) || 'en';
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