import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface DashboardHeroProps {
    userName: string;
    onNewReceipt: () => void;
    onAddClient: () => void;
}

const DashboardHero = ({ userName, onNewReceipt, onAddClient }: DashboardHeroProps) => {
    const { t } = useLanguage();

    return (
        <div className="w-full px-6 lg:px-10 pt-8 relative z-10">
            <div className="w-full bg-gradient-to-br from-teal-600 via-teal-500 to-indigo-600 text-white rounded-[32px] py-8 px-8 md:px-10 shadow-xl relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full -ml-40 -mb-40 blur-3xl" />

                <div className="w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white uppercase">
                                {t('dashboardOverview')}
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={onNewReceipt}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-8 h-12 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Plus className="mr-3 h-5 w-5" /> {t('newReceipt')}
                            </Button>
                            <Button
                                onClick={onAddClient}
                                className="bg-teal-400 hover:bg-teal-300 text-teal-950 border-0 rounded-2xl px-8 h-12 font-black shadow-2xl shadow-teal-900/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus className="mr-3 h-5 w-5" /> {t('addClient')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;
