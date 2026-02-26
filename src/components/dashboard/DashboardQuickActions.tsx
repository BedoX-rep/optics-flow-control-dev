import React from 'react';
import { motion } from 'framer-motion';
import { Plus, UserPlus, Package, ArrowUpRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
    label: string;
    icon: React.ReactNode;
    color: 'teal' | 'indigo' | 'emerald' | 'orange';
    onClick: () => void;
}

const QuickActionButton = ({ label, icon, color, onClick }: QuickActionButtonProps) => {
    const colorStyles = {
        teal: "bg-teal-50 text-teal-700 hover:bg-teal-600 border-teal-100 shadow-teal-100/50",
        indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 border-indigo-100 shadow-indigo-100/50",
        emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 border-emerald-100 shadow-emerald-100/50",
        orange: "bg-orange-50 text-orange-700 hover:bg-orange-600 border-orange-100 shadow-orange-100/50",
    };

    return (
        <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-6 rounded-[24px] border transition-all duration-300 group gap-3 shadow-md hover:shadow-xl hover:text-white relative overflow-hidden",
                colorStyles[color]
            )}
        >
            <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 rounded-full -mr-6 -mt-6 blur-xl group-hover:scale-150 transition-transform" />

            <div className="p-3 rounded-2xl bg-white/80 group-hover:bg-white/20 shadow-sm transition-colors relative z-10">
                {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
            </div>
            <span className="text-xs font-black tracking-widest uppercase relative z-10">{label}</span>
        </motion.button>
    );
};

const DashboardQuickActions = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-none rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('quickActions')}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('productivityBoost')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                    label={t('newReceipt')}
                    icon={<Plus />}
                    color="teal"
                    onClick={() => navigate('/receipts')}
                />
                <QuickActionButton
                    label={t('addClient')}
                    icon={<UserPlus />}
                    color="indigo"
                    onClick={() => navigate('/clients')}
                />
                <QuickActionButton
                    label={t('addProduct')}
                    icon={<Package />}
                    color="emerald"
                    onClick={() => navigate('/products')}
                />
                <QuickActionButton
                    label={t('viewStats')}
                    icon={<ArrowUpRight />}
                    color="orange"
                    onClick={() => navigate('/financial')}
                />
            </div>
        </motion.div>
    );
};

export default DashboardQuickActions;
