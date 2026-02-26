import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, FileText, ShoppingCart, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';

interface ActivityItem {
    id: string;
    type: 'client' | 'receipt' | 'purchase';
    title: string;
    description: string;
    timestamp: string;
    amount?: number;
}

interface DashboardActivityProps {
    activity: ActivityItem[];
    isLoading: boolean;
}

const DashboardActivity = ({ activity, isLoading }: DashboardActivityProps) => {
    const { t } = useLanguage();

    const getIcon = (type: string) => {
        switch (type) {
            case 'client': return <User className="h-4 w-4" />;
            case 'receipt': return <FileText className="h-4 w-4" />;
            case 'purchase': return <ShoppingCart className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'client': return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
            case 'receipt': return "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]";
            case 'purchase': return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
            default: return "bg-slate-500";
        }
    };

    function formatTimeAgo(timestamp: string): string {
        const now = new Date();
        const pastDate = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return format(pastDate, 'MMM d');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-none rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden h-full"
        >
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('liveStream')}</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('recentActivity')}</p>
                    </div>
                </div>
            </div>

            <div className="relative pl-6 space-y-10 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100/50">
                {isLoading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="relative animate-pulse">
                            <div className="absolute -left-[27px] top-1 h-[14px] w-[14px] rounded-full bg-slate-100 border-2 border-white" />
                            <div className="space-y-2">
                                <div className="h-3 w-1/2 bg-slate-100 rounded" />
                                <div className="h-2 w-full bg-slate-50 rounded" />
                            </div>
                        </div>
                    ))
                ) : activity.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm italic font-medium">{t('noRecentActivity')}</div>
                ) : (
                    activity.map((item) => (
                        <div key={item.id} className="relative group">
                            <div className={cn(
                                "absolute -left-[27px] top-1 h-[14px] w-[14px] rounded-full border-2 border-white ring-4 ring-white z-10 transition-transform group-hover:scale-125",
                                getColor(item.type)
                            )} />

                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1 rounded bg-slate-50 text-slate-400">
                                            {getIcon(item.type)}
                                        </span>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{item.title}</p>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">{formatTimeAgo(item.timestamp)}</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed ml-7">{item.description}</p>
                                {item.amount && (
                                    <div className="mt-2 ml-7 flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-100">
                                            <span className="text-[10px] font-black text-teal-600 tracking-tight">DH {item.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default DashboardActivity;
