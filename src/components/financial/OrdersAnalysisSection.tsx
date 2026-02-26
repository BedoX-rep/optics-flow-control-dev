import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Calendar, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
    id: string;
    productName: string;
    category: string;
    quantity: number;
    price: number;
    totalRevenue: number;
    cost: number;
    totalCost: number;
    profit: number;
    paidAtDelivery: boolean;
    stockStatus: string;
    company: string;
}

interface OrdersAnalysisSectionProps {
    receipts: any[];
    itemsLoading: boolean;
    includePaidAtDelivery: boolean;
    setIncludePaidAtDelivery: (val: boolean) => void;
    categories: string[];
    companies: string[];
}

const OrdersAnalysisSection: React.FC<OrdersAnalysisSectionProps> = ({
    receipts,
    itemsLoading,
    includePaidAtDelivery,
    setIncludePaidAtDelivery,
    categories,
    companies,
}) => {
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState('all');
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchItem, setSearchItem] = useState('');

    const allFilteredItems = useMemo(() => {
        return receipts.flatMap((r: any) =>
            (r.receipt_items || []).map((i: any) => ({
                productName: i.custom_item_name || i.product?.name || 'Unknown',
                category: i.product?.category || 'Unknown',
                company: i.product?.company || 'None',
                paidAtDelivery: Boolean(i.paid_at_delivery)
            }))
        ).filter(i => includePaidAtDelivery || !i.paidAtDelivery);
    }, [receipts, includePaidAtDelivery]);

    const dynamicCompanies = useMemo(() => {
        const filtered = allFilteredItems.filter(i => {
            if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
            if (selectedProduct !== 'all' && i.productName !== selectedProduct) return false;
            if (searchItem !== '' && !i.productName.toLowerCase().includes(searchItem.toLowerCase())) return false;
            return true;
        });
        return Array.from(new Set(filtered.map(i => i.company))).sort();
    }, [allFilteredItems, selectedCategory, selectedProduct, searchItem]);

    const dynamicProducts = useMemo(() => {
        const filtered = allFilteredItems.filter(i => {
            if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
            if (selectedCompany !== 'all' && i.company !== selectedCompany) return false;
            if (searchItem !== '' && !i.productName.toLowerCase().includes(searchItem.toLowerCase())) return false;
            return true;
        });
        return Array.from(new Set(filtered.map(i => i.productName))).sort();
    }, [allFilteredItems, selectedCategory, selectedCompany, searchItem]);

    const toggleOrder = (orderId: string) => {
        const next = new Set(expandedOrders);
        if (next.has(orderId)) next.delete(orderId);
        else next.add(orderId);
        setExpandedOrders(next);
    };

    const processedOrders = receipts.map((receipt: any) => {
        const items = (receipt.receipt_items || []).map((item: any, idx: number) => ({
            id: `${receipt.id}-${idx}`,
            productName: item.custom_item_name || item.product?.name || `Product ${idx + 1}`,
            category: item.product?.category || 'Unknown',
            company: item.product?.company || 'None',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            cost: Number(item.cost) || 0,
            totalRevenue: Number(item.price) * (Number(item.quantity) || 1),
            totalCost: Number(item.cost) * (Number(item.quantity) || 1),
            profit: (Number(item.price) - Number(item.cost)) * (Number(item.quantity) || 1),
            paidAtDelivery: Boolean(item.paid_at_delivery),
            stockStatus: item.product?.stock_status || 'Order'
        }));

        return {
            id: receipt.id,
            createdAt: receipt.created_at,
            total: Number(receipt.total) || 0,
            totalDiscount: Number(receipt.total_discount) || 0,
            customerName: receipt.clients?.name || 'Unknown',
            items: items.filter((item: any) => {
                if (!includePaidAtDelivery && item.paidAtDelivery) return false;
                const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                const matchesCompany = selectedCompany === 'all' || item.company === selectedCompany;
                const matchesProduct = selectedProduct === 'all' || item.productName === selectedProduct;
                const matchesSearch = searchItem === '' || item.productName.toLowerCase().includes(searchItem.toLowerCase());
                return matchesCategory && matchesCompany && matchesProduct && matchesSearch;
            })
        };
    }).filter((order: any) => order.items.length > 0);

    const filteredTotalAmount = processedOrders.reduce((sum, order) => sum + order.total, 0);
    const filteredTotalItems = processedOrders.reduce((sum, order) => sum + order.items.length, 0);
    const filteredTotalDiscount = processedOrders.reduce((sum, order) => sum + order.totalDiscount, 0);

    return (
        <div className="mb-12">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group mb-4"
            >
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-10 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full transition-all group-hover:w-16 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {t('comprehensiveOrdersAnalysis')}
                    </h3>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-2 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all shadow-sm">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-white transition-colors">
                        {isExpanded ? t('collapse') || 'Minimize' : t('expand') || 'Review'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600 group-hover:text-white" /> : <ChevronDown className="w-4 h-4 text-teal-600" />}
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6">
                            <div className="bg-white border-2 border-slate-900/10 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50">

                                {/* Smarter, Inline Filters Bar */}
                                <div className="p-6 md:p-8 border-b border-slate-100 bg-white flex flex-col xl:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                                        <div className="p-2 bg-slate-50 rounded-full hidden md:flex items-center justify-center shrink-0">
                                            <Filter className="w-4 h-4 text-teal-600" />
                                        </div>

                                        <Select value={selectedCategory} onValueChange={(val) => {
                                            setSelectedCategory(val);
                                            setSelectedCompany('all');
                                            setSelectedProduct('all');
                                        }}>
                                            <SelectTrigger className="w-auto min-w-[140px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-teal-500 focus:ring-teal-500">
                                                <SelectValue placeholder={t('category')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allCategories') || 'All Categories'}</SelectItem>
                                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>

                                        <Select value={selectedCompany} onValueChange={(val) => {
                                            setSelectedCompany(val);
                                            setSelectedProduct('all');
                                        }}>
                                            <SelectTrigger className="w-auto min-w-[130px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-teal-500 focus:ring-teal-500">
                                                <SelectValue placeholder={t('company')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allCompanies') || 'All'}</SelectItem>
                                                {dynamicCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>

                                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                            <SelectTrigger className="w-auto min-w-[140px] bg-slate-50 border-slate-200 rounded-2xl h-10 text-xs font-black transition-all hover:border-teal-500 focus:ring-teal-500">
                                                <SelectValue placeholder={t('product')} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-200">
                                                <SelectItem value="all">{t('allProducts') || 'All'}</SelectItem>
                                                {dynamicProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-4 w-full xl:w-auto">
                                        <div className="relative w-full xl:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchItem}
                                                onChange={(e) => setSearchItem(e.target.value)}
                                                placeholder={t('itemName') || 'Search Product...'}
                                                className="w-full pl-9 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 outline-none hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="inline-flex items-center px-4 py-2 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest rounded-2xl shrink-0">
                                            {processedOrders.length} {t('orders')}
                                        </div>
                                    </div>
                                </div>

                                {/* List Container */}
                                <div className="p-8 md:p-10 bg-slate-50/50">
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {processedOrders.length > 0 ? (
                                            processedOrders.map((order: any) => (
                                                <div key={order.id} className="flex flex-col p-6 rounded-3xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-900/10 transition-all group overflow-hidden">
                                                    <div
                                                        onClick={() => toggleOrder(order.id)}
                                                        className="flex flex-col md:flex-row justify-between gap-6 cursor-pointer"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[10px] font-black text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                                #{order.id.substring(0, 3)}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-slate-900 tracking-tight text-lg leading-none mb-2">{order.customerName}</h5>
                                                                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                                                    </span>
                                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-teal-600">
                                                                        {order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITEMS'}
                                                                    </span>
                                                                    {order.totalDiscount > 0 && (
                                                                        <span className="bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-md text-yellow-700 font-bold">
                                                                            -{order.totalDiscount.toLocaleString()} DH
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right flex items-center justify-between md:flex-col md:items-end md:justify-start">
                                                            <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                                                {order.total.toLocaleString()} <span className="text-sm font-bold text-slate-500 ml-1">DH</span>
                                                            </p>
                                                            <div className="mt-2 text-slate-400 group-hover:text-teal-600 transition-colors p-2 bg-slate-50 rounded-full md:bg-transparent md:p-0">
                                                                {expandedOrders.has(order.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedOrders.has(order.id) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden mt-6 pt-6 border-t border-slate-100"
                                                            >
                                                                <div className="grid grid-cols-12 gap-4 px-4 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100/50 mb-3">
                                                                    <div className="col-span-6">{t('product')}</div>
                                                                    <div className="col-span-2 text-center">{t('qty')}</div>
                                                                    <div className="col-span-2 text-right">{t('price')}</div>
                                                                    <div className="col-span-2 text-right">{t('total')}</div>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {order.items.map((item: any) => (
                                                                        <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50/50 rounded-2xl items-center hover:bg-slate-100/80 transition-all group/item border border-transparent hover:border-slate-200">
                                                                            <div className="col-span-6 group/progress relative">
                                                                                <div className="absolute left-[-16px] top-0 bottom-0 w-1 bg-teal-100 group-hover/item:bg-teal-600 transition-colors rounded-full" />
                                                                                <p className="text-sm font-black text-slate-900">{item.productName}</p>
                                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white text-slate-900 px-2 py-0.5 rounded-md border border-slate-200">{t(item.category)}</span>
                                                                                    {item.company !== 'None' && (
                                                                                        <span className="text-[9px] font-black uppercase tracking-widest bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{item.company}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-2 text-center text-sm font-black text-slate-900">
                                                                                ×{item.quantity}
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm font-bold text-slate-600">
                                                                                {item.price.toLocaleString()}
                                                                            </div>
                                                                            <div className="col-span-2 text-right text-sm font-black text-teal-600">
                                                                                {item.totalRevenue.toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-40 flex items-center justify-center bg-white border-2 border-dashed border-slate-300 rounded-[24px]">
                                                <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">{t('noOrdersFound')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Footer */}
                                    <div className="mt-10 bg-slate-900 rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/40 rounded-full -mr-24 -mt-24 blur-3xl transition-all" />
                                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full -ml-20 -mb-20 blur-3xl transition-all" />

                                        <div className="relative z-10 flex flex-col xl:flex-row justify-between xl:items-end gap-8">
                                            <div>
                                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] block mb-2">
                                                    {t('totalAmount')}
                                                </span>
                                                <p className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                                    {filteredTotalAmount.toLocaleString()} <span className="text-lg font-bold text-slate-500 ml-1">DH</span>
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 md:gap-12">
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('totalDiscount') || 'Total Discount'}
                                                    </span>
                                                    <p className="text-2xl font-black text-yellow-400">
                                                        {filteredTotalDiscount.toLocaleString()} <span className="text-sm font-bold text-slate-500">DH</span>
                                                    </p>
                                                </div>
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('items')}
                                                    </span>
                                                    <p className="text-2xl font-black text-emerald-400">
                                                        {filteredTotalItems} <span className="text-sm font-bold text-slate-500">{t('items')}</span>
                                                    </p>
                                                </div>
                                                <div className="relative pl-6">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-full" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                                                        {t('orders')}
                                                    </span>
                                                    <p className="text-2xl font-black text-cyan-400">
                                                        {processedOrders.length} <span className="text-sm font-bold text-slate-500">{t('orders')}</span>
                                                    </p>
                                                </div>
                                                <div className="hidden lg:block h-5 w-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.8)] animate-pulse ml-2" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrdersAnalysisSection;
