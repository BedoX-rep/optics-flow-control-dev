import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Package, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    category: string;
    stock: number;
    stock_status: string;
}

interface DashboardStockAlertsProps {
    products: Product[];
    isLoading: boolean;
}

const DashboardStockAlerts = ({ products, isLoading }: DashboardStockAlertsProps) => {
    const { t } = useLanguage();

    // Filter: Only show products with 'inStock' status but low quantity (<= 5)
    const lowStockProducts = products
        .filter(p => p.stock_status === 'inStock' && p.stock <= 5)
        .slice(0, 6);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-none rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden h-full"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-40" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('inventoryCritical')}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('lowStockAlerts')}</p>
                    </div>
                </div>
                <Link
                    to="/products"
                    className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors group"
                >
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                </Link>
            </div>

            <div className="space-y-4 relative z-10">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 animate-pulse">
                            <div className="h-10 w-10 rounded-xl bg-slate-100" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-2/3 bg-slate-100 rounded" />
                                <div className="h-2 w-1/3 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))
                ) : lowStockProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-emerald-500" />
                        </div>
                        <p className="text-slate-800 font-black tracking-tight mb-1">{t('allGood')}</p>
                        <p className="text-slate-400 text-xs font-medium">{t('inventoryStable') || "Your stock levels are currently optimal."}</p>
                    </div>
                ) : (
                    lowStockProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all border border-transparent hover:border-white group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-orange-50 transition-colors">
                                    <Package className="h-5 w-5 text-slate-400 group-hover:text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 tracking-tight">{product.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/50 border border-orange-100">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-black text-orange-600">{product.stock}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {lowStockProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 relative z-10">
                    <Link
                        to="/products"
                        className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-700 tracking-widest uppercase transition-all group"
                    >
                        {t('manageInventory')}
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            )}
        </motion.div>
    );
};

export default DashboardStockAlerts;
