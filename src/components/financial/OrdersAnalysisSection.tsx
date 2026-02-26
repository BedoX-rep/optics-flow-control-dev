import React, { useState, useMemo } from 'react';
import { Package, ShoppingCart, Filter, ChevronDown, ChevronUp, User, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

interface Order {
    id: string;
    createdAt: string;
    total: number;
    customerName?: string;
    items: OrderItem[];
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
    const [isCollapsed, setIsCollapsed] = useState(true);
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
            total: receipt.total || 0,
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

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden mb-10 rounded-3xl">
            <CardHeader
                className="border-b border-slate-50 px-8 py-6 bg-slate-50/30 cursor-pointer hover:bg-slate-100/30 transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-teal-600" />
                            {t('comprehensiveOrdersAnalysis')}
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1 font-medium italic">
                            {t('detailedAnalysisAllOrders')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setIncludePaidAtDelivery(!includePaidAtDelivery);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-100 transition-all hover:bg-slate-50 cursor-pointer shadow-sm group"
                        >
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                includePaidAtDelivery ? "bg-teal-600 border-teal-600" : "border-slate-300"
                            )}>
                                {includePaidAtDelivery && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none">
                                {t('includePaidAtDelivery')}
                            </Label>
                        </div>
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 transition-colors ml-2">
                            {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-teal-600" />}
                        </div>
                    </div>
                </div>
            </CardHeader>

            {!isCollapsed && (
                <CardContent className="px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('category')}</Label>
                            <Select value={selectedCategory} onValueChange={(val) => {
                                setSelectedCategory(val);
                                setSelectedCompany('all');
                                setSelectedProduct('all');
                            }}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-100 rounded-2xl text-xs font-poppins font-bold h-11 focus:ring-teal-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('company')}</Label>
                            <Select value={selectedCompany} onValueChange={(val) => {
                                setSelectedCompany(val);
                                setSelectedProduct('all');
                            }}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-100 rounded-2xl text-xs font-poppins font-bold h-11 focus:ring-teal-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {dynamicCompanies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('product')}</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-100 rounded-2xl text-xs font-poppins font-bold h-11 focus:ring-teal-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 font-poppins">
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {dynamicProducts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mb-8">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('itemName') || 'Item Name'}</Label>
                        <input
                            type="text"
                            value={searchItem}
                            onChange={(e) => setSearchItem(e.target.value)}
                            placeholder="Search for a specific product inside orders..."
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl text-xs font-bold h-11 px-4 focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {processedOrders.length > 0 ? (
                            processedOrders.map((order: any) => (
                                <div key={order.id} className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/30">
                                    <div
                                        onClick={() => toggleOrder(order.id)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                    {order.customerName}
                                                    <span className="text-[10px] font-medium text-slate-400 font-mono">#{order.id.substring(0, 8)}</span>
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                                                    {order.total.toLocaleString()} <span className="text-xs font-medium opacity-50">DH</span>
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {order.items.length} {t('items')}
                                                </p>
                                            </div>
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-teal-50 transition-colors">
                                                {expandedOrders.has(order.id) ? <ChevronUp className="h-4 w-4 text-teal-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                            </div>
                                        </div>
                                    </div>

                                    {expandedOrders.has(order.id) && (
                                        <div className="px-5 pb-5 space-y-3">
                                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <div className="col-span-6">{t('product')}</div>
                                                <div className="col-span-2 text-center">{t('qty')}</div>
                                                <div className="col-span-2 text-right">{t('price')}</div>
                                                <div className="col-span-2 text-right">{t('total')}</div>
                                            </div>
                                            {order.items.map((item: any) => (
                                                <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 bg-white rounded-2xl border border-slate-50 items-center hover:border-teal-100 transition-colors group/item">
                                                    <div className="col-span-6">
                                                        <p className="text-xs font-bold text-slate-700">{item.productName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[8px] font-bold uppercase tracking-tight bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded-md">{item.category}</span>
                                                            <span className="text-[8px] font-bold uppercase tracking-tight bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">{item.company}</span>
                                                            {item.paidAtDelivery && <span className="text-[8px] font-bold uppercase tracking-tight bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md">Paid at Delivery</span>}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 text-center">
                                                        <span className="text-xs font-black text-slate-400">×{item.quantity}</span>
                                                    </div>
                                                    <div className="col-span-2 text-right text-xs font-bold text-slate-600">
                                                        {item.price.toLocaleString()}
                                                    </div>
                                                    <div className="col-span-2 text-right text-xs font-black text-teal-600">
                                                        {item.totalRevenue.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                <Package className="h-16 w-16 text-slate-200 mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('noOrdersFound')}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default OrdersAnalysisSection;
