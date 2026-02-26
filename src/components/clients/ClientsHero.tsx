import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Users, Upload, RefreshCw, Star, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';

interface ClientsHeroProps {
    onNewClient: () => void;
    onImport: () => void;
    onFindDuplicates: () => void;
    onSaveAll?: () => void;
    hasEditedClients?: boolean;
    isSavingAll?: boolean;
    clientsCount: number;
    renewalCount: number;
    favoritesCount: number;
}

const ClientsHero = ({
    onNewClient,
    onImport,
    onFindDuplicates,
    onSaveAll,
    hasEditedClients,
    isSavingAll,
    clientsCount,
    renewalCount,
    favoritesCount
}: ClientsHeroProps) => {
    const { t } = useLanguage();

    return (
        <div className="w-full px-4 lg:px-6 pt-6 relative z-10">
            <div className="w-full bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 text-white rounded-[32px] py-10 px-8 md:px-12 shadow-xl relative overflow-hidden mb-8">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full -ml-40 -mb-40 blur-3xl" />

                <div className="w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col xl:flex-row xl:items-center justify-between gap-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white uppercase mb-2">
                                        {t('clientsOverview') || 'Clients Overview'}
                                    </h1>
                                    <p className="text-white/70 font-medium tracking-wide text-sm uppercase">
                                        {t('manageClients') || 'Manage your customer base'}
                                    </p>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-white/20" />

                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100/60 mb-1">Total</span>
                                    <span className="text-2xl font-black text-white">{clientsCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/60 mb-1">Renewals</span>
                                    <span className="text-2xl font-black text-amber-300">{renewalCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/60 mb-1">Favorites</span>
                                    <span className="text-2xl font-black text-rose-300">{favoritesCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {hasEditedClients && onSaveAll && (
                                <Button
                                    onClick={onSaveAll}
                                    disabled={isSavingAll}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Save className="mr-2 h-5 w-5" /> {t('saveAll') || 'Save All'}
                                </Button>
                            )}

                            <Button
                                onClick={onFindDuplicates}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 h-12 md:h-14 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <RefreshCw className="mr-3 h-5 w-5" /> {t('findDuplicates') || 'Duplicates'}
                            </Button>

                            <Button
                                onClick={onImport}
                                className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xl rounded-2xl px-6 h-12 md:h-14 font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Upload className="mr-3 h-5 w-5" /> {t('import')}
                            </Button>

                            <Button
                                onClick={onNewClient}
                                className="bg-teal-400 hover:bg-teal-300 text-teal-950 border-0 rounded-2xl px-8 h-12 md:h-14 font-black shadow-2xl shadow-teal-900/40 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="mr-3 h-5 w-5" /> {t('newClient')}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ClientsHero;
