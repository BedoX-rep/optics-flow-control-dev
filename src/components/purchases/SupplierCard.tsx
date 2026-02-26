import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Building2, ShoppingBag, DollarSign } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { motion } from 'framer-motion';

interface Supplier {
    id: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

interface Purchase {
    id: string;
    supplier_id?: string;
    amount: number;
    amount_ttc?: number;
}

interface SupplierCardProps {
    supplier: Supplier;
    purchases: Purchase[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (id: string) => void;
    t: (key: string) => string;
}

const SupplierCard = ({
    supplier,
    purchases,
    onEdit,
    onDelete,
    t
}) => {
    const supplierPurchases = purchases.filter(p => p.supplier_id === supplier.id);
    const totalAmount = supplierPurchases.reduce((sum, p) => sum + (p.amount_ttc || p.amount || 0), 0);

    return (
        <Card className="overflow-hidden transition-all duration-300 border-l-4 border-l-indigo-400 bg-white hover:border-l-indigo-600 hover:shadow-xl hover:shadow-indigo-500/10 font-inter relative group">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm transition-transform group-hover:scale-110">
                                <Building2 className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight truncate uppercase leading-tight">
                                    {supplier.name}
                                </h3>
                                {supplier.phone && (
                                    <div className="flex items-center gap-1.5 text-indigo-500 mt-0.5">
                                        <Phone className="h-3 w-3" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">{supplier.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(supplier)}
                                className="h-8 w-8 rounded-xl hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-100 transition-all"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(supplier.id)}
                                className="h-8 w-8 rounded-xl hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {supplier.address && (
                        <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100/50">
                            <p className="text-xs font-bold text-slate-500 line-clamp-1 italic">
                                {supplier.address}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100 transition-colors group-hover:bg-indigo-50">
                            <div className="flex items-center gap-2 mb-1">
                                <ShoppingBag className="h-3 w-3 text-indigo-600" />
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.15em]">{t('totalPurchases')}</span>
                            </div>
                            <p className="text-xl font-black text-indigo-700 tracking-tight leading-none">
                                {supplierPurchases.length}
                            </p>
                        </div>

                        <div className="bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 transition-colors group-hover:bg-emerald-50">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.15em]">{t('totalAmount')}</span>
                            </div>
                            <p className="text-xl font-black text-emerald-700 tracking-tight leading-none">
                                {totalAmount.toFixed(2)} <span className="text-[10px] font-black opacity-60">DH</span>
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SupplierCard;
